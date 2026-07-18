import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminService, type CreateStationParams, type CreateDeptParams, type CreateLegalParams } from '@/services/admin.service'
import { useToast } from '@/hooks/useToast'

export const useSystemSettings = () => {
  return useQuery({
    queryKey: ['admin', 'settings'],
    queryFn: () => adminService.getSettings(),
  })
}

export const useUpdateSetting = () => {
  const queryClient = useQueryClient()
  const { addToast } = useToast()

  return useMutation({
    mutationFn: ({ key, value, description }: { key: string; value: string; description?: string }) =>
      adminService.updateSetting(key, { value, description }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'settings'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'summary'] })
      addToast(`System setting '${data.key}' updated successfully.`, 'success')
    },
    onError: (err: any) => {
      addToast(err?.response?.data?.message || 'Failed to update system setting.', 'error')
    },
  })
}

export const useCreateStation = () => {
  const { addToast } = useToast()

  return useMutation({
    mutationFn: (payload: CreateStationParams) => adminService.createStation(payload),
    onSuccess: (data) => {
      addToast(`Police station '${data.code}' registered successfully.`, 'success')
    },
    onError: (err: any) => {
      addToast(err?.response?.data?.message || 'Failed to register police station.', 'error')
    },
  })
}

export const useCreateDepartment = () => {
  const { addToast } = useToast()

  return useMutation({
    mutationFn: (payload: CreateDeptParams) => adminService.createDepartment(payload),
    onSuccess: (data) => {
      addToast(`Department '${data.code}' registered successfully.`, 'success')
    },
    onError: (err: any) => {
      addToast(err?.response?.data?.message || 'Failed to register department.', 'error')
    },
  })
}

export const useCreateLegalEntry = () => {
  const { addToast } = useToast()

  return useMutation({
    mutationFn: (payload: CreateLegalParams) => adminService.createLegalEntry(payload),
    onSuccess: (data) => {
      addToast(`Legal dictionary entry '${data.act_name} Section ${data.section_code}' registered successfully.`, 'success')
    },
    onError: (err: any) => {
      addToast(err?.response?.data?.message || 'Failed to register legal dictionary entry.', 'error')
    },
  })
}

export const useClearCache = () => {
  const { addToast } = useToast()

  return useMutation({
    mutationFn: () => adminService.refreshCache(),
    onSuccess: () => {
      addToast('System metrics cache flushed successfully.', 'success')
    },
    onError: (err: any) => {
      addToast(err?.response?.data?.message || 'Failed to clear system cache.', 'error')
    },
  })
}
