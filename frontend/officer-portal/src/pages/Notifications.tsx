import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, CheckCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState, ErrorState, Loading } from "@/components/ui/Feedback";
import { formatDateTime } from "@/lib/format";

export function Notifications() {
  const client = useQueryClient(); const query = useQuery({ queryKey: ["notifications"], queryFn: api.notifications }); const mark = useMutation({ mutationFn: api.markNotification, onSuccess: () => void client.invalidateQueries({ queryKey: ["notifications"] }) });
  return <><PageHeader title="Notifications" subtitle="Persistent assignments, due-date signals, and coordination requests." /> <div className="panel overflow-hidden">{query.isLoading ? <Loading /> : query.isError ? <ErrorState onRetry={() => void query.refetch()} /> : !query.data?.length ? <EmptyState label="You have no notifications." /> : <div className="divide-y divide-line">{query.data.map((item) => <div className={`flex items-start gap-4 p-5 ${item.is_read ? "" : "bg-blue/[.025]"}`} key={item.id}><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue/10 text-blue"><Bell size={17} /></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h2 className="font-semibold text-navy">{item.title}</h2>{!item.is_read && <span className="rounded-full bg-blue px-2 py-0.5 text-[10px] font-bold text-white">New</span>}</div><p className="mt-1 text-sm text-muted">{item.message}</p><div className="mt-2 text-xs text-slate-400">{formatDateTime(item.created_at)} {item.case_id && <Link className="ml-2 font-semibold text-blue" to={`/cases/${item.case_id}`}>Open case</Link>}</div></div>{!item.is_read && <button className="btn-secondary shrink-0 px-3 py-1.5 text-xs" onClick={() => mark.mutate(item.id)}><CheckCheck size={14} /> Read</button>}</div>)}</div>}</div></>;
}
