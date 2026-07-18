import { apiClient } from '@/lib/api-client'
import type { ApiResponse } from '@/types'

export interface ExportReportParams {
  report_type: 'CRIME' | 'OFFICER' | 'AI' | 'OPERATIONAL'
  timeframe: 'daily' | 'weekly' | 'monthly' | 'yearly'
  format: 'PDF' | 'EXCEL' | 'CSV'
}

export interface ReportMetaResponse {
  report_id: string
  report_type?: string
  status: 'PENDING' | 'GENERATED' | 'FAILED' | 'EXPIRED' | 'NOT_FOUND' | 'NOT_READY'
  file_size?: number
  checksum?: string
  expires_at?: string | null
}

export interface DownloadLinkResponse {
  download_url: string
}

export const reportsService = {
  export: async (payload: ExportReportParams): Promise<ReportMetaResponse> => {
    const { data } = await apiClient.post<ApiResponse<ReportMetaResponse>>('/reports/export', payload)
    return data.data
  },

  getStatus: async (reportId: string): Promise<ReportMetaResponse> => {
    const { data } = await apiClient.get<ApiResponse<ReportMetaResponse>>(`/reports/${reportId}/status`)
    return data.data
  },

  getDownloadUrl: async (reportId: string): Promise<DownloadLinkResponse> => {
    const { data } = await apiClient.get<ApiResponse<DownloadLinkResponse>>(`/reports/${reportId}/download`)
    return data.data
  },

  // Premium Taste Skill feature: Client-side storage of report history
  getHistory: (): Array<{ id: string; type: string; timeframe: string; format: string; date: string }> => {
    const history = localStorage.getItem('aipas_reports_history')
    return history ? JSON.parse(history) : []
  },

  addToHistory: (report: { id: string; type: string; timeframe: string; format: string }) => {
    const history = reportsService.getHistory()
    const updated = [{ ...report, date: new Date().toISOString() }, ...history].slice(0, 20) // Keep last 20
    localStorage.setItem('aipas_reports_history', JSON.stringify(updated))
  }
}
