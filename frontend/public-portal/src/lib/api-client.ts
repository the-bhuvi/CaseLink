import {
  CaseResponse,
  CaseListResponse,
  ComplaintCreate,
  TimelineItem,
  AttachmentUploadResponse,
} from '@/types/complaint';
import {
  User,
  TokenResponse,
  DemoLoginRequest,
} from '@/types/auth';
import { ReadyCheckResponse, HealthCheckResponse } from '@/types/api';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').replace(/\/+$/, '');
const MOCK_FALLBACK_ENABLED = import.meta.env.VITE_ENABLE_MOCK_FALLBACK === 'true';

const TOKEN_KEY = 'caselink_public_token';

export class ApiError extends Error {
  code: string;
  status: number;
  fields?: Record<string, any>;

  constructor(message: string, code = 'UNKNOWN_ERROR', status = 500, fields?: Record<string, any>) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.fields = fields;
  }
}

let memoryToken: string | null = null;
export let isUsingMockFallback = false;

export function getAuthToken(): string | null {
  if (memoryToken) return memoryToken;
  try {
    return sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setAuthToken(token: string | null): void {
  memoryToken = token;
  try {
    if (token) {
      sessionStorage.setItem(TOKEN_KEY, token);
    } else {
      sessionStorage.removeItem(TOKEN_KEY);
    }
  } catch {
    // SessionStorage restricted/unavailable
  }
}

export function clearAuthToken(): void {
  setAuthToken(null);
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken();
  const headers = new Headers(options.headers || {});

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const isFormData = options.body instanceof FormData;
  if (!isFormData && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const url = `${API_BASE_URL}${endpoint}`;

  try {
    const res = await fetch(url, {
      ...options,
      headers,
    });

    if (!res.ok) {
      let code = 'HTTP_ERROR';
      let message = `Request failed with status ${res.status}`;
      let fields: Record<string, any> | undefined;

      try {
        const errorJson = await res.json();
        if (errorJson?.detail) {
          if (typeof errorJson.detail === 'object') {
            code = errorJson.detail.code || code;
            message = errorJson.detail.message || message;
            fields = errorJson.detail.fields;
          } else if (typeof errorJson.detail === 'string') {
            message = errorJson.detail;
          }
        }
      } catch {
        // Body was not JSON
      }

      if (res.status === 401) {
        clearAuthToken();
      }

      throw new ApiError(message, code, res.status, fields);
    }

    if (res.status === 204) {
      return {} as T;
    }

    return (await res.json()) as T;
  } catch (err: any) {
    if (err instanceof ApiError) {
      throw err;
    }

    // Network error or backend down
    const networkMessage = err?.message || 'Unable to communicate with CASELINK AI server';
    throw new ApiError(
      networkMessage,
      'SERVICE_UNAVAILABLE',
      0
    );
  }
}

/* =========================================================
   MOCK FIXTURE ADAPTER (Only triggered when backend offline AND explicitly enabled)
========================================================= */

const MOCK_USER: User = {
  id: '00000000-0000-0000-0000-000000000001',
  email: 'complainant@demo.caselink',
  display_name: 'Demo Complainant',
  role: 'complainant',
  bureau_code: null,
};

let mockComplaintsStore: CaseResponse[] = [
  {
    id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    reference: 'CL-2026-00042',
    institution_id: 'a1111111-1111-1111-1111-111111111111',
    institution_name: 'Apex Institute of Technology & Engineering',
    institution_permanent_id: '1-4321987654',
    category: 'Fee & Refund',
    subject: 'Illegal withholding of original academic certificates and refund denial',
    assigned_bureau: 'RB',
    assigned_officer_id: null,
    status: 'under_review',
    priority: 'high',
    received_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    due_at: new Date(Date.now() + 27 * 86400000).toISOString(),
    closed_at: null,
    age_days: 3,
    public_status: 'Under Review',
    description: 'The administration refused to return original mark sheets upon withdrawal during the AICTE-permitted refund window, demanding payment for the entire semester.',
  },
  {
    id: 'e37bc10b-58cc-4372-a567-0e02b2c3d480',
    reference: 'CL-2026-00019',
    institution_id: 'b2222222-2222-2222-2222-222222222222',
    institution_name: 'National School of Management & Technology',
    institution_permanent_id: '1-9876543210',
    category: 'Scholarship',
    subject: 'Delayed disbursement of AICTE scholarship stipend and missing disbursement receipts',
    assigned_bureau: 'PGRC',
    assigned_officer_id: null,
    status: 'in_progress',
    priority: 'medium',
    received_at: new Date(Date.now() - 14 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    due_at: new Date(Date.now() + 16 * 86400000).toISOString(),
    closed_at: null,
    age_days: 14,
    public_status: 'In Progress',
    description: 'Post-graduate fellowship stipends have remained uncredited for over 5 months despite regular institutional attendance verification.',
  },
  {
    id: 'd27ac10b-58cc-4372-a567-0e02b2c3d481',
    reference: 'CL-2026-00008',
    institution_id: 'c3333333-3333-3333-3333-333333333333',
    institution_name: 'Metro Polytechnic College',
    institution_permanent_id: '1-1234567890',
    category: 'Infrastructure',
    subject: 'Severe laboratory equipment deficiency preventing mandatory practical courses',
    assigned_bureau: 'RB',
    assigned_officer_id: null,
    status: 'disposed',
    priority: 'medium',
    received_at: new Date(Date.now() - 40 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 10 * 86400000).toISOString(),
    due_at: null,
    closed_at: new Date(Date.now() - 10 * 86400000).toISOString(),
    age_days: 40,
    public_status: 'Disposed',
    description: 'Laboratories lacked safety ventilation and essential electrical experiment panels required by syllabus.',
  },
];

/* =========================================================
   PUBLIC API ENDPOINTS IMPLEMENTATION
========================================================= */

export const apiClient = {
  // Service health checks
  async checkHealth(): Promise<HealthCheckResponse> {
    return request<HealthCheckResponse>('/health');
  },

  async checkReady(): Promise<ReadyCheckResponse> {
    return request<ReadyCheckResponse>('/api/v1/health/ready');
  },

  // Auth: Demo Login
  async demoLogin(payload: DemoLoginRequest = { email: 'complainant@demo.caselink', role: 'complainant' }): Promise<TokenResponse> {
    try {
      const data = await request<TokenResponse>('/api/v1/auth/demo-login', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setAuthToken(data.access_token);
      isUsingMockFallback = false;
      return data;
    } catch (err: any) {
      if (err?.code === 'SERVICE_UNAVAILABLE' && MOCK_FALLBACK_ENABLED) {
        console.warn('Backend unavailable. Using local demo fallback session.');
        isUsingMockFallback = true;
        const mockToken = 'mock_jwt_token_for_offline_dev';
        setAuthToken(mockToken);
        return {
          access_token: mockToken,
          token_type: 'bearer',
          expires_in: 86400,
          user: MOCK_USER,
        };
      }
      throw err;
    }
  },

  // Auth: Get current user
  async getMe(): Promise<User> {
    try {
      const data = await request<User>('/api/v1/auth/me');
      isUsingMockFallback = false;
      return data;
    } catch (err: any) {
      if (err?.code === 'SERVICE_UNAVAILABLE' && MOCK_FALLBACK_ENABLED && getAuthToken()) {
        isUsingMockFallback = true;
        return MOCK_USER;
      }
      throw err;
    }
  },

  // Complaints: Submit new complaint
  async submitComplaint(payload: ComplaintCreate): Promise<CaseResponse> {
    try {
      const data = await request<CaseResponse>('/api/v1/public/complaints', {
        method: 'POST',
        body: JSON.stringify({
          ...payload,
          source_channel: payload.source_channel || 'web',
        }),
      });
      isUsingMockFallback = false;
      return data;
    } catch (err: any) {
      if (err?.code === 'SERVICE_UNAVAILABLE' && MOCK_FALLBACK_ENABLED) {
        isUsingMockFallback = true;
        const newRef = `CL-2026-${String(mockComplaintsStore.length + 10).padStart(5, '0')}`;
        const newCase: CaseResponse = {
          id: `case-${Date.now()}`,
          reference: newRef,
          institution_id: null,
          institution_name: payload.institution_name,
          institution_permanent_id: payload.institution_permanent_id || null,
          category: payload.category,
          subject: payload.subject,
          assigned_bureau: 'RB',
          assigned_officer_id: null,
          status: 'received',
          priority: 'medium',
          received_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          due_at: new Date(Date.now() + 30 * 86400000).toISOString(),
          closed_at: null,
          age_days: 0,
          public_status: 'Received',
          description: payload.description,
        };
        mockComplaintsStore = [newCase, ...mockComplaintsStore];
        return newCase;
      }
      throw err;
    }
  },

  // Complaints: List authenticated complainant's complaints
  async getMyComplaints(page = 1, pageSize = 20): Promise<CaseListResponse> {
    try {
      const data = await request<CaseListResponse>(`/api/v1/public/my-complaints?page=${page}&page_size=${pageSize}`);
      isUsingMockFallback = false;
      return data;
    } catch (err: any) {
      if (err?.code === 'SERVICE_UNAVAILABLE' && MOCK_FALLBACK_ENABLED) {
        isUsingMockFallback = true;
        return {
          items: mockComplaintsStore,
          total: mockComplaintsStore.length,
          page,
          page_size: pageSize,
        };
      }
      throw err;
    }
  },

  // Complaints: Track by reference
  async trackComplaint(reference: string): Promise<CaseResponse> {
    const cleanRef = reference.trim();
    try {
      const data = await request<CaseResponse>(`/api/v1/public/complaints/${encodeURIComponent(cleanRef)}`);
      isUsingMockFallback = false;
      return data;
    } catch (err: any) {
      if (err?.code === 'SERVICE_UNAVAILABLE' && MOCK_FALLBACK_ENABLED) {
        isUsingMockFallback = true;
        const found = mockComplaintsStore.find(
          (c) => c.reference.toLowerCase() === cleanRef.toLowerCase()
        );
        if (!found) {
          throw new ApiError('Complaint reference not found in current session.', 'NOT_FOUND', 404);
        }
        return found;
      }
      throw err;
    }
  },

  // Complaints: Get single case detail by ID
  async getCaseById(caseId: string): Promise<CaseResponse> {
    try {
      const data = await request<CaseResponse>(`/api/v1/cases/${caseId}`);
      isUsingMockFallback = false;
      return data;
    } catch (err: any) {
      if (err?.code === 'SERVICE_UNAVAILABLE' && MOCK_FALLBACK_ENABLED) {
        isUsingMockFallback = true;
        const found = mockComplaintsStore.find((c) => c.id === caseId);
        if (!found) {
          throw new ApiError('Case not found', 'NOT_FOUND', 404);
        }
        return found;
      }
      throw err;
    }
  },

  // Complaints: Get public timeline
  async getTimeline(caseId: string): Promise<TimelineItem[]> {
    try {
      const data = await request<TimelineItem[]>(`/api/v1/public/complaints/${caseId}/timeline`);
      isUsingMockFallback = false;
      return data;
    } catch (err: any) {
      if (err?.code === 'SERVICE_UNAVAILABLE' && MOCK_FALLBACK_ENABLED) {
        isUsingMockFallback = true;
        return [
          {
            id: 'tl-1',
            action_type: 'submitted',
            description: 'Complaint submitted through public web portal',
            previous_status: null,
            new_status: 'received',
            created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
          },
          {
            id: 'tl-2',
            action_type: 'updated',
            description: 'Assigned to Regional Bureau intake review',
            previous_status: 'received',
            new_status: 'under_review',
            created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
          },
        ];
      }
      throw err;
    }
  },

  // Attachments: Upload file to case
  async uploadAttachment(caseId: string, file: File): Promise<AttachmentUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const data = await request<AttachmentUploadResponse>(
        `/api/v1/public/complaints/${caseId}/attachments`,
        {
          method: 'POST',
          body: formData,
        }
      );
      isUsingMockFallback = false;
      return data;
    } catch (err: any) {
      if (err?.code === 'SERVICE_UNAVAILABLE' && MOCK_FALLBACK_ENABLED) {
        isUsingMockFallback = true;
        return {
          id: `att-${Date.now()}`,
          storage_path: `demo/offline/${file.name}`,
          note: 'Metadata-only demo upload (offline dev preview).',
        };
      }
      throw err;
    }
  },
};
