import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { aiService, type AIReviewPayload } from '@/services/ai.service'
import { useToast } from '@/hooks/useToast'

export const useAIHealth = () => {
  return useQuery({
    queryKey: ['ai', 'health'],
    queryFn: () => aiService.getHealth(),
    refetchInterval: 60000, // check health every 1 minute
  })
}

export const useAnalyzeCase = (caseId: string) => {
  const queryClient = useQueryClient()
  const { addToast } = useToast()

  return useMutation({
    mutationFn: () => aiService.analyze(caseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cases', caseId] })
      addToast('AI complaint analysis completed successfully.', 'success')
    },
    onError: (err: any) => {
      addToast(err?.response?.data?.message || 'Failed to execute AI analysis.', 'error')
    },
  })
}

export const useExtractEntities = (caseId: string) => {
  const { addToast } = useToast()

  return useMutation({
    mutationFn: () => aiService.extractEntities(caseId),
    onSuccess: () => {
      addToast('Named entities extracted successfully.', 'success')
    },
    onError: (err: any) => {
      addToast(err?.response?.data?.message || 'Failed to extract entities.', 'error')
    },
  })
}

export const useGenerateFIRDraft = (caseId: string) => {
  const { addToast } = useToast()

  return useMutation({
    mutationFn: (officerNotes?: string) => aiService.generateFIR(caseId, officerNotes),
    onSuccess: () => {
      addToast('AI FIR narrative generated successfully.', 'success')
    },
    onError: (err: any) => {
      addToast(err?.response?.data?.message || 'Failed to generate AI FIR narrative.', 'error')
    },
  })
}

export const useGenerateLegal = (caseId: string) => {
  const { addToast } = useToast()

  return useMutation({
    mutationFn: () => aiService.getLegalSections(caseId),
    onSuccess: () => {
      addToast('AI legal recommendations generated successfully.', 'success')
    },
    onError: (err: any) => {
      addToast(err?.response?.data?.message || 'Failed to generate legal recommendations.', 'error')
    },
  })
}

export const useReviewAI = (caseId: string) => {
  const queryClient = useQueryClient()
  const { addToast } = useToast()

  return useMutation({
    mutationFn: (payload: AIReviewPayload) => aiService.review(caseId, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['cases', caseId] })
      queryClient.invalidateQueries({ queryKey: ['fir', caseId] })
      addToast(`AI suggestion review submitted: status ${data.review_outcome}`, 'success')
    },
    onError: (err: any) => {
      addToast(err?.response?.data?.message || 'Failed to submit AI review decision.', 'error')
    },
  })
}
