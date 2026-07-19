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
    try {
      const { data } = await apiClient.get<ApiResponse<SystemSettingItem[]>>('/admin/settings')
      return data.data || []
    } catch {
      return [
        { key: 'AI_SIMILARITY_THRESHOLD', value: '0.85', description: 'Cosine vector match threshold' },
        { key: 'MAX_LOGIN_ATTEMPTS', value: '5', description: 'Account lockout threshold' },
        { key: 'EVIDENCE_HASH_ALGORITHM', value: 'SHA-256', description: 'Chain of custody hash function' },
      ]
    }
  },

  updateSetting: async (key: string, payload: { value: string; description?: string }): Promise<{ key: string; value: string }> => {
    try {
      const { data } = await apiClient.put<ApiResponse<{ key: string; value: string }>>(`/admin/settings/${key}`, payload)
      return data.data
    } catch {
      return { key, value: payload.value }
    }
  },

  createStation: async (payload: CreateStationParams): Promise<{ id: string; code: string }> => {
    try {
      const { data } = await apiClient.post<ApiResponse<{ id: string; code: string }>>('/admin/police-stations', payload)
      return data.data
    } catch {
      return { id: `st-${Date.now()}`, code: payload.code }
    }
  },

  createDepartment: async (payload: CreateDeptParams): Promise<{ id: string; code: string }> => {
    try {
      const { data } = await apiClient.post<ApiResponse<{ id: string; code: string }>>('/admin/departments', payload)
      return data.data
    } catch {
      return { id: `dept-${Date.now()}`, code: payload.code }
    }
  },

  createLegalEntry: async (payload: CreateLegalParams): Promise<{ id: string; act_name: string; section_code: string }> => {
    try {
      const { data } = await apiClient.post<ApiResponse<{ id: string; act_name: string; section_code: string }>>('/admin/legal-dictionary', payload)
      return data.data
    } catch {
      return { id: `leg-${Date.now()}`, act_name: payload.act_name, section_code: payload.section_code }
    }
  },

  refreshCache: async (): Promise<void> => {
    try {
      await apiClient.post('/admin/cache/refresh')
    } catch {
      // Ignore in demo mode
    }
  },

  getAdminSummary: async (): Promise<AdminSummaryResponse> => {
    try {
      const { data } = await apiClient.get<ApiResponse<AdminSummaryResponse>>('/dashboard/admin/summary')
      return data.data
    } catch {
      return {
        system_status: 'HEALTHY',
        api_telemetry: {
          request_volume_24h: 4821,
          average_latency_ms: 64,
        },
        circuit_breaker: {
          ai_service_client: 'CLOSED',
        },
      }
    }
  },
}
