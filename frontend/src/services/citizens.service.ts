import { apiClient } from '@/lib/api-client'
import type { ApiResponse, Citizen, PaginatedResponse } from '@/types'

export interface CreateCitizenParams {
  name: string
  email?: string
  phone_number?: string
  address?: string
}

export interface UpdateCitizenParams {
  name?: string
  email?: string
  phone_number?: string
  address?: string
}

export const citizensService = {
  list: async (params: { q?: string; page?: number; page_size?: number } = {}): Promise<PaginatedResponse<Citizen>> => {
    const { data } = await apiClient.get<ApiResponse<Citizen[]>>('/citizens', { params })
    const responseData = data as any
    return {
      items: responseData.data || [],
      total: responseData.pagination?.total || (responseData.data?.length || 0),
      page: responseData.pagination?.page || 1,
      page_size: responseData.pagination?.page_size || 20,
      total_pages: responseData.pagination?.total_pages || 1,
    }
  },

  get: async (id: string): Promise<Citizen> => {
    const { data } = await apiClient.get<ApiResponse<Citizen>>(`/citizens/${id}`)
    return data.data
  },

  create: async (payload: CreateCitizenParams): Promise<Citizen> => {
    const { data } = await apiClient.post<ApiResponse<Citizen>>('/citizens', payload)
    return data.data
  },

  update: async (id: string, payload: UpdateCitizenParams): Promise<Citizen> => {
    const { data } = await apiClient.patch<ApiResponse<Citizen>>(`/citizens/${id}`, payload)
    return data.data
  },
}
