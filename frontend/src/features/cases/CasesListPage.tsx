import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PlusCircle } from 'lucide-react'
import { PageTransition, Button, Table, Badge, Select, EmptyState, Skeleton } from '@/design-system'
import { useCasesList } from './hooks/useCases'
import { CaseCreateForm } from './CaseCreateForm'
import { formatDate } from '@/utils/format'
import { useAuth } from '@/hooks/useAuth'
import styles from './CasesPage.module.css'

export const CasesListPage: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  const { data, isLoading, isError, refetch } = useCasesList({
    status: status || undefined,
    page,
    page_size: 10,
  })

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatus(e.target.value)
    setPage(1)
  }

  const columns = [
    {
      key: 'case_number',
      label: 'Case Number',
      render: (row: any) => (
        <span style={{ fontWeight: 'var(--weight-bold)' }}>{row.case_number}</span>
      ),
    },
    {
      key: 'title',
      label: 'Title / Subject',
    },
    {
      key: 'category',
      label: 'Category',
      render: (row: any) => <Badge status="info">{row.category}</Badge>,
    },
    {
      key: 'status',
      label: 'Status',
      render: (row: any) => {
        let badgeStatus: 'success' | 'warning' | 'danger' | 'info' = 'warning'
        if (row.status === 'Closed') badgeStatus = 'success'
        if (row.status === 'Cold Case') badgeStatus = 'danger'
        if (row.status === 'Pending Review') badgeStatus = 'info'
        return <Badge status={badgeStatus}>{row.status}</Badge>
      },
    },
    {
      key: 'severity',
      label: 'Severity',
      render: (row: any) => {
        const sev = row.severity
        let badgeStatus: 'success' | 'warning' | 'danger' | 'info' = 'info'
        if (sev === 'Critical') badgeStatus = 'danger'
        if (sev === 'High') badgeStatus = 'warning'
        return <Badge status={badgeStatus}>{sev}</Badge>
      },
    },
    {
      key: 'priority',
      label: 'Priority',
      render: (row: any) => {
        const prio = row.priority
        let badgeStatus: 'success' | 'warning' | 'danger' | 'info' = 'info'
        if (prio === 'P1') badgeStatus = 'danger'
        if (prio === 'P2') badgeStatus = 'warning'
        return <Badge status={badgeStatus}>{prio}</Badge>
      },
    },
    {
      key: 'opened_at',
      label: 'Opened Date',
      render: (row: any) => <span>{formatDate(row.opened_at)}</span>,
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row: any) => (
        <Button variant="secondary" onClick={() => navigate(`/cases/${row.id}`)}>
          Inspect Case
        </Button>
      ),
    },
  ]

  const isAllowedToCreate = user && ['ADMIN', 'SUPERVISOR'].includes(user.role)

  return (
    <PageTransition className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Case Registry Index</h1>
        </div>
        {isAllowedToCreate && (
          <Button onClick={() => setIsCreateOpen(true)}>
            <PlusCircle size={16} style={{ marginRight: '8px' }} /> Launch Case
          </Button>
        )}
      </div>

      <div className={styles.filterRow}>
        <div className={styles.selectBox}>
          <Select
            id="filterStatus"
            options={[
              { value: '', label: 'All Investigation Statuses' },
              { value: 'Under Investigation', label: 'Under Investigation' },
              { value: 'Pending Review', label: 'Pending Review' },
              { value: 'Closed', label: 'Closed' },
              { value: 'Cold Case', label: 'Cold Case' },
              { value: 'Referred', label: 'Referred' },
            ]}
            value={status}
            onChange={handleStatusChange}
          />
        </div>
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {Array.from({ length: 5 }).map((_, idx) => (
            <Skeleton key={idx} height="52px" />
          ))}
        </div>
      ) : isError ? (
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <h3 style={{ color: 'var(--danger)', marginBottom: '12px' }}>Connection Failure</h3>
          <Button onClick={() => refetch()}>Retry List</Button>
        </div>
      ) : !data || data.items.length === 0 ? (
        <EmptyState
          title="No Active Investigations Found"
          description="There are no cases matching your selection."
          action={
            isAllowedToCreate ? (
              <Button onClick={() => setIsCreateOpen(true)}>Launch New Case</Button>
            ) : undefined
          }
        />
      ) : (
        <>
          <Table columns={columns as any} data={data.items as any} keyField="id" />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--muted-foreground)' }}>
              Page {data.page} of {data.total_pages || 1} ({data.total} records total)
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Button
                variant="secondary"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                Previous
              </Button>
              <Button
                variant="secondary"
                disabled={page >= data.total_pages}
                onClick={() => setPage(page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </>
      )}

      <CaseCreateForm isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
    </PageTransition>
  )
}
