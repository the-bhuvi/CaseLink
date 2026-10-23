import random
from datetime import datetime, timedelta, timezone

from supabase import create_client

from backend.app.config import settings
from backend.app.services.matching import normalize_text

random.seed(26264)

if not settings.supabase_url or not settings.supabase_service_role_key:
    raise SystemExit("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before running the seed.")

client = create_client(settings.supabase_url, settings.supabase_service_role_key)
existing = client.table("cases").select("id").eq("is_synthetic", True).limit(1).execute().data
if existing:
    print("Synthetic seed already present.")
    raise SystemExit(0)

institutions = []
for index in range(25):
    name = f"Synthetic Institute {index + 1:02d}"
    institutions.append({
        "aicte_permanent_id": f"SYN-{index + 1:04d}",
        "name": name,
        "normalized_name": normalize_text(name),
        "state": "Synthetic State",
        "district": f"District {(index % 5) + 1}",
        "institution_type": "Engineering College",
    })
institution_rows = client.table("institutions").insert(institutions).execute().data or []
now = datetime.now(timezone.utc)
statuses = ["received", "under_review", "in_progress", "awaiting_information", "escalated", "disposed"]
cases = []
for index in range(125):
    institution = institution_rows[index % len(institution_rows)]
    bureau = "RB" if index % 2 == 0 else "PGRC"
    description = f"Students report delayed scholarship processing and missing grievance response at {institution['name']}."
    if index in {10, 11, 50, 51}:
        description = "Students report delayed scholarship processing and no response to repeated grievance submissions."
    received = now - timedelta(days=(index * 3) % 90)
    status = statuses[index % len(statuses)]
    cases.append({
        "reference": f"CL-{now.year}-SYN{index + 1:03d}",
        "institution_id": institution["id"],
        "submitted_institution_name": institution["name"],
        "submitted_institution_id": institution["aicte_permanent_id"],
        "category": "Scholarship" if index % 3 == 0 else "Academic",
        "subject": f"Synthetic complaint {index + 1}",
        "description": description,
        "assigned_bureau": bureau,
        "status": status,
        "priority": ["low", "medium", "high", "critical"][index % 4],
        "received_at": received.isoformat(),
        "due_at": (received + timedelta(days=30)).isoformat(),
        "public_status": status.replace("_", " ").title(),
        "is_synthetic": True,
    })
case_rows = client.table("cases").insert(cases).execute().data or []
actions = [{"case_id": item["id"], "action_type": "seeded", "description": "Synthetic demonstration case created.", "new_status": item["status"], "visibility": "internal"} for item in case_rows]
client.table("case_actions").insert(actions).execute()
for left_index, right_index in ((10, 11), (50, 51)):
    left, right = case_rows[left_index], case_rows[right_index]
    first, second = sorted((left["id"], right["id"]))
    relationship = client.table("case_relationships").insert({
        "case_a_id": first,
        "case_b_id": second,
        "semantic_similarity": 0.82,
        "relationship_score": 0.86,
        "match_explanation": "Synthetic paraphrase pair for the human review workflow.",
        "evidence_json": {"signals": ["same institution", "paraphrased complaint"], "uncertainty": []},
        "model_version": "synthetic-seed",
    }).execute().data[0]
    client.table("coordination_alerts").insert({
        "relationship_id": relationship["id"],
        "title": "Synthetic overlap alert",
        "reason": "Seeded paraphrase pair requires human review.",
        "severity": "high",
        "recommended_action": "Compare both case histories.",
    }).execute()
print(f"Seeded {len(institution_rows)} synthetic institutions and {len(case_rows)} synthetic cases.")
