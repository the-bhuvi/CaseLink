"""Extract and optionally import shortlisted institutions from the supplied PDF.

The PDF columns are S.No, APPLICATION NO, PERMANENT ID, and INSTITUTE NAME.
It has no state or district columns, so this script never invents locations.
"""

from __future__ import annotations

import argparse
import csv
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

APP_ID = re.compile(r"^1-\d+$")
ROW_WITH_APP = re.compile(r"^(\d+)\s+(1-\d+)$")
SERIAL = re.compile(r"^\d+$")


def normalize_text(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", " ", value.casefold()).strip()


def clean_name(lines: list[str]) -> str:
    return re.sub(r"\s+", " ", " ".join(lines)).strip()


def extract_records(pdf_path: Path) -> list[dict[str, str]]:
    import fitz

    records: list[dict[str, str]] = []
    current: dict[str, str] | None = None
    pending_serial: str | None = None
    pending_application: str | None = None

    document = fitz.open(pdf_path)
    for page in document:
        for raw_line in page.get_text("text").splitlines():
            line = re.sub(r"\s+", " ", raw_line).strip()
            if not line or line in {"S.No APPLICATION NO", "PERMANENT ID", "INSTITUTE NAME"}:
                continue

            row_match = ROW_WITH_APP.match(line)
            if row_match:
                if current:
                    current.pop("_permanent_checked", None)
                    current["name"] = clean_name(current.pop("_name_lines"))
                    records.append(current)
                current = {
                    "serial_no": row_match.group(1),
                    "application_no": row_match.group(2),
                    "permanent_id": "",
                    "_permanent_checked": False,
                    "_name_lines": [],
                }
                pending_serial = None
                pending_application = None
                continue

            if SERIAL.match(line):
                if current:
                    current.pop("_permanent_checked", None)
                    current["name"] = clean_name(current.pop("_name_lines"))
                    records.append(current)
                    current = None
                pending_serial = line
                continue

            if pending_serial and APP_ID.match(line):
                current = {
                    "serial_no": pending_serial,
                    "application_no": line,
                    "permanent_id": "",
                    "_permanent_checked": False,
                    "_name_lines": [],
                }
                pending_serial = None
                continue

            if pending_application and APP_ID.match(line):
                current = {
                    "serial_no": "",
                    "application_no": pending_application,
                    "permanent_id": line,
                    "_permanent_checked": True,
                    "_name_lines": [],
                }
                pending_application = None
                continue

            if APP_ID.match(line) and current is None:
                pending_application = line
                continue

            if current and not current["_permanent_checked"]:
                current["_permanent_checked"] = True
                if APP_ID.match(line):
                    current["permanent_id"] = line
                    continue
                current["_name_lines"].append(line)
                continue

            if current and current["permanent_id"]:
                current["_name_lines"].append(line)

    if current:
        current.pop("_permanent_checked", None)
        current["name"] = clean_name(current.pop("_name_lines"))
        records.append(current)

    invalid = [record for record in records if not record["application_no"] or not record["name"]]
    if invalid:
        details = "; ".join(str({key: value for key, value in row.items() if key != "_name_lines"}) for row in invalid[:3])
        raise ValueError(f"Could not parse {len(invalid)} institution rows; inspect the PDF format before importing: {details}")
    return records


def prepare_records(records: list[dict[str, str]]) -> tuple[list[dict[str, str]], list[dict[str, str]]]:
    prepared: list[dict[str, str]] = []
    flagged: list[dict[str, str]] = []
    seen_permanent: set[str] = set()
    for record in records:
        permanent_id = record["permanent_id"]
        output = {
            "source_serial_no": record["serial_no"],
            "application_no": record["application_no"],
            "permanent_id": permanent_id,
            "name": record["name"],
            "normalized_name": normalize_text(record["name"]),
            "location_status": "unknown_from_pdf",
        }
        if permanent_id and permanent_id in seen_permanent:
            flagged.append({**output, "review_reason": "duplicate permanent ID in source PDF"})
        prepared.append(output)
        if permanent_id:
            seen_permanent.add(permanent_id)
        if not permanent_id:
            flagged.append({**output, "review_reason": "missing permanent ID in source PDF"})
    return prepared, flagged


def write_csv(path: Path, rows: list[dict[str, str]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    fields = ["source_serial_no", "application_no", "permanent_id", "name", "normalized_name", "location_status"]
    with path.open("w", newline="", encoding="utf-8-sig") as handle:
        writer = csv.DictWriter(handle, fieldnames=fields)
        writer.writeheader()
        writer.writerows(rows)


def import_to_supabase(rows: list[dict[str, str]], batch_size: int = 250) -> tuple[int, int, int]:
    from supabase import create_client
    from backend.app.config import settings

    if not settings.supabase_url or not settings.supabase_service_role_key:
        raise RuntimeError("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before using --import.")
    client = create_client(settings.supabase_url, settings.supabase_service_role_key)
    legacy_schema = False
    try:
        client.table("institutions").select("source_application_no").limit(1).execute()
    except Exception as exc:
        if "source_application_no" not in str(exc):
            raise
        legacy_schema = True
    legacy_skipped = 0
    if legacy_schema:
        original_count = len(rows)
        unique_rows: dict[str, dict[str, str]] = {}
        for row in rows:
            if row["permanent_id"]:
                unique_rows.setdefault(row["permanent_id"], row)
        rows = list(unique_rows.values())
        legacy_skipped = original_count - len(rows)
    imported = 0
    failed = 0
    for start in range(0, len(rows), batch_size):
        payload = [
            {
                "aicte_permanent_id": row["permanent_id"] or None,
                **({"source_application_no": row["application_no"]} if not legacy_schema else {}),
                "name": row["name"],
                "normalized_name": row["normalized_name"],
                "institution_type": "Unknown",
                "state": "Unknown",
                "district": "Unknown",
            }
            for row in rows[start:start + batch_size]
        ]
        try:
            conflict_key = "aicte_permanent_id" if legacy_schema else "source_application_no"
            client.table("institutions").upsert(payload, on_conflict=conflict_key, ignore_duplicates=False).execute()
            imported += len(payload)
        except Exception:
            failed += len(payload)
    return imported, failed, legacy_skipped


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("pdf", type=Path)
    parser.add_argument("--csv", type=Path, default=Path("database/imported_institutions.csv"))
    parser.add_argument("--import", dest="do_import", action="store_true")
    args = parser.parse_args()

    raw = extract_records(args.pdf)
    rows, flagged = prepare_records(raw)
    write_csv(args.csv, rows)
    imported = failed = legacy_skipped = 0
    if args.do_import:
        imported, failed, legacy_skipped = import_to_supabase(rows)
    print(f"extracted={len(raw)} prepared={len(rows)} flagged={len(flagged)} csv={args.csv}")
    if args.do_import:
        print(f"imported_or_updated={imported} failed_batches_rows={failed}")
        if legacy_skipped:
            print(f"legacy_schema_skipped_rows={legacy_skipped}; run database\\enhancements_migration.sql and rerun to import flagged source rows")


if __name__ == "__main__":
    main()
