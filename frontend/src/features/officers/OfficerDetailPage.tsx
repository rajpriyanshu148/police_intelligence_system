import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, UserX, UserCheck } from 'lucide-react'
import { PageTransition, Button, Card, Badge, Skeleton, Table } from '@/design-system'
import { useOfficer, useUpdateOfficer } from './hooks/useOfficers'
import { useCasesList } from '../cases/hooks/useCases'
import { useAuth } from '@/hooks/useAuth'
import styles from './OfficersPage.module.css'

export const OfficerDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user: currentUser } = useAuth()

  const { data: officer, isLoading, isError, refetch } = useOfficer(id || '')
  
  // Fetch cases assigned to this investigator
  const { data: casesData, isLoading: isCasesLoading } = useCasesList({
    status: undefined,
  })

  const updateMutation = useUpdateOfficer(id || '')

  const handleToggleStatus = async () => {
    if (!officer) return
    const newStatus = officer.status === 'Active' ? 'Suspended' : 'Active'
    try {
      await updateMutation.mutateAsync({ status: newStatus })
    } catch {}
  }

  if (isLoading || !officer) {
    return (
      <div className={styles.container}>
        <Skeleton width="120px" height="24px" />
        <div className={styles.profileLayout}>
          <Skeleton height="350px" />
          <Skeleton height="350px" />
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h3 style={{ color: 'var(--danger)', marginBottom: '16px' }}>Failed to Load Officer Profile</h3>
        <Button onClick={() => refetch()}>Retry Connection</Button>
      </div>
    )
  }

  const caseColumns = [
    {
      key: 'case_number',
      label: 'Case Number',
      render: (row: any) => (
        <span style={{ fontWeight: 'var(--weight-bold)' }}>{row.case_number}</span>
      ),
    },
    {
      key: 'title',
      label: 'Title',
    },
    {
      key: 'status',
      label: 'Status',
      render: (row: any) => <Badge status={row.status === 'Closed' ? 'success' : 'warning'}>{row.status}</Badge>,
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row: any) => (
        <Button variant="secondary" onClick={() => navigate(`/cases/${row.id}`)}>
          Inspect
        </Button>
      ),
    },
  ]

  const initials = officer.username.substring(0, 2).toUpperCase()
  const isAdmin = currentUser?.role === 'ADMIN'

  // Filter cases assigned to this officer specifically
  const assignedCases = (casesData?.items || []).filter(
    (c) => c.assigned_officer_id === officer.id
  )

  return (
    <PageTransition className={styles.container}>
      <div>
        <Button variant="secondary" onClick={() => navigate('/officers')} style={{ marginBottom: '16px' }}>
          <ChevronLeft size={16} style={{ marginRight: '8px' }} /> Back to Directory
        </Button>
        <div className={styles.header}>
          <h1 className={styles.title}>Officer Personal Profile</h1>
          <Badge status={officer.status === 'Active' ? 'success' : 'danger'}>{officer.status}</Badge>
        </div>
      </div>

      <div className={styles.profileLayout}>
        {/* Left Avatar Card */}
        <div className={styles.profileCard}>
          <div className={styles.avatar}>{initials}</div>
          <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)' }}>{officer.username}</h2>
          <Badge status={officer.role === 'ADMIN' ? 'danger' : 'info'}>{officer.role}</Badge>
          
          <div className={styles.profileMetaList}>
            <div className={styles.profileMetaItem}>
              <span className={styles.profileMetaLabel}>Badge ID Number</span>
              <span className={styles.profileMetaValue}>{officer.badge_number}</span>
            </div>
            <div className={styles.profileMetaItem}>
              <span className={styles.profileMetaLabel}>Email Address</span>
              <span className={styles.profileMetaValue}>{officer.email}</span>
            </div>
            <div className={styles.profileMetaItem}>
              <span className={styles.profileMetaLabel}>Force Department</span>
              <span className={styles.profileMetaValue}>{officer.department || 'General Duties'}</span>
            </div>
          </div>

          {isAdmin && (
            <div style={{ width: '100%', marginTop: '8px' }}>
              <Button
                variant={officer.status === 'Active' ? 'danger' : 'primary'}
                onClick={handleToggleStatus}
                loading={updateMutation.isPending}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                {officer.status === 'Active' ? (
                  <>
                    <UserX size={16} /> Suspend Account
                  </>
                ) : (
                  <>
                    <UserCheck size={16} /> Activate Account
                  </>
                )}
              </Button>
            </div>
          )}
        </div>

        {/* Right Active Case List Table */}
        <div>
          <Card title="Active Case Assignment List">
            {isCasesLoading ? (
              <Skeleton height="200px" />
            ) : assignedCases.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--muted-foreground)' }}>
                No active investigations cases assigned to this officer.
              </div>
            ) : (
              <Table columns={caseColumns as any} data={assignedCases as any} keyField="id" />
            )}
          </Card>
        </div>
      </div>
    </PageTransition>
  )
}
