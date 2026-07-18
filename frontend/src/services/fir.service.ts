import { apiClient } from '@/lib/api-client'
import type { ApiResponse } from '@/types'

export interface FIRDetails {
  id: string
  fir_number: string
  case_id: string
  complainant_name: string
  complainant_contact: string
  incident_date: string
  incident_place: string
  acts_sections: string
  details: string
  status: 'Draft' | 'Submitted' | 'Approved' | 'Rejected' | 'Returned'
  created_at: string
}

export interface FIRVersion {
  id: string
  fir_id: string
  version_number: number
  acts_sections: string
  details: string
  amended_by_id: string
  created_at: string
}

export interface CreateFIRParams {
  complainant_name: string
  complainant_contact: string
  incident_date: string
  incident_place: string
  acts_sections: string
  details: string
}

export interface UpdateFIRParams {
  acts_sections?: string
  details?: string
}

export interface ReviewFIRParams {
  approved: boolean
  feedback?: string
  action: 'APPROVE' | 'RETURN' | 'REJECT'
}

export const firService = {
  get: async (caseId: string): Promise<FIRDetails> => {
    const { data } = await apiClient.get<ApiResponse<FIRDetails>>(`/cases/${caseId}/fir`)
    return data.data
  },

  create: async (caseId: string, payload: CreateFIRParams): Promise<FIRDetails> => {
    const { data } = await apiClient.post<ApiResponse<FIRDetails>>(`/cases/${caseId}/fir`, payload)
    return data.data
  },

  update: async (caseId: string, payload: UpdateFIRParams): Promise<FIRDetails> => {
    const { data } = await apiClient.patch<ApiResponse<FIRDetails>>(`/cases/${caseId}/fir`, payload)
    return data.data
  },

  submit: async (caseId: string): Promise<FIRDetails> => {
    const { data } = await apiClient.post<ApiResponse<FIRDetails>>(`/cases/${caseId}/fir/submit`)
    return data.data
  },

  review: async (caseId: string, payload: ReviewFIRParams): Promise<FIRDetails> => {
    const { data } = await apiClient.post<ApiResponse<FIRDetails>>(`/cases/${caseId}/fir/approve`, payload)
    return data.data
  },

  getHistory: async (caseId: string): Promise<FIRVersion[]> => {
    const { data } = await apiClient.get<ApiResponse<FIRVersion[]>>(`/cases/${caseId}/fir/history`)
    return data.data || []
  },
}
