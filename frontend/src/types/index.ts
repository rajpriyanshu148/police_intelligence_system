// Global TypeScript type definitions for the AIPAS frontend

// ── Officer & Auth ───────────────────────────────────────────────────────────

export type OfficerRole = 'ADMIN' | 'SUPERVISOR' | 'INVESTIGATOR'
export type OfficerStatus = 'Active' | 'Suspended' | 'Inactive'

export interface Officer {
  id: string
  username: string
  email: string
  badge_number: string
  role: OfficerRole
  department: string
  status: OfficerStatus
  created_at: string
  updated_at: string
}

export interface AuthTokens {
  access_token: string
  refresh_token: string
  officer: Officer
}

// ── API Response Envelope ────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
  request_id?: string
  correlation_id?: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

// ── Case Management ──────────────────────────────────────────────────────────

export type CaseStatus = 
  | 'Under Investigation'
  | 'Pending Review'
  | 'Closed'
  | 'Cold Case'
  | 'Referred'

export type CaseSeverity = 'Critical' | 'High' | 'Moderate' | 'Low'
export type CasePriority = 'P1' | 'P2' | 'P3' | 'P4'

export interface Case {
  id: string
  case_number: string
  title: string
  category: string
  status: CaseStatus
  severity: CaseSeverity
  priority: CasePriority
  complaint_id: string
  assigned_officer_id?: string
  opened_at: string
  closed_at?: string
}

// ── Complaint ────────────────────────────────────────────────────────────────

export type ComplaintStatus = 
  | 'Pending'
  | 'Reviewing'
  | 'Approved'
  | 'Rejected'
  | 'Escalated'

export interface Complaint {
  id: string
  citizen_name: string
  citizen_contact: string
  complaint_text: string
  status: ComplaintStatus
  source: string
  created_at: string
}

// ── FIR ──────────────────────────────────────────────────────────────────────

export type FirStatus = 
  | 'Draft'
  | 'Submitted'
  | 'Approved'
  | 'Rejected'

export interface FIR {
  id: string
  fir_number: string
  case_id: string
  details: string
  status: FirStatus
  created_at: string
}

// ── Evidence ─────────────────────────────────────────────────────────────────

export interface Evidence {
  id: string
  case_id: string
  title: string
  description: string
  status: string
  created_at: string
}

// ── Citizen ──────────────────────────────────────────────────────────────────

export interface Citizen {
  id: string
  name: string
  email?: string
  phone_number?: string
  address?: string
}

// ── AI Integration ───────────────────────────────────────────────────────────

export type AIReviewStatus = 'Draft' | 'Accepted' | 'Edited' | 'Rejected'

export interface AICaseAnalysis {
  id: string
  case_id: string
  summary_draft: string
  suggested_category: string
  review_status: AIReviewStatus
  created_at: string
}

// ── UI Utilities ─────────────────────────────────────────────────────────────

export interface SelectOption {
  value: string
  label: string
}

export interface BreadcrumbItem {
  label: string
  href?: string
}

export interface TableColumn<T> {
  key: keyof T | string
  label: string
  render?: (row: T) => React.ReactNode
  sortable?: boolean
  width?: string
}
