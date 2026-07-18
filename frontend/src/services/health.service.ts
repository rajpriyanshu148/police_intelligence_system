import { apiClient } from '@/lib/api-client'

export interface DetailedHealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy'
  version: string
  environment: string
  uptime_seconds: number
  timestamp: string
  subsystems: {
    database: string
    storage: string
    ai_service: {
      status: string
      circuit_breaker: string
    }
  }
}

export interface VersionInfoResponse {
  version: string
  environment: string
  build_time: string
  commit_hash: string
}

export const healthService = {
  getLive: async (): Promise<{ status: string }> => {
    const { data } = await apiClient.get('/live')
    return data
  },

  getReady: async (): Promise<{ status: string }> => {
    const { data } = await apiClient.get('/ready')
    return data
  },

  getDetailedHealth: async (): Promise<DetailedHealthResponse> => {
    const { data } = await apiClient.get('/health')
    return data
  },

  getVersion: async (): Promise<VersionInfoResponse> => {
    const { data } = await apiClient.get('/version')
    return data
  },
}
