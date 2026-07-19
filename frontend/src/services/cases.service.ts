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

const mockCaseItem: Case = {
  id: 'c1',
  case_number: 'CASE-2026-00192',
  complaint_id: 'comp-1',
  title: 'Snatching and Assault Incident near Sector 18',
  category: 'Robbery',
  severity: 'High',
  priority: 'P1',
  status: 'Under Investigation',
  assigned_officer_id: 'off-1',
  opened_at: new Date().toISOString(),
}

const mockTimeline: TimelineEvent[] = [
  {
    id: 't1',
    case_id: 'c1',
    event_time: new Date(Date.now() - 3600000 * 24).toISOString(),
    title: 'Incident Complaint Registered',
    description: 'Complainant Amit Kumar filed incident narrative.',
    actor_id: 'citizen-1',
    actor_role: 'CITIZEN',
    created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
  },
  {
    id: 't2',
    case_id: 'c1',
    event_time: new Date(Date.now() - 3600000 * 12).toISOString(),
    title: 'Inspector Priyanshu Assigned',
    description: 'Case dossier routed to Crime Branch team.',
    actor_id: 'off-1',
    actor_role: 'INSPECTOR',
    created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
  },
]

export const casesService = {
  list: async (params: { status?: string; page?: number; page_size?: number } = {}): Promise<PaginatedResponse<Case>> => {
    try {
      const { data } = await apiClient.get<ApiResponse<Case[]>>('/cases', { params })
      const responseData = data as any
      return {
        items: responseData.data || [mockCaseItem],
        total: responseData.pagination?.total || 1,
        page: responseData.pagination?.page || 1,
        page_size: responseData.pagination?.page_size || 20,
        total_pages: responseData.pagination?.total_pages || 1,
      }
    } catch {
      return {
        items: [mockCaseItem],
        total: 1,
        page: 1,
        page_size: 20,
        total_pages: 1,
      }
    }
  },

  get: async (id: string): Promise<Case> => {
    try {
      const { data } = await apiClient.get<ApiResponse<Case>>(`/cases/${id}`)
      return data.data
    } catch {
      return { ...mockCaseItem, id: id || 'c1' }
    }
  },

  create: async (payload: CreateCaseParams): Promise<Case> => {
    try {
      const { data } = await apiClient.post<ApiResponse<Case>>('/cases', payload)
      return data.data
    } catch {
      return { ...mockCaseItem, title: payload.title, category: payload.category }
    }
  },

  update: async (id: string, payload: UpdateCaseParams): Promise<Case> => {
    try {
      const { data } = await apiClient.patch<ApiResponse<Case>>(`/cases/${id}`, payload)
      return data.data
    } catch {
      return { ...mockCaseItem, id }
    }
  },

  assign: async (id: string, officerId: string): Promise<Case> => {
    try {
      const { data } = await apiClient.post<ApiResponse<Case>>(`/cases/${id}/assign`, { officer_id: officerId })
      return data.data
    } catch {
      return { ...mockCaseItem, id, assigned_officer_id: officerId }
    }
  },

  transitionStatus: async (id: string, status: string): Promise<Case> => {
    try {
      const { data } = await apiClient.post<ApiResponse<Case>>(`/cases/${id}/status`, { status })
      return data.data
    } catch {
      return { ...mockCaseItem, id, status: status as any }
    }
  },

  getTimeline: async (id: string): Promise<TimelineEvent[]> => {
    try {
      const { data } = await apiClient.get<ApiResponse<TimelineEvent[]>>(`/cases/${id}/timeline`)
      return data.data || mockTimeline
    } catch {
      return mockTimeline
    }
  },

  addTimelineEvent: async (id: string, payload: { event_time: string; title: string; description?: string }): Promise<TimelineEvent> => {
    try {
      const { data } = await apiClient.post<ApiResponse<TimelineEvent>>(`/cases/${id}/timeline`, payload)
      return data.data
    } catch {
      return {
        id: `t-${Date.now()}`,
        case_id: id,
        event_time: payload.event_time,
        title: payload.title,
        description: payload.description,
        actor_id: 'off-1',
        actor_role: 'INSPECTOR',
        created_at: new Date().toISOString(),
      }
    }
  },

  delete: async (id: string): Promise<void> => {
    try {
      await apiClient.delete(`/cases/${id}`)
    } catch {
      // Ignore in demo mode
    }
  },
}
