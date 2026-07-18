import { apiClient } from '@/lib/api-client'
import type { ApiResponse } from '@/types'

export interface SystemSettingItem {
  [key: string]: string | undefined
  description?: string
}

export interface CreateStationParams {
  code: string
  name: string
  district: string
  state: string
}

export interface CreateDeptParams {
  station_id: string
  name: string
  code: string
}

export interface CreateLegalParams {
  act_name: string
  section_code: string
  title: string
  description: string
  punishment?: string
}

export interface AdminSummaryResponse {
  system_status: string
  api_telemetry: {
    request_volume_24h: number
    average_latency_ms: number
  }
  circuit_breaker: {
    ai_service_client: string
  }
}

export const adminService = {
  getSettings: async (): Promise<SystemSettingItem[]> => {
    const { data } = await apiClient.get<ApiResponse<SystemSettingItem[]>>('/admin/settings')
    return data.data || []
  },

  updateSetting: async (key: string, payload: { value: string; description?: string }): Promise<{ key: string; value: string }> => {
    const { data } = await apiClient.put<ApiResponse<{ key: string; value: string }>>(`/admin/settings/${key}`, payload)
    return data.data
  },

  createStation: async (payload: CreateStationParams): Promise<{ id: string; code: string }> => {
    const { data } = await apiClient.post<ApiResponse<{ id: string; code: string }>>('/admin/police-stations', payload)
    return data.data
  },

  createDepartment: async (payload: CreateDeptParams): Promise<{ id: string; code: string }> => {
    const { data } = await apiClient.post<ApiResponse<{ id: string; code: string }>>('/admin/departments', payload)
    return data.data
  },

  createLegalEntry: async (payload: CreateLegalParams): Promise<{ id: string; act_name: string; section_code: string }> => {
    const { data } = await apiClient.post<ApiResponse<{ id: string; act_name: string; section_code: string }>>('/admin/legal-dictionary', payload)
    return data.data
  },

  refreshCache: async (): Promise<void> => {
    await apiClient.post('/admin/cache/refresh')
  },

  getAdminSummary: async (): Promise<AdminSummaryResponse> => {
    const { data } = await apiClient.get<ApiResponse<AdminSummaryResponse>>('/dashboard/admin/summary')
    return data.data
  },
}
