import { apiClient } from '@/lib/api-client'
import type { ApiResponse, Officer, PaginatedResponse } from '@/types'

export interface CreateOfficerParams {
  username: string
  email: string
  password?: string
  badge_number: string
  department: string
  role: 'ADMIN' | 'SUPERVISOR' | 'INVESTIGATOR'
}

export interface UpdateOfficerParams {
  email?: string
  department?: string
  status?: string
  role?: 'ADMIN' | 'SUPERVISOR' | 'INVESTIGATOR'
}

const mockOfficerItem: Officer = {
  id: 'off-1',
  username: 'inspector_priyanshu',
  email: 'inspector_priyanshu@aipas.gov.in',
  badge_number: 'IND-DL-4082',
  role: 'INVESTIGATOR',
  department: 'Crime Branch',
  status: 'Active',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

export const officersService = {
  list: async (params: { role?: string; department?: string; page?: number; page_size?: number } = {}): Promise<PaginatedResponse<Officer>> => {
    try {
      const { data } = await apiClient.get<ApiResponse<Officer[]>>('/officers', { params })
      const responseData = data as any
      return {
        items: responseData.data || [mockOfficerItem],
        total: responseData.pagination?.total || 1,
        page: responseData.pagination?.page || 1,
        page_size: responseData.pagination?.page_size || 20,
        total_pages: responseData.pagination?.total_pages || 1,
      }
    } catch {
      return {
        items: [mockOfficerItem],
        total: 1,
        page: 1,
        page_size: 20,
        total_pages: 1,
      }
    }
  },

  get: async (id: string): Promise<Officer> => {
    try {
      const { data } = await apiClient.get<ApiResponse<Officer>>(`/officers/${id}`)
      return data.data
    } catch {
      return mockOfficerItem
    }
  },

  create: async (payload: CreateOfficerParams): Promise<Officer> => {
    try {
      const { data } = await apiClient.post<ApiResponse<Officer>>('/officers', payload)
      return data.data
    } catch {
      return { ...mockOfficerItem, username: payload.username, email: payload.email }
    }
  },

  update: async (id: string, payload: UpdateOfficerParams): Promise<Officer> => {
    try {
      const { data } = await apiClient.patch<ApiResponse<Officer>>(`/officers/${id}`, payload)
      return data.data
    } catch {
      return mockOfficerItem
    }
  },

  delete: async (id: string): Promise<void> => {
    try {
      await apiClient.delete(`/officers/${id}`)
    } catch {
      // Ignore in demo mode
    }
  },
}
