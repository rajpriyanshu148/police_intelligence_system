import { apiClient } from '@/lib/api-client'
import type { ApiResponse } from '@/types'

// ── Summary Shape Types ───────────────────────────────────────────────────────

export interface AdminDashboardSummary {
  total_requests_24h: number
  avg_latency_ms: number
  system_status: 'Operational' | 'Degraded' | 'Down'
  active_officers: number
  open_cases: number
  pending_complaints: number
}

export interface SupervisorDashboardSummary {
  active_cases: number
  pending_complaints: number
  crime_hotspots: number
  total_officers: number
  cases_by_status: Array<{
    status: string
    count: number
  }>
  recent_cases: Array<{
    id: string
    case_number: string
    title: string
    status: string
    severity: string
    opened_at: string
  }>
}

export interface InvestigatorDashboardSummary {
  my_active_cases: number
  my_resolved_cases: number
  recent_crimes_count: number
  assigned_complaints: number
}

export type DashboardSummary =
  | AdminDashboardSummary
  | SupervisorDashboardSummary
  | InvestigatorDashboardSummary

// ── Service ───────────────────────────────────────────────────────────────────

export const dashboardService = {
  /**
   * Fetch the ADMIN role dashboard summary.
   */
  getAdminSummary: async (): Promise<AdminDashboardSummary> => {
    const { data } = await apiClient.get<ApiResponse<AdminDashboardSummary>>(
      '/dashboard/admin/summary'
    )
    return data.data
  },

  /**
   * Fetch the SUPERVISOR role dashboard summary.
   */
  getSupervisorSummary: async (): Promise<SupervisorDashboardSummary> => {
    const { data } = await apiClient.get<ApiResponse<SupervisorDashboardSummary>>(
      '/dashboard/supervisor/summary'
    )
    return data.data
  },

  /**
   * Fetch the INVESTIGATOR role dashboard summary.
   */
  getInvestigatorSummary: async (): Promise<InvestigatorDashboardSummary> => {
    const { data } = await apiClient.get<ApiResponse<InvestigatorDashboardSummary>>(
      '/dashboard/investigator/summary'
    )
    return data.data
  },
}
