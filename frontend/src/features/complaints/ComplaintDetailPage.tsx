import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, ShieldAlert, CheckSquare, XOctagon } from 'lucide-react'
import { PageTransition, Button, Card, Badge, Skeleton } from '@/design-system'
import { useComplaint, useTransitionComplaint } from './hooks/useComplaints'
import { CaseCreateForm } from '../cases/CaseCreateForm'
import styles from './ComplaintsPage.module.css'

export const ComplaintDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [isCaseCreateOpen, setIsCaseCreateOpen] = useState(false)

  const { data: complaint, isLoading, isError, refetch } = useComplaint(id || '')
  const transitionMutation = useTransitionComplaint(id || '')

  if (isLoading) {
    return (
      <div className={styles.container}>
        <Skeleton width="120px" height="24px" />
        <Skeleton height="150px" className="mt-4" />
        <div className={styles.detailGrid}>
          <Skeleton height="300px" />
          <Skeleton height="300px" />
        </div>
      </div>
    )
  }

  if (isError || !complaint) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h3 style={{ color: 'var(--danger)', marginBottom: '16px' }}>Failed to Load Complaint</h3>
        <Button onClick={() => refetch()}>Retry Connection</Button>
      </div>
    )
  }

  const handleStatusTransition = async (newStatus: string) => {
    try {
      await transitionMutation.mutateAsync(newStatus)
    } catch {
      // Toast notification handles display
    }
  }

  let badgeStatus: 'success' | 'warning' | 'danger' | 'info' = 'warning'
  if (complaint.status === 'Approved') badgeStatus = 'success'
  if (complaint.status === 'Rejected') badgeStatus = 'danger'
  if (complaint.status === 'Reviewing') badgeStatus = 'info'

  return (
    <PageTransition className={styles.container}>
      <div>
        <Button variant="secondary" onClick={() => navigate('/complaints')} style={{ marginBottom: '16px' }}>
          <ChevronLeft size={16} style={{ marginRight: '8px' }} /> Back to Registry
        </Button>
        <div className={styles.header}>
          <h1 className={styles.title}>Citizen Complaint Profile</h1>
          <Badge status={badgeStatus}>{complaint.status}</Badge>
        </div>
      </div>

      <div className={styles.detailGrid}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className={styles.complaintTextCard}>
            <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)', marginBottom: '16px' }}>
              Incident Description Narrative
            </h2>
            <div className={styles.complaintText}>{complaint.complaint_text}</div>
          </div>

          {complaint.status !== 'Approved' && complaint.status !== 'Rejected' && (
            <Card title="Complaint Workflow Operations">
              <div className={styles.actionBar}>
                {complaint.status === 'Pending' && (
                  <Button variant="secondary" onClick={() => handleStatusTransition('Reviewing')} loading={transitionMutation.isPending}>
                    <ShieldAlert size={16} style={{ marginRight: '8px' }} /> Mark Under Review
                  </Button>
                )}
                {complaint.status === 'Reviewing' && (
                  <>
                    <Button variant="danger" onClick={() => handleStatusTransition('Rejected')} loading={transitionMutation.isPending}>
                      <XOctagon size={16} style={{ marginRight: '8px' }} /> Reject Complaint
                    </Button>
                    <Button onClick={() => setIsCaseCreateOpen(true)}>
                      <CheckSquare size={16} style={{ marginRight: '8px' }} /> Approve & Launch Case
                    </Button>
                  </>
                )}
              </div>
            </Card>
          )}
        </div>

        <div>
          <div className={styles.metaInfoCard}>
            <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)', marginBottom: '8px' }}>
              Citizen Information
            </h2>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Full Name:</span>
              <span className={styles.metaValue}>{complaint.citizen_name}</span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Contact Details:</span>
              <span className={styles.metaValue}>{complaint.citizen_contact}</span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Filing Source:</span>
              <span className={styles.metaValue}>{complaint.source}</span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Filing Date:</span>
              <span className={styles.metaValue}>{new Date(complaint.created_at).toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      <CaseCreateForm
        isOpen={isCaseCreateOpen}
        onClose={() => setIsCaseCreateOpen(false)}
        complaintId={complaint.id}
      />
    </PageTransition>
  )
}
