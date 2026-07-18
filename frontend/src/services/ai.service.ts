import { apiClient } from '@/lib/api-client'
import type { ApiResponse } from '@/types'

export interface AICaseAnalysisResult {
  id: string
  case_id: string
  summary_draft: string
  suggested_category: string
  suggested_severity: string
  suggested_priority: string
  suggested_department: string
  missing_information: string[]
  potential_duplicates: any[]
  review_status: string
  model_name: string
}

export interface AIEntity {
  name: string
  type: string
  confidence: number
  startIndex?: number
  endIndex?: number
}

export interface AIFIRResult {
  id: string
  case_id: string
  original_narrative_draft: string
  review_status: string
  model_name: string
}

export interface AILegalResult {
  id: string
  case_id: string
  suggested_sections: Array<{
    act_name: string
    section_code: string
    title: string
    description: string
    confidence: number
  }>
  review_status: string
  model_name: string
}

export interface AIReviewPayload {
  target_type: 'ANALYSIS' | 'FIR' | 'LEGAL'
  suggestion_id: string
  action: 'ACCEPT' | 'EDIT' | 'REJECT'
  edited_text?: string
  approved_sections?: string[]
}

export interface AIHealthStatus {
  status: 'healthy' | 'unhealthy'
  client?: string
  circuit_breaker?: string
}

export const aiService = {
  analyze: async (caseId: string): Promise<AICaseAnalysisResult> => {
    const { data } = await apiClient.post<ApiResponse<AICaseAnalysisResult>>(`/cases/${caseId}/ai/analyze`)
    return data.data
  },

  extractEntities: async (caseId: string): Promise<AIEntity[]> => {
    const { data } = await apiClient.post<ApiResponse<AIEntity[]>>(`/cases/${caseId}/ai/entities`)
    return data.data || []
  },

  generateFIR: async (caseId: string, officerNotes?: string): Promise<AIFIRResult> => {
    const params = officerNotes ? { officer_notes: officerNotes } : {}
    const { data } = await apiClient.post<ApiResponse<AIFIRResult>>(`/cases/${caseId}/ai/fir`, null, { params })
    return data.data
  },

  getLegalSections: async (caseId: string): Promise<AILegalResult> => {
    const { data } = await apiClient.post<ApiResponse<AILegalResult>>(`/cases/${caseId}/ai/legal`)
    return data.data
  },

  review: async (caseId: string, payload: AIReviewPayload): Promise<{ suggestion_id: string; review_outcome: string }> => {
    const { data } = await apiClient.post<ApiResponse<{ suggestion_id: string; review_outcome: string }>>(
      `/cases/${caseId}/ai/review`,
      payload
    )
    return data.data
  },

  getHealth: async (): Promise<AIHealthStatus> => {
    const { data } = await apiClient.get<ApiResponse<AIHealthStatus>>('/ai/health')
    return data.data
  },
}
