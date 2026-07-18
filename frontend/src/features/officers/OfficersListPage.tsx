import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PlusCircle, Trash2 } from 'lucide-react'
import { PageTransition, Button, Table, Badge, Select, Dialog, Input, EmptyState, Skeleton } from '@/design-system'
import { useOfficersList, useCreateOfficer, useDeleteOfficer } from './hooks/useOfficers'
import { useAuth } from '@/hooks/useAuth'
import styles from './OfficersPage.module.css'

export const OfficersListPage: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [role, setRole] = useState('')
  const [page, setPage] = useState(1)
  const [isOpen, setIsOpen] = useState(false)

  // Form states for creating officer
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [badgeNumber, setBadgeNumber] = useState('')
  const [dept, setDept] = useState('')
  const [selectedRole, setSelectedRole] = useState<'ADMIN' | 'SUPERVISOR' | 'INVESTIGATOR'>('INVESTIGATOR')
  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  const { data, isLoading, isError, refetch } = useOfficersList({
    role: role || undefined,
    page,
    page_size: 10,
  })

  const createMutation = useCreateOfficer()
  const deleteMutation = useDeleteOfficer()

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setRole(e.target.value)
    setPage(1)
  }

  const validate = () => {
    const errs: { [key: string]: string } = {}
    if (!username.trim()) errs.username = 'Username is required.'
    if (!email.trim()) errs.email = 'Email is required.'
    if (!password) errs.password = 'Initial password is required.'
    if (!badgeNumber.trim()) errs.badgeNumber = 'Badge ID is required.'
    if (!dept.trim()) errs.dept = 'Department is required.'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    try {
      await createMutation.mutateAsync({
        username,
        email,
        password,
        badge_number: badgeNumber,
        department: dept,
        role: selectedRole,
      })
      setIsOpen(false)
      setUsername('')
      setEmail('')
      setPassword('')
      setBadgeNumber('')
      setDept('')
      setSelectedRole('INVESTIGATOR')
      setErrors({})
    } catch {}
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to permanently suspend/delete this officer account from AIPAS registry?')) return
    try {
      await deleteMutation.mutateAsync(id)
    } catch {}
  }

  const columns = [
    {
      key: 'username',
      label: 'Officer',
      render: (row: any) => (
        <span style={{ fontWeight: 'var(--weight-semibold)' }}>{row.username}</span>
      ),
    },
    {
      key: 'badge_number',
      label: 'Badge Number',
    },
    {
      key: 'role',
      label: 'Security Role',
      render: (row: any) => {
        let badgeType: 'info' | 'success' | 'warning' | 'danger' = 'info'
        if (row.role === 'ADMIN') badgeType = 'danger'
        if (row.role === 'SUPERVISOR') badgeType = 'warning'
        return <Badge status={badgeType}>{row.role}</Badge>
      },
    },
    {
      key: 'department',
      label: 'Department',
    },
    {
      key: 'status',
      label: 'Status',
      render: (row: any) => <Badge status={row.status === 'Active' ? 'success' : 'danger'}>{row.status}</Badge>,
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row: any) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button variant="secondary" onClick={() => navigate(`/officers/${row.id}`)}>
            Profile
          </Button>
          {user?.role === 'ADMIN' && (
            <Button
              variant="danger"
              onClick={() => handleDelete(row.id)}
              loading={deleteMutation.isPending && deleteMutation.variables === row.id}
              style={{ padding: '6px' }}
            >
              <Trash2 size={14} />
            </Button>
          )}
        </div>
      ),
    },
  ]

  const isAdmin = user?.role === 'ADMIN'

  return (
    <PageTransition className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Officers Directory</h1>
        </div>
        {isAdmin && (
          <Button onClick={() => setIsOpen(true)}>
            <PlusCircle size={16} style={{ marginRight: '8px' }} /> Register Officer
          </Button>
        )}
      </div>

      <div className={styles.filterRow}>
        <div className={styles.selectBox}>
          <Select
            id="filterRole"
            options={[
              { value: '', label: 'All Roles' },
              { value: 'ADMIN', label: 'Administrator' },
              { value: 'SUPERVISOR', label: 'Supervisor' },
              { value: 'INVESTIGATOR', label: 'Investigator' },
            ]}
            value={role}
            onChange={handleRoleChange}
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
          <Button onClick={() => refetch()}>Retry Directory</Button>
        </div>
      ) : !data || data.items.length === 0 ? (
        <EmptyState
          title="No Officers Registered"
          description="There are no officers registered matching the parameters."
          action={
            isAdmin ? (
              <Button onClick={() => setIsOpen(true)}>Register First Officer</Button>
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

      {/* Creation Dialog */}
      <Dialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Register Force Officer"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsOpen(false)} disabled={createMutation.isPending}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} loading={createMutation.isPending}>
              Register Officer
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className={styles.formGrid}>
          <Input id="oUsername" label="Username" placeholder="e.g. officer_doe" value={username} onChange={(e) => setUsername(e.target.value)} error={errors.username} />
          <Input id="oEmail" label="Email Address" placeholder="e.g. doe@aipas.gov" value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} />
          <Input id="oPassword" type="password" label="Initial Password" placeholder="e.g. min 8 characters" value={password} onChange={(e) => setPassword(e.target.value)} error={errors.password} />
          <Input id="oBadge" label="Badge ID Number" placeholder="e.g. BADGE-483" value={badgeNumber} onChange={(e) => setBadgeNumber(e.target.value)} error={errors.badgeNumber} />
          <Input id="oDept" label="Department" placeholder="e.g. Narcotics, Cybercrime" value={dept} onChange={(e) => setDept(e.target.value)} error={errors.dept} />
          <Select
            id="oRole"
            label="Officer Security Role"
            options={[
              { value: 'INVESTIGATOR', label: 'Investigator' },
              { value: 'SUPERVISOR', label: 'Supervisor' },
              { value: 'ADMIN', label: 'Administrator' },
            ]}
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value as any)}
          />
        </form>
      </Dialog>
    </PageTransition>
  )
}
