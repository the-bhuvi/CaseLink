export type Role = "complainant" | "officer" | "supervisor" | "admin";
export type CaseStatus = "received" | "under_review" | "in_progress" | "awaiting_information" | "escalated" | "disposed";
export type ReviewStatus = "pending" | "confirmed" | "rejected" | "needs_review";

export interface CaseItem {
  id: string; reference: string; institution_id: string | null; institution_name: string; institution_permanent_id: string | null;
  category: string; subject: string; assigned_bureau: string; assigned_officer_id: string | null; status: CaseStatus;
  priority: string; received_at: string; updated_at: string; due_at: string | null; closed_at: string | null; age_days: number; public_status: string;
}
export interface Page<T> { items: T[]; total: number; page: number; page_size: number; }
export interface DashboardSummary { total_cases: number; open_cases: number; overdue_cases: number; pending_overlap_alerts: number; cases_awaiting_action: number; }
export interface Institution { id: string; aicte_permanent_id: string | null; name: string; state: string; district: string; institution_type: string; }
export interface TimelineItem { id: string; action_type: string; description: string; previous_status: string | null; new_status: string | null; created_at: string; }
export interface Relationship {
  id: string; case_a: CaseItem; case_b: CaseItem; semantic_similarity: number | null; relationship_score: number | null;
  review_status: ReviewStatus; explanation: string; evidence_signals: string[]; model_version: string | null; created_at: string; reviewed_at: string | null;
}
export interface AnalyticsCases { by_status: Record<string, number>; }
export interface AnalyticsAgeing { buckets: Record<string, number>; }
export interface AnalyticsBureaus { by_bureau: Record<string, number>; }
export interface Notification { id: string; user_id: string; case_id: string | null; type: string; title: string; message: string; is_read: boolean; created_at: string; }
