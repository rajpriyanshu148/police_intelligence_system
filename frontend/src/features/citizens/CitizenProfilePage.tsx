import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, Save } from 'lucide-react'
import { PageTransition, Button, Card, Badge, Skeleton, Tabs, Input, Table } from '@/design-system'
import { useCitizen, useUpdateCitizen } from './hooks/useCitizens'
import { useComplaintsList } from '../complaints/hooks/useComplaints'
import type { Complaint } from '@/types'
import styles from './CitizensPage.module.css'

export const CitizenProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('complaints')

  const { data: citizen, isLoading, isError, refetch } = useCitizen(id || '')
  
  // Fetch complaints registered under this citizen
  const { data: complaintsData, isLoading: isComplaintsLoading } = useComplaintsList({
    citizen_id: id,
    page_size: 50,
  })

  // Edit fields
  const updateCitizenMutation = useUpdateCitizen(id || '')
  const [editName, setEditName] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [editAddress, setEditAddress] = useState('')

  // Sync edits when citizen data resolves
  React.useEffect(() => {
    if (citizen) {
      setEditName(citizen.name)
      setEditEmail(citizen.email || '')
      setEditPhone(citizen.phone_number || '')
      setEditAddress(citizen.address || '')
    }
  }, [citizen])

  if (isLoading || !citizen) {
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
        <h3 style={{ color: 'var(--danger)', marginBottom: '16px' }}>Failed to Load Citizen Profile</h3>
        <Button onClick={() => refetch()}>Retry Connection</Button>
      </div>
    )
  }

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editName.trim()) return

    try {
      await updateCitizenMutation.mutateAsync({
        name: editName,
        email: editEmail || undefined,
        phone_number: editPhone || undefined,
        address: editAddress || undefined,
      })
      setActiveTab('complaints')
    } catch {}
  }

  const complaintColumns = [
    {
      key: 'created_at',
      label: 'Filing Date',
      render: (row: Complaint) => new Date(row.created_at).toLocaleDateString(),
    },
    {
      key: 'complaint_text',
      label: 'Description Narrative',
      render: (row: Complaint) => (
        <span style={{ color: 'var(--muted-foreground)' }}>
          {row.complaint_text.length > 80 ? `${row.complaint_text.substring(0, 80)}...` : row.complaint_text}
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
      render: (row: Complaint) => {
        let badgeStatus: 'success' | 'warning' | 'danger' | 'info' = 'warning'
        if (row.status === 'Approved') badgeStatus = 'success'
        if (row.status === 'Rejected') badgeStatus = 'danger'
        return <Badge status={badgeStatus}>{row.status}</Badge>
      },
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row: Complaint) => (
        <Button variant="secondary" onClick={() => navigate(`/complaints/${row.id}`)}>
          View Detailed
        </Button>
      ),
    },
  ]

  const initials = citizen.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()

  return (
    <PageTransition className={styles.container}>
      <div>
        <Button variant="secondary" onClick={() => navigate('/citizens')} style={{ marginBottom: '16px' }}>
          <ChevronLeft size={16} style={{ marginRight: '8px' }} /> Back to Registry
        </Button>
        <div className={styles.header}>
          <h1 className={styles.title}>Citizen Personal Profile</h1>
        </div>
      </div>

      <div className={styles.profileLayout}>
        {/* Left Side: Avatar Card */}
        <div className={styles.profileCard}>
          <div className={styles.profileAvatar}>{initials}</div>
          <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)' }}>{citizen.name}</h2>
          
          <div className={styles.profileMetaList}>
            <div className={styles.profileMetaItem}>
              <span className={styles.profileMetaLabel}>Telephone Contact</span>
              <span className={styles.profileMetaValue}>{citizen.phone_number || 'No contact provided'}</span>
            </div>
            <div className={styles.profileMetaItem}>
              <span className={styles.profileMetaLabel}>Email Address</span>
              <span className={styles.profileMetaValue}>{citizen.email || 'No email provided'}</span>
            </div>
            <div className={styles.profileMetaItem}>
              <span className={styles.profileMetaLabel}>Home Address</span>
              <span className={styles.profileMetaValue}>{citizen.address || 'No residential address registered'}</span>
            </div>
          </div>
        </div>

        {/* Right Side: Operations Tabs */}
        <div>
          <Tabs
            activeTab={activeTab}
            onChange={setActiveTab}
            tabs={[
              { value: 'complaints', label: 'Registered Complaints History' },
              { value: 'edit', label: 'Edit Profile Information' },
            ]}
          >
            <div style={{ marginTop: '24px' }}>
              {activeTab === 'complaints' && (
                <Card title="Linked Citizen Incident Reports">
                  {isComplaintsLoading ? (
                    <Skeleton height="150px" />
                  ) : !complaintsData || complaintsData.items.length === 0 ? (
                    <div style={{ padding: '24px', textAlign: 'center', color: 'var(--muted-foreground)' }}>
                      No linked incident report logs registered under this citizen profile yet.
                    </div>
                  ) : (
                    <Table columns={complaintColumns as any} data={complaintsData.items as any} keyField="id" />
                  )}
                </Card>
              )}

              {activeTab === 'edit' && (
                <Card title="Update Registry Profile">
                  <form onSubmit={handleUpdateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <Input
                      id="editName"
                      label="Full Name"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                    />
                    <Input
                      id="editEmail"
                      label="Email Address"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                    />
                    <Input
                      id="editPhone"
                      label="Telephone Contact"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                    />
                    <Input
                      id="editAddress"
                      label="Residential Home Address"
                      value={editAddress}
                      onChange={(e) => setEditAddress(e.target.value)}
                    />
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                      <Button type="submit" loading={updateCitizenMutation.isPending}>
                        <Save size={16} style={{ marginRight: '8px' }} /> Save Changes
                      </Button>
                    </div>
                  </form>
                </Card>
              )}
            </div>
          </Tabs>
        </div>
      </div>
    </PageTransition>
  )
}
