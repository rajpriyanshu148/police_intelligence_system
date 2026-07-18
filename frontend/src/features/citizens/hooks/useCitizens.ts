import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { citizensService, type CreateCitizenParams, type UpdateCitizenParams } from '@/services/citizens.service'
import { useToast } from '@/hooks/useToast'

export const useCitizensList = (params: { q?: string; page?: number; page_size?: number } = {}) => {
  return useQuery({
    queryKey: ['citizens', params],
    queryFn: () => citizensService.list(params),
  })
}

export const useCitizen = (id: string) => {
  return useQuery({
    queryKey: ['citizens', id],
    queryFn: () => citizensService.get(id),
    enabled: !!id,
  })
}

export const useCreateCitizen = () => {
  const queryClient = useQueryClient()
  const { addToast } = useToast()

  return useMutation({
    mutationFn: (payload: CreateCitizenParams) => citizensService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['citizens'] })
      addToast('Citizen profile registered successfully.', 'success')
    },
    onError: (err: any) => {
      addToast(err?.response?.data?.message || 'Failed to create citizen profile.', 'error')
    },
  })
}

export const useUpdateCitizen = (id: string) => {
  const queryClient = useQueryClient()
  const { addToast } = useToast()

  return useMutation({
    mutationFn: (payload: UpdateCitizenParams) => citizensService.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['citizens', id] })
      queryClient.invalidateQueries({ queryKey: ['citizens'] })
      addToast('Citizen profile updated successfully.', 'success')
    },
    onError: (err: any) => {
      addToast(err?.response?.data?.message || 'Failed to update citizen profile.', 'error')
    },
  })
}
