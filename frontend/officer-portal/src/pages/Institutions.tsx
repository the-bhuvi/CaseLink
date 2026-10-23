import { useQuery } from "@tanstack/react-query";
import { Search, University } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState, ErrorState, Loading } from "@/components/ui/Feedback";

export function Institutions() {
  const [search, setSearch] = useState(""); const query = useQuery({ queryKey: ["institutions", search], queryFn: () => api.institutions(search), placeholderData: (previous) => previous });
  return <><PageHeader title="Institution directory" subtitle="Verify institution identity and consolidate linked cases across bureaus." /><div className="panel overflow-hidden"><div className="border-b border-line p-4"><div className="relative max-w-xl"><Search className="absolute left-3 top-2.5 text-muted" size={16} /><input className="input pl-9" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search institution name or normalized identity" /></div></div>{query.isLoading ? <Loading /> : query.isError ? <ErrorState onRetry={() => void query.refetch()} /> : !query.data?.length ? <EmptyState label="No institutions match this search." /> : <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-3">{query.data.map((institution) => <Link to={`/institutions/${institution.id}`} className="rounded-xl border border-line p-5 transition hover:-translate-y-0.5 hover:border-blue/40 hover:shadow-sm" key={institution.id}><div className="flex items-start justify-between"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue/10 text-blue"><University size={19} /></div><span className="text-xs font-semibold text-muted">{institution.institution_type}</span></div><h2 className="mt-5 font-semibold text-navy">{institution.name}</h2><p className="mt-1 text-xs text-muted">{institution.aicte_permanent_id || "Permanent ID not recorded"}</p><div className="mt-4 border-t border-line pt-3 text-xs text-muted">{institution.district}, {institution.state}</div></Link>)}</div>}</div></>;
}
