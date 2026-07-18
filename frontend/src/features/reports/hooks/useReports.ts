import { useQuery, useMutation } from '@tanstack/react-query'
import { reportsService, type ExportReportParams } from '@/services/reports.service'
import { useToast } from '@/hooks/useToast'

export const useReportStatus = (reportId: string) => {
  return useQuery({
    queryKey: ['reports', reportId, 'status'],
    queryFn: () => reportsService.getStatus(reportId),
    enabled: !!reportId,
    refetchInterval: (query) => {
      // Poll every 5s if the report is pending
      const status = query.state.data?.status
      return status === 'PENDING' ? 5000 : false
    },
  })
}

export const useExportReport = () => {
  const { addToast } = useToast()

  return useMutation({
    mutationFn: (payload: ExportReportParams) => reportsService.export(payload),
    onSuccess: (data, variables) => {
      // Add to localStorage history
      reportsService.addToHistory({
        id: data.report_id,
        type: variables.report_type,
        timeframe: variables.timeframe,
        format: variables.format,
      })
      addToast('Report export job triggered successfully.', 'success')
    },
    onError: (err: any) => {
      addToast(err?.response?.data?.message || 'Failed to trigger report export.', 'error')
    },
  })
}

export const useDownloadReport = () => {
  const { addToast } = useToast()

  return useMutation({
    mutationFn: (reportId: string) => reportsService.getDownloadUrl(reportId),
    onSuccess: (data) => {
      window.open(data.download_url, '_blank')
    },
    onError: (err: any) => {
      addToast(err?.response?.data?.message || 'Failed to download report.', 'error')
    },
  })
}
