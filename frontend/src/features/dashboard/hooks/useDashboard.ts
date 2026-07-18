import { useQuery } from '@tanstack/react-query'
import { adminService } from '@/services/admin.service'
import { apiClient } from '@/lib/api-client'
import { useAuth } from '@/hooks/useAuth'

export const useDashboardSummary = () => {
  const { user } = useAuth()
  
  return useQuery({
    queryKey: ['dashboard', 'summary', user?.role],
    queryFn: async () => {
      if (!user) throw new Error('No user authenticated')
      
      let url = '/dashboard/investigator/summary'
      if (user.role === 'ADMIN') {
        // Admin summary telemetries
        return adminService.getAdminSummary()
      } else if (user.role === 'SUPERVISOR') {
        url = '/dashboard/supervisor/summary'
      }
      
      const { data } = await apiClient.get(url)
      return data.data
    },
    enabled: !!user,
  })
}
