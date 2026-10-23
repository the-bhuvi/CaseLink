import type { AnalyticsAgeing, AnalyticsBureaus, AnalyticsCases, CaseItem, CaseStatus, DashboardSummary, Institution, Notification, Page, Relationship, ReviewStatus, TimelineItem } from "@/types/api";

const baseUrl = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8000").replace(/\/$/, "");
const apiRoot = `${baseUrl}/api/v1`;
export class ApiError extends Error { status: number; code?: string; constructor(status: number, message: string, code?: string) { super(message); this.status = status; this.code = code; } }
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  if (!(options.body instanceof FormData)) headers.set("Content-Type", "application/json");
  const response = await fetch(`${apiRoot}${path}`, { ...options, headers });
  if (!response.ok) { const body = await response.json().catch(() => null); throw new ApiError(response.status, body?.detail?.message || "The request could not be completed.", body?.detail?.code); }
  return response.status === 204 ? {} as T : await response.json() as T;
}
export const api = {
  dashboard: () => request<DashboardSummary>("/dashboard/summary"),
  cases: (params: URLSearchParams) => request<Page<CaseItem>>(`/cases?${params.toString()}`),
  caseById: (id: string) => request<CaseItem>(`/cases/${id}`),
  updateCase: (id: string, body: Partial<{ status: CaseStatus; priority: string; next_action: string; due_at: string; assigned_bureau: string }>) => request<CaseItem>(`/cases/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  addAction: (id: string, body: { action_type: string; description: string; visibility: "internal" | "public"; new_status?: CaseStatus; next_action?: string; due_at?: string }) => request<TimelineItem>(`/cases/${id}/actions`, { method: "POST", body: JSON.stringify(body) }),
  timeline: (id: string) => request<TimelineItem[]>(`/public/complaints/${id}/timeline`),
  institutions: (q?: string) => request<Institution[]>(`/institutions${q ? `?q=${encodeURIComponent(q)}` : ""}`),
  institution: (id: string) => request<Institution>(`/institutions/${id}`),
  institutionCases: (id: string) => request<Page<CaseItem>>(`/institutions/${id}/cases`),
  alerts: () => request<Relationship[]>("/coordination/alerts"),
  related: (id: string) => request<Relationship[]>(`/cases/${id}/matches`),
  reviewRelationship: (id: string, decision: ReviewStatus, reason: string) => request<Relationship>(`/coordination/relationships/${id}/review`, { method: "POST", body: JSON.stringify({ decision, reason }) }),
  detect: () => request<{ created: number; semantic_matching: string }>("/coordination/detect", { method: "POST" }),
  analyze: (id: string) => request<{ created: number; semantic_matching: string }>(`/cases/${id}/analyze`, { method: "POST" }),
  analyticsCases: () => request<AnalyticsCases>("/analytics/cases"),
  analyticsAgeing: () => request<AnalyticsAgeing>("/analytics/ageing"),
  analyticsBureaus: () => request<AnalyticsBureaus>("/analytics/bureaus"),
  notifications: () => request<Notification[]>("/notifications"),
  markNotification: (id: string) => request(`/notifications/${id}`, { method: "PATCH" }),
  exportCases: (params?: URLSearchParams) => `${apiRoot}/reports/cases.csv${params?.toString() ? `?${params}` : ""}`,
};
