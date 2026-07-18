import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PlusCircle } from 'lucide-react'
import { PageTransition, Button, Table, Badge, Search, Select, EmptyState, Skeleton } from '@/design-system'
import { useComplaintsList } from './hooks/useComplaints'
import { ComplaintCreateForm } from './ComplaintCreateForm'
import styles from './ComplaintsPage.module.css'

export const ComplaintsListPage: React.FC = () => {
  const navigate = useNavigate()
  const [status, setStatus] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  const { data, isLoading, isError, refetch } = useComplaintsList({
    status: status || undefined,
    q: searchQuery || undefined,
    page,
    page_size: 10,
  })

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
    setPage(1) // Reset to page 1 on search
  }

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatus(e.target.value)
    setPage(1) // Reset to page 1
  }

  const columns = [
    {
      key: 'citizen_name',
      label: 'Citizen Name',
      render: (row: any) => (
        <span style={{ fontWeight: 'var(--weight-semibold)' }}>{row.citizen_name}</span>
      ),
    },
    {
      key: 'citizen_contact',
      label: 'Contact',
    },
    {
      key: 'complaint_text',
      label: 'Narrative Detail',
      render: (row: any) => (
        <span style={{ color: 'var(--muted-foreground)' }}>
          {row.complaint_text.length > 70 ? `${row.complaint_text.substring(0, 70)}...` : row.complaint_text}
        </span>
      ),
    },
    {
      key: 'source',
      label: 'Source',
    },
    {
      key: 'status',
      label: 'Status',
      render: (row: any) => {
        let badgeStatus: 'success' | 'warning' | 'danger' | 'info' = 'warning'
        if (row.status === 'Approved') badgeStatus = 'success'
        if (row.status === 'Rejected') badgeStatus = 'danger'
        if (row.status === 'Reviewing') badgeStatus = 'info'
        return <Badge status={badgeStatus}>{row.status}</Badge>
      },
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row: any) => (
        <Button variant="secondary" onClick={() => navigate(`/complaints/${row.id}`)}>
          View Case
        </Button>
      ),
    },
  ]

  return (
    <PageTransition className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Complaints Registry</h1>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <PlusCircle size={16} style={{ marginRight: '8px' }} /> Log New Complaint
        </Button>
      </div>

      <div className={styles.filterRow}>
        <div className={styles.searchBox}>
          <Search
            placeholder="Search citizen names or complaint text narrative..."
            value={searchQuery}
            onChange={handleSearchChange}
          />
        </div>
        <div className={styles.selectBox}>
          <Select
            id="filterStatus"
            options={[
              { value: '', label: 'All Statuses' },
              { value: 'Pending', label: 'Pending Review' },
              { value: 'Reviewing', label: 'Under Review' },
              { value: 'Approved', label: 'Approved (Case Created)' },
              { value: 'Rejected', label: 'Rejected' },
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
          title="No Complaints Found"
          description="There are no citizen complaints logged matching your search filters."
          action={
            <Button onClick={() => setIsCreateOpen(true)}>
              Log First Complaint
            </Button>
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

      <ComplaintCreateForm isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
    </PageTransition>
  )
}
