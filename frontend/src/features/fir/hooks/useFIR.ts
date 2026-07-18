import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { firService, type CreateFIRParams, type UpdateFIRParams, type ReviewFIRParams } from '@/services/fir.service'
import { useToast } from '@/hooks/useToast'

export const useFIR = (caseId: string) => {
  return useQuery({
    queryKey: ['fir', caseId],
    queryFn: () => firService.get(caseId),
    enabled: !!caseId,
    retry: false, // If no FIR draft exists yet, it will error with 404 which is handled gracefully in UI
  })
}

export const useFIRHistory = (caseId: string) => {
  return useQuery({
    queryKey: ['fir', caseId, 'history'],
    queryFn: () => firService.getHistory(caseId),
    enabled: !!caseId,
  })
}

export const useCreateFIR = (caseId: string) => {
  const queryClient = useQueryClient()
  const { addToast } = useToast()

  return useMutation({
    mutationFn: (payload: CreateFIRParams) => firService.create(caseId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fir', caseId] })
      queryClient.invalidateQueries({ queryKey: ['cases', caseId] })
      addToast('FIR draft created successfully.', 'success')
    },
    onError: (err: any) => {
      addToast(err?.response?.data?.message || 'Failed to create FIR draft.', 'error')
    },
  })
}

export const useUpdateFIR = (caseId: string) => {
  const queryClient = useQueryClient()
  const { addToast } = useToast()

  return useMutation({
    mutationFn: (payload: UpdateFIRParams) => firService.update(caseId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fir', caseId] })
      queryClient.invalidateQueries({ queryKey: ['fir', caseId, 'history'] })
      addToast('FIR draft saved.', 'success')
    },
    onError: (err: any) => {
      addToast(err?.response?.data?.message || 'Failed to save FIR draft.', 'error')
    },
  })
}

export const useSubmitFIR = (caseId: string) => {
  const queryClient = useQueryClient()
  const { addToast } = useToast()

  return useMutation({
    mutationFn: () => firService.submit(caseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fir', caseId] })
      queryClient.invalidateQueries({ queryKey: ['cases', caseId] })
      addToast('FIR narrative submitted for supervisor review.', 'success')
    },
    onError: (err: any) => {
      addToast(err?.response?.data?.message || 'Failed to submit FIR.', 'error')
    },
  })
}

export const useReviewFIR = (caseId: string) => {
  const queryClient = useQueryClient()
  const { addToast } = useToast()

  return useMutation({
    mutationFn: (payload: ReviewFIRParams) => firService.review(caseId, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['fir', caseId] })
      queryClient.invalidateQueries({ queryKey: ['cases', caseId] })
      queryClient.invalidateQueries({ queryKey: ['fir', caseId, 'history'] })
      addToast(`FIR status updated to ${data.status}.`, 'success')
    },
    onError: (err: any) => {
      addToast(err?.response?.data?.message || 'Failed to submit review.', 'error')
    },
  })
}
