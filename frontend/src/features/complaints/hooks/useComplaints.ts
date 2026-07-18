import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { complaintsService, type CreateComplaintParams, type UpdateComplaintParams } from '@/services/complaints.service'
import { useToast } from '@/hooks/useToast'

export const useComplaintsList = (params: { status?: string; q?: string; citizen_id?: string; page?: number; page_size?: number } = {}) => {
  return useQuery({
    queryKey: ['complaints', params],
    queryFn: () => complaintsService.list(params),
  })
}

export const useComplaint = (id: string) => {
  return useQuery({
    queryKey: ['complaints', id],
    queryFn: () => complaintsService.get(id),
    enabled: !!id,
  })
}

export const useCreateComplaint = () => {
  const queryClient = useQueryClient()
  const { addToast } = useToast()

  return useMutation({
    mutationFn: (payload: CreateComplaintParams) => complaintsService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['complaints'] })
      addToast('Complaint logged successfully.', 'success')
    },
    onError: (err: any) => {
      addToast(err?.response?.data?.message || 'Failed to log complaint.', 'error')
    },
  })
}

export const useUpdateComplaint = (id: string) => {
  const queryClient = useQueryClient()
  const { addToast } = useToast()

  return useMutation({
    mutationFn: (payload: UpdateComplaintParams) => complaintsService.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['complaints', id] })
      queryClient.invalidateQueries({ queryKey: ['complaints'] })
      addToast('Complaint details updated successfully.', 'success')
    },
    onError: (err: any) => {
      addToast(err?.response?.data?.message || 'Failed to update complaint.', 'error')
    },
  })
}

export const useAssignComplaint = (id: string) => {
  const queryClient = useQueryClient()
  const { addToast } = useToast()

  return useMutation({
    mutationFn: (officerId: string) => complaintsService.assign(id, officerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['complaints', id] })
      queryClient.invalidateQueries({ queryKey: ['complaints'] })
      addToast('Complaint assigned successfully.', 'success')
    },
    onError: (err: any) => {
      addToast(err?.response?.data?.message || 'Failed to assign complaint.', 'error')
    },
  })
}

export const useTransitionComplaint = (id: string) => {
  const queryClient = useQueryClient()
  const { addToast } = useToast()

  return useMutation({
    mutationFn: (status: string) => complaintsService.transitionStatus(id, status),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['complaints', id] })
      queryClient.invalidateQueries({ queryKey: ['complaints'] })
      addToast(`Complaint status updated to ${data.status}.`, 'success')
    },
    onError: (err: any) => {
      addToast(err?.response?.data?.message || 'Failed to update complaint status.', 'error')
    },
  })
}

export const useDeleteComplaint = () => {
  const queryClient = useQueryClient()
  const { addToast } = useToast()

  return useMutation({
    mutationFn: (id: string) => complaintsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['complaints'] })
      addToast('Complaint deleted successfully.', 'success')
    },
    onError: (err: any) => {
      addToast(err?.response?.data?.message || 'Failed to delete complaint.', 'error')
    },
  })
}
