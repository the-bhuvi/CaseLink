import { CaseResponse } from './complaint';

export interface ApiErrorDetail {
  code: string;
  message: string;
  fields?: Record<string, any>;
}

export interface ApiErrorResponse {
  detail: ApiErrorDetail | string;
}

export interface CaseListResponse {
  items: CaseResponse[];
  total: number;
  page: number;
  page_size: number;
}

export interface HealthCheckResponse {
  status: string;
  service: string;
}

export interface ReadyCheckResponse {
  status: string;
  database: string;
  semantic_matching: string;
}
