import React, { useState } from 'react'
import { Dialog, Select, Button } from '@/design-system'
import { useExportReport } from './hooks/useReports'

interface GenerateReportFormProps {
  isOpen: boolean
  onClose: () => void
}

export const GenerateReportForm: React.FC<GenerateReportFormProps> = ({ isOpen, onClose }) => {
  const exportMutation = useExportReport()

  const [reportType, setReportType] = useState<'CRIME' | 'OFFICER' | 'AI' | 'OPERATIONAL'>('CRIME')
  const [timeframe, setTimeframe] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly')
  const [format, setFormat] = useState<'PDF' | 'EXCEL' | 'CSV'>('PDF')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      await exportMutation.mutateAsync({
        report_type: reportType,
        timeframe,
        format,
      })
      onClose()
    } catch {}
  }

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Generate Police Intelligence Report"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={exportMutation.isPending}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={exportMutation.isPending}>
            Trigger Export
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Select
          id="reportType"
          label="Report Domain Class"
          options={[
            { value: 'CRIME', label: 'Crime hotspots & categories' },
            { value: 'OFFICER', label: 'Officer workload & performance' },
            { value: 'AI', label: 'AI co-pilot accuracy audit log' },
            { value: 'OPERATIONAL', label: 'Station operational metrics' },
          ]}
          value={reportType}
          onChange={(e) => setReportType(e.target.value as any)}
        />

        <Select
          id="timeframe"
          label="Aggregated Timeframe Scope"
          options={[
            { value: 'daily', label: 'Daily (Past 24 Hours)' },
            { value: 'weekly', label: 'Weekly (Past 7 Days)' },
            { value: 'monthly', label: 'Monthly (Past 30 Days)' },
            { value: 'yearly', label: 'Yearly (Past 365 Days)' },
          ]}
          value={timeframe}
          onChange={(e) => setTimeframe(e.target.value as any)}
        />

        <Select
          id="format"
          label="Output File Format"
          options={[
            { value: 'PDF', label: 'PDF document' },
            { value: 'EXCEL', label: 'Excel spreadsheet' },
            { value: 'CSV', label: 'CSV raw values' },
          ]}
          value={format}
          onChange={(e) => setFormat(e.target.value as any)}
        />
      </form>
    </Dialog>
  )
}
