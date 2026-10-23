import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState, Loading } from "@/components/ui/Feedback";
import { titleCase } from "@/lib/format";

export function Analytics() {
  const cases = useQuery({ queryKey: ["analytics", "cases"], queryFn: api.analyticsCases }); const bureaus = useQuery({ queryKey: ["analytics", "bureaus"], queryFn: api.analyticsBureaus }); const ageing = useQuery({ queryKey: ["analytics", "ageing"], queryFn: api.analyticsAgeing });
  return <><PageHeader title="Analytics" subtitle="Database-derived workload and ageing views for operational planning." /><div className="grid gap-5 lg:grid-cols-2"><Chart title="Cases by status" data={cases.data ? Object.entries(cases.data.by_status).map(([name, value]) => ({ name: titleCase(name), value })) : []} /><Chart title="Cases by bureau" data={bureaus.data ? Object.entries(bureaus.data.by_bureau).map(([name, value]) => ({ name, value })) : []} /><Chart title="Case ageing" data={ageing.data ? Object.entries(ageing.data.buckets).map(([name, value]) => ({ name: name.replace("_", "–"), value })) : []} /></div></>;
}
function Chart({ title, data }: { title: string; data: { name: string; value: number }[] }) { return <div className="panel p-5"><h2 className="font-semibold text-navy">{title}</h2><p className="mt-1 text-xs text-muted">Live response from the analytics API</p>{!data.length ? <EmptyState label="No data available." /> : <div className="mt-5 h-64"><ResponsiveContainer><BarChart data={data}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#edf0f4" /><XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={11} /><YAxis allowDecimals={false} axisLine={false} tickLine={false} fontSize={11} /><Tooltip /><Bar dataKey="value" fill="#356AE6" radius={[5, 5, 0, 0]} /></BarChart></ResponsiveContainer></div>}</div>; }
