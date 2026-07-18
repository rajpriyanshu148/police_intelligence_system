import React, { useState, useEffect } from 'react'
import { PlusCircle, Download, RefreshCw } from 'lucide-react'
import { PageTransition, Button, Table, Badge, EmptyState } from '@/design-system'
import { GenerateReportForm } from './GenerateReportForm'
import { useDownloadReport } from './hooks/useReports'
import { reportsService } from '@/services/reports.service'
import { formatDateTime } from '@/utils/format'
import styles from './ReportsPage.module.css'

export const ReportsPage: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [history, setHistory] = useState<any[]>([])
  
  const downloadMutation = useDownloadReport()

  // Load history from localStorage
  const loadHistory = () => {
    setHistory(reportsService.getHistory())
  }

  useEffect(() => {
    loadHistory()
  }, [isOpen])

  const handleDownload = (reportId: string) => {
    downloadMutation.mutate(reportId)
  }

  const columns = [
    {
      key: 'type',
      label: 'Report Domain',
      render: (row: any) => (
        <span style={{ fontWeight: 'var(--weight-bold)' }}>{row.type} Analysis</span>
      ),
    },
    {
      key: 'timeframe',
      label: 'Aggregated Scope',
      render: (row: any) => <Badge status="info">{row.timeframe}</Badge>,
    },
    {
      key: 'format',
      label: 'File Format',
      render: (row: any) => <Badge status="warning">{row.format}</Badge>,
    },
    {
      key: 'date',
      label: 'Triggered Date',
      render: (row: any) => <span>{formatDateTime(row.date)}</span>,
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row: any) => (
        <Button
          onClick={() => handleDownload(row.id)}
          loading={downloadMutation.isPending && downloadMutation.variables === row.id}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '6px 12px' }}
        >
          <Download size={14} /> Download File
        </Button>
      ),
    },
  ]

  return (
    <PageTransition className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Police Intelligence Reports</h1>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Button variant="secondary" onClick={loadHistory}>
            <RefreshCw size={16} />
          </Button>
          <Button onClick={() => setIsOpen(true)}>
            <PlusCircle size={16} style={{ marginRight: '8px' }} /> Generate Report
          </Button>
        </div>
      </div>

      {history.length === 0 ? (
        <EmptyState
          title="No Reports Generated"
          description="There are no police intelligence reports generated in your local session history list."
          action={
            <Button onClick={() => setIsOpen(true)}>
              Generate First Report
            </Button>
          }
        />
      ) : (
        <Table columns={columns as any} data={history as any} keyField="id" />
      )}

      <GenerateReportForm isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </PageTransition>
  )
}
