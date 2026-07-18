import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { evidenceService, type GetUploadUrlParams } from '@/services/evidence.service'
import { useToast } from '@/hooks/useToast'

export const useEvidenceList = (caseId: string) => {
  return useQuery({
    queryKey: ['evidence', caseId],
    queryFn: () => evidenceService.list(caseId),
    enabled: !!caseId,
  })
}

export const useEvidenceVersions = (caseId: string, evidenceId: string) => {
  return useQuery({
    queryKey: ['evidence', caseId, evidenceId, 'versions'],
    queryFn: () => evidenceService.getVersions(caseId, evidenceId),
    enabled: !!caseId && !!evidenceId,
  })
}

export const useUploadEvidence = (caseId: string) => {
  const queryClient = useQueryClient()
  const { addToast } = useToast()

  return useMutation({
    mutationFn: async ({ file, meta, evidenceId }: { file: File; meta: GetUploadUrlParams; evidenceId?: string }) => {
      // Step 1: Request presigned URL
      const presign = await evidenceService.getUploadUrl(caseId, meta, evidenceId)
      
      // Step 2: Upload file directly to S3/local endpoint via PUT
      await evidenceService.uploadToPresignedUrl(presign.upload_url, file)
      
      // Step 3: Confirm upload
      const payload = {
        evidence_id: presign.evidence_id,
        version_number: presign.version_number,
        storage_path: presign.storage_path,
        sha256_hash: 'mock-sha256-hash-value-here', // In production, we'd compute this client-side
      }
      return evidenceService.confirmUpload(caseId, payload, {
        title: meta.title,
        description: meta.description,
        category: meta.category,
        file_name: meta.file_name,
        file_size: meta.file_size,
        mime_type: meta.mime_type,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evidence', caseId] })
      addToast('Evidence uploaded and verified successfully.', 'success')
    },
    onError: (err: any) => {
      addToast(err?.response?.data?.message || err?.message || 'Failed to upload evidence.', 'error')
    },
  })
}

export const useDownloadEvidence = () => {
  const { addToast } = useToast()

  return useMutation({
    mutationFn: ({ caseId, evidenceId, version, reason }: { caseId: string; evidenceId: string; version?: number; reason?: string }) =>
      evidenceService.getDownloadUrl(caseId, evidenceId, version, reason),
    onSuccess: (data) => {
      // Trigger a clean file download
      window.open(data.download_url, '_blank')
    },
    onError: (err: any) => {
      addToast(err?.response?.data?.message || 'Failed to generate download URL.', 'error')
    },
  })
}

export const useDeleteEvidence = (caseId: string) => {
  const queryClient = useQueryClient()
  const { addToast } = useToast()

  return useMutation({
    mutationFn: (evidenceId: string) => evidenceService.delete(caseId, evidenceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evidence', caseId] })
      addToast('Evidence record deleted successfully.', 'success')
    },
    onError: (err: any) => {
      addToast(err?.response?.data?.message || 'Failed to delete evidence.', 'error')
    },
  })
}
