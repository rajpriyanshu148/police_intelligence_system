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

export const officersService = {
  list: async (params: { role?: string; department?: string; page?: number; page_size?: number } = {}): Promise<PaginatedResponse<Officer>> => {
    const { data } = await apiClient.get<ApiResponse<Officer[]>>('/officers', { params })
    const responseData = data as any
    return {
      items: responseData.data || [],
      total: responseData.pagination?.total || (responseData.data?.length || 0),
      page: responseData.pagination?.page || 1,
      page_size: responseData.pagination?.page_size || 20,
      total_pages: responseData.pagination?.total_pages || 1,
    }
  },

  get: async (id: string): Promise<Officer> => {
    const { data } = await apiClient.get<ApiResponse<Officer>>(`/officers/${id}`)
    return data.data
  },

  create: async (payload: CreateOfficerParams): Promise<Officer> => {
    const { data } = await apiClient.post<ApiResponse<Officer>>('/officers', payload)
    return data.data
  },

  update: async (id: string, payload: UpdateOfficerParams): Promise<Officer> => {
    const { data } = await apiClient.patch<ApiResponse<Officer>>(`/officers/${id}`, payload)
    return data.data
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/officers/${id}`)
  },
}
