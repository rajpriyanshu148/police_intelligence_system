import { useQuery } from '@tanstack/react-query'
import { healthService } from '@/services/health.service'

export const useSystemHealth = () => {
  return useQuery({
    queryKey: ['system', 'health'],
    queryFn: () => healthService.getDetailedHealth(),
    refetchInterval: 30000, // Poll every 30 seconds
  })
}

export const useReadiness = () => {
  return useQuery({
    queryKey: ['system', 'readiness'],
    queryFn: () => healthService.getReady(),
    refetchInterval: 30000,
  })
}

export const useVersionInfo = () => {
  return useQuery({
    queryKey: ['system', 'version'],
    queryFn: () => healthService.getVersion(),
  })
}
