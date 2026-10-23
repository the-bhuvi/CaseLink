export type CaseStatus =
  | 'received'
  | 'under_review'
  | 'in_progress'
  | 'awaiting_information'
  | 'escalated'
  | 'disposed';

export interface CaseResponse {
  id: string;
  reference: string;
  institution_id: string | null;
  institution_name: string;
  institution_permanent_id: string | null;
  category: string;
  subcategory?: string | null;
  specific_issue?: string | null;
  state?: string | null;
  district?: string | null;
  subject: string;
  assigned_bureau: string;
  assigned_officer_id: string | null;
  status: CaseStatus;
  priority: string;
  received_at: string;
  updated_at: string;
  due_at: string | null;
  closed_at: string | null;
  age_days: number;
  public_status: string;
  description?: string;
}

export interface CaseListResponse {
  items: CaseResponse[];
  total: number;
  page: number;
  page_size: number;
}

export interface ComplaintCreate {
  institution_id: string;
  institution_name: string;
  institution_permanent_id?: string | null;
  category: string;
  subcategory?: string | null;
  specific_issue?: string | null;
  state?: string | null;
  district?: string | null;
  subject: string;
  description: string;
  source_channel?: string;
  complainant_name?: string | null;
  complainant_email?: string | null;
}

export interface Institution {
  id: string;
  aicte_permanent_id: string | null;
  name: string;
  state: string;
  district: string;
  institution_type: string;
}

export interface AdministrativeState {
  id: string;
  name: string;
  kind: 'state' | 'union_territory';
  source_url: string;
  source_updated_at: string | null;
}

export interface AdministrativeDistrict {
  id: string;
  state_id: string;
  name: string;
  source_url: string;
  source_updated_at: string | null;
}

export interface TimelineItem {
  id: string;
  action_type: string;
  description: string;
  previous_status: string | null;
  new_status: string | null;
  created_at: string;
}

export interface AttachmentUploadResponse {
  id: string;
  storage_path: string;
  note: string;
}

export interface ComplaintFormData {
  // Step 1: Institution
  institution_name: string;
  institution_permanent_id?: string;
  state: string;
  district?: string;
  institution_type?: string;

  // Step 2: Complaint Details
  category: string;
  subject: string;
  description: string;
  incident_date?: string;
  assigned_bureau?: string;

  // Step 3: Supporting Information
  attachment?: File | null;
  complainant_name: string;
  complainant_email: string;
  complainant_phone?: string;
  consent_privacy: boolean;
  accuracy_confirmed: boolean;
}
