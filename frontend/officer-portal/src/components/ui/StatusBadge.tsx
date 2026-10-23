import { titleCase } from "@/lib/format";
import type { CaseStatus, ReviewStatus } from "@/types/api";

const colors: Record<string, string> = {
  received: "bg-slate-100 text-slate-700", under_review: "bg-amber-50 text-amber-700", in_progress: "bg-blue-50 text-blue-700",
  awaiting_information: "bg-violet-50 text-violet-700", escalated: "bg-rose-50 text-rose-700", disposed: "bg-emerald-50 text-emerald-700",
  pending: "bg-amber-50 text-amber-700", confirmed: "bg-emerald-50 text-emerald-700", rejected: "bg-slate-100 text-slate-600", needs_review: "bg-orange-50 text-orange-700",
};
export function StatusBadge({ value }: { value: CaseStatus | ReviewStatus | string }) {
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${colors[value] || "bg-slate-100 text-slate-700"}`}>{titleCase(value)}</span>;
}
