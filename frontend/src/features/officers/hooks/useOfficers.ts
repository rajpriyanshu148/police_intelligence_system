import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { officersService, type CreateOfficerParams, type UpdateOfficerParams } from '@/services/officers.service'
import { useToast } from '@/hooks/useToast'

export const useOfficersList = (params: { role?: string; department?: string; page?: number; page_size?: number } = {}) => {
  return useQuery({
    queryKey: ['officers', params],
    queryFn: () => officersService.list(params),
  })
}

export const useOfficer = (id: string) => {
  return useQuery({
    queryKey: ['officers', id],
    queryFn: () => officersService.get(id),
    enabled: !!id,
  })
}

export const useCreateOfficer = () => {
  const queryClient = useQueryClient()
  const { addToast } = useToast()

  return useMutation({
    mutationFn: (payload: CreateOfficerParams) => officersService.create(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['officers'] })
      addToast(`Officer '${data.username}' created successfully.`, 'success')
    },
    onError: (err: any) => {
      addToast(err?.response?.data?.message || 'Failed to create officer.', 'error')
    },
  })
}

export const useUpdateOfficer = (id: string) => {
  const queryClient = useQueryClient()
  const { addToast } = useToast()

  return useMutation({
    mutationFn: (payload: UpdateOfficerParams) => officersService.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['officers', id] })
      queryClient.invalidateQueries({ queryKey: ['officers'] })
      addToast('Officer profile updated successfully.', 'success')
    },
    onError: (err: any) => {
      addToast(err?.response?.data?.message || 'Failed to update officer profile.', 'error')
    },
  })
}

export const useDeleteOfficer = () => {
  const queryClient = useQueryClient()
  const { addToast } = useToast()

  return useMutation({
    mutationFn: (id: string) => officersService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['officers'] })
      addToast('Officer soft-deleted successfully.', 'success')
    },
    onError: (err: any) => {
      addToast(err?.response?.data?.message || 'Failed to delete officer.', 'error')
    },
  })
}
