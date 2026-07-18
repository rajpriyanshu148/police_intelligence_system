import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { casesService, type CreateCaseParams, type UpdateCaseParams } from '@/services/cases.service'
import { useToast } from '@/hooks/useToast'

export const useCasesList = (params: { status?: string; page?: number; page_size?: number } = {}) => {
  return useQuery({
    queryKey: ['cases', params],
    queryFn: () => casesService.list(params),
  })
}

export const useCase = (id: string) => {
  return useQuery({
    queryKey: ['cases', id],
    queryFn: () => casesService.get(id),
    enabled: !!id,
  })
}

export const useCaseTimeline = (id: string) => {
  return useQuery({
    queryKey: ['cases', id, 'timeline'],
    queryFn: () => casesService.getTimeline(id),
    enabled: !!id,
  })
}

export const useCreateCase = () => {
  const queryClient = useQueryClient()
  const { addToast } = useToast()

  return useMutation({
    mutationFn: (payload: CreateCaseParams) => casesService.create(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['cases'] })
      addToast(`Case ${data.case_number} created successfully.`, 'success')
    },
    onError: (err: any) => {
      addToast(err?.response?.data?.message || 'Failed to create case.', 'error')
    },
  })
}

export const useUpdateCase = (id: string) => {
  const queryClient = useQueryClient()
  const { addToast } = useToast()

  return useMutation({
    mutationFn: (payload: UpdateCaseParams) => casesService.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cases', id] })
      queryClient.invalidateQueries({ queryKey: ['cases'] })
      addToast('Case details updated successfully.', 'success')
    },
    onError: (err: any) => {
      addToast(err?.response?.data?.message || 'Failed to update case.', 'error')
    },
  })
}

export const useAssignCase = (id: string) => {
  const queryClient = useQueryClient()
  const { addToast } = useToast()

  return useMutation({
    mutationFn: (officerId: string) => casesService.assign(id, officerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cases', id] })
      queryClient.invalidateQueries({ queryKey: ['cases'] })
      addToast('Case assigned successfully.', 'success')
    },
    onError: (err: any) => {
      addToast(err?.response?.data?.message || 'Failed to assign case.', 'error')
    },
  })
}

export const useTransitionCase = (id: string) => {
  const queryClient = useQueryClient()
  const { addToast } = useToast()

  return useMutation({
    mutationFn: (status: string) => casesService.transitionStatus(id, status),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['cases', id] })
      queryClient.invalidateQueries({ queryKey: ['cases'] })
      addToast(`Case status transitioned to ${data.status}.`, 'success')
    },
    onError: (err: any) => {
      addToast(err?.response?.data?.message || 'Failed to transition case status.', 'error')
    },
  })
}

export const useAddTimelineEvent = (id: string) => {
  const queryClient = useQueryClient()
  const { addToast } = useToast()

  return useMutation({
    mutationFn: (payload: { event_time: string; title: string; description?: string }) =>
      casesService.addTimelineEvent(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cases', id, 'timeline'] })
      addToast('Timeline event added successfully.', 'success')
    },
    onError: (err: any) => {
      addToast(err?.response?.data?.message || 'Failed to add timeline event.', 'error')
    },
  })
}

export const useDeleteCase = () => {
  const queryClient = useQueryClient()
  const { addToast } = useToast()

  return useMutation({
    mutationFn: (id: string) => casesService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cases'] })
      addToast('Case soft-deleted successfully.', 'success')
    },
    onError: (err: any) => {
      addToast(err?.response?.data?.message || 'Failed to delete case.', 'error')
    },
  })
}
