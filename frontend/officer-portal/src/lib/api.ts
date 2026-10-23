import type { AnalyticsAgeing, AnalyticsBureaus, AnalyticsCases, CaseItem, CaseStatus, DashboardSummary, Institution, Notification, Page, Relationship, ReviewStatus, TokenResponse, TimelineItem, User } from "@/types/api";

const baseUrl = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8000").replace(/\/$/, "");
const apiRoot = `${baseUrl}/api/v1`;

export class ApiError extends Error {
  status: number;
  code?: string;
  constructor(status: number, message: string, code?: string) { super(message); this.status = status; this.code = code; }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem("caselink_token");
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const response = await fetch(`${apiRoot}${path}`, { ...options, headers });
  if (response.status === 401) { localStorage.removeItem("caselink_token"); window.dispatchEvent(new Event("caselink:session-expired")); }
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new ApiError(response.status, body?.detail?.message || "The request could not be completed.", body?.detail?.code);
  }
  return response.json() as Promise<T>;
}

export const api = {
  login: (payload: { email: string; role: string; bureau_code?: string }) => request<TokenResponse>("/auth/demo-login", { method: "POST", body: JSON.stringify(payload) }),
  me: () => request<User>("/auth/me"),
  dashboard: () => request<DashboardSummary>("/dashboard/summary"),
  cases: (params: URLSearchParams) => request<Page<CaseItem>>(`/cases?${params.toString()}`),
  caseById: (id: string) => request<CaseItem>(`/cases/${id}`),
  updateCase: (id: string, body: Partial<{ status: CaseStatus; priority: string; next_action: string; due_at: string; assigned_bureau: string }>) => request<CaseItem>(`/cases/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  addAction: (id: string, body: { action_type: string; description: string; visibility: "internal" | "public"; new_status?: CaseStatus }) => request<TimelineItem>(`/cases/${id}/actions`, { method: "POST", body: JSON.stringify(body) }),
  timeline: (id: string) => request<TimelineItem[]>(`/public/complaints/${id}/timeline`),
  institutions: (q?: string) => request<Institution[]>(`/institutions${q ? `?q=${encodeURIComponent(q)}` : ""}`),
  institution: (id: string) => request<Institution>(`/institutions/${id}`),
  institutionCases: (id: string) => request<Page<CaseItem>>(`/institutions/${id}/cases`),
  alerts: () => request<Relationship[]>("/coordination/alerts"),
  related: (id: string) => request<Relationship[]>(`/cases/${id}/related`),
  reviewRelationship: (id: string, decision: ReviewStatus, reason: string) => request<Relationship>(`/coordination/relationships/${id}/review`, { method: "POST", body: JSON.stringify({ decision, reason }) }),
  detect: () => request<{ created: number; semantic_matching: string }>("/coordination/detect", { method: "POST" }),
  analyticsCases: () => request<AnalyticsCases>("/analytics/cases"),
  analyticsAgeing: () => request<AnalyticsAgeing>("/analytics/ageing"),
  analyticsBureaus: () => request<AnalyticsBureaus>("/analytics/bureaus"),
  notifications: () => request<Notification[]>("/notifications"),
  markNotification: (id: string) => request(`/notifications/${id}`, { method: "PATCH" }),
  exportCases: (params?: URLSearchParams) => `${apiRoot}/reports/cases.csv${params?.toString() ? `?${params}` : ""}`,
};
