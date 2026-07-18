import { apiClient } from '@/lib/api-client'
import type { ApiResponse, Case, PaginatedResponse } from '@/types'

export interface CreateCaseParams {
  complaint_id: string
  title: string
  category: string
  severity: string
  priority: string
}

export interface UpdateCaseParams {
  title?: string
  category?: string
  severity?: string
  priority?: string
}

export interface TimelineEvent {
  id: string
  case_id: string
  event_time: string
  title: string
  description?: string
  actor_id: string
  actor_role: string
  created_at: string
}

export const casesService = {
  list: async (params: { status?: string; page?: number; page_size?: number } = {}): Promise<PaginatedResponse<Case>> => {
    const { data } = await apiClient.get<ApiResponse<Case[]>>('/cases', { params })
    // In our backend design, the envelope contains pagination info or we derive it
    const responseData = data as any
    return {
      items: responseData.data || [],
      total: responseData.pagination?.total || (responseData.data?.length || 0),
      page: responseData.pagination?.page || 1,
      page_size: responseData.pagination?.page_size || 20,
      total_pages: responseData.pagination?.total_pages || 1,
    }
  },

  get: async (id: string): Promise<Case> => {
    const { data } = await apiClient.get<ApiResponse<Case>>(`/cases/${id}`)
    return data.data
  },

  create: async (payload: CreateCaseParams): Promise<Case> => {
    const { data } = await apiClient.post<ApiResponse<Case>>('/cases', payload)
    return data.data
  },

  update: async (id: string, payload: UpdateCaseParams): Promise<Case> => {
    const { data } = await apiClient.patch<ApiResponse<Case>>(`/cases/${id}`, payload)
    return data.data
  },

  assign: async (id: string, officerId: string): Promise<Case> => {
    const { data } = await apiClient.post<ApiResponse<Case>>(`/cases/${id}/assign`, { officer_id: officerId })
    return data.data
  },

  transitionStatus: async (id: string, status: string): Promise<Case> => {
    const { data } = await apiClient.post<ApiResponse<Case>>(`/cases/${id}/status`, { status })
    return data.data
  },

  getTimeline: async (id: string): Promise<TimelineEvent[]> => {
    const { data } = await apiClient.get<ApiResponse<TimelineEvent[]>>(`/cases/${id}/timeline`)
    return data.data || []
  },

  addTimelineEvent: async (id: string, payload: { event_time: string; title: string; description?: string }): Promise<TimelineEvent> => {
    const { data } = await apiClient.post<ApiResponse<TimelineEvent>>(`/cases/${id}/timeline`, payload)
    return data.data
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/cases/${id}`)
  },
}
