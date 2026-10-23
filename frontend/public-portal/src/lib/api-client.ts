import { AdministrativeDistrict, AdministrativeState, AttachmentUploadResponse, CaseListResponse, CaseResponse, ComplaintCreate, Institution, TimelineItem } from '@/types/complaint';
import { HealthCheckResponse, ReadyCheckResponse } from '@/types/api';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').replace(/\/+$/, '');

export class ApiError extends Error {
  code: string;
  status: number;
  fields?: Record<string, unknown>;
  constructor(message: string, code = 'UNKNOWN_ERROR', status = 500, fields?: Record<string, unknown>) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.fields = fields;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  if (!(options.body instanceof FormData)) headers.set('Content-Type', 'application/json');
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers });
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      const detail = body?.detail;
      throw new ApiError(
        typeof detail === 'object' ? detail.message || `Request failed with ${response.status}` : detail || `Request failed with ${response.status}`,
        typeof detail === 'object' ? detail.code || 'HTTP_ERROR' : 'HTTP_ERROR',
        response.status,
        typeof detail === 'object' ? detail.fields : undefined,
      );
    }
    return response.status === 204 ? ({} as T) : await response.json() as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError('Unable to reach the CASELINK AI backend.', 'SERVICE_UNAVAILABLE', 0);
  }
}

export const apiClient = {
  checkHealth: () => request<HealthCheckResponse>('/health'),
  checkReady: () => request<ReadyCheckResponse>('/ready'),
  submitComplaint: (payload: ComplaintCreate) => request<CaseResponse>('/api/v1/public/complaints', { method: 'POST', body: JSON.stringify(payload) }),
  institutions: (q: string, state?: string, district?: string) => {
    const params = new URLSearchParams({ q, page_size: '25' });
    if (state) params.set('state', state);
    if (district) params.set('district', district);
    return request<Institution[]>(`/api/v1/institutions?${params}`);
  },
  states: () => request<AdministrativeState[]>('/api/v1/reference/states'),
  districts: (stateId: string, q?: string) => request<AdministrativeDistrict[]>(`/api/v1/reference/states/${encodeURIComponent(stateId)}/districts${q ? `?q=${encodeURIComponent(q)}` : ''}`),
  grievanceTaxonomy: () => request<Array<{ id: string; label: string; subcategories: Array<{ id: string; label: string; issues: string[] }> }>>('/api/v1/reference/grievance-taxonomy'),
  requestInstitutionVerification: (payload: { submitted_name: string; state?: string; district?: string; details: string; contact_email?: string }) => request<{ status: string; message: string }>('/api/v1/public/institution-verification-requests', { method: 'POST', body: JSON.stringify(payload) }),
  trackComplaint: (reference: string) => request<CaseResponse>(`/api/v1/public/complaints/${encodeURIComponent(reference.trim())}`),
  getCaseById: (caseId: string) => request<CaseResponse>(`/api/v1/cases/${encodeURIComponent(caseId)}`),
  getTimeline: (caseId: string) => request<TimelineItem[]>(`/api/v1/public/complaints/${encodeURIComponent(caseId)}/timeline`),
  uploadAttachment: (caseId: string, file: File) => {
    const form = new FormData();
    form.append('file', file);
    return request<AttachmentUploadResponse>(`/api/v1/public/complaints/${encodeURIComponent(caseId)}/attachments`, { method: 'POST', body: form });
  },
  getMyComplaints: (page = 1, pageSize = 20) => request<CaseListResponse>(`/api/v1/cases?page=${page}&page_size=${pageSize}`),
};
