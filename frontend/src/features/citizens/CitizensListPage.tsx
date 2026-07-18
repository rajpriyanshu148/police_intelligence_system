import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PlusCircle } from 'lucide-react'
import { PageTransition, Button, Table, Search, Dialog, Input, EmptyState, Skeleton } from '@/design-system'
import { useCitizensList, useCreateCitizen } from './hooks/useCitizens'
import styles from './CitizensPage.module.css'

export const CitizensListPage: React.FC = () => {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  // Form states for creating citizen
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  const { data, isLoading, isError, refetch } = useCitizensList({
    q: searchQuery || undefined,
    page,
    page_size: 10,
  })

  const createCitizenMutation = useCreateCitizen()

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
    setPage(1)
  }

  const validate = () => {
    const errs: { [key: string]: string } = {}
    if (!name.trim()) errs.name = 'Citizen name is required.'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    try {
      await createCitizenMutation.mutateAsync({
        name,
        email: email || undefined,
        phone_number: phone || undefined,
        address: address || undefined,
      })
      setIsCreateOpen(false)
      setName('')
      setEmail('')
      setPhone('')
      setAddress('')
    } catch {}
  }

  const columns = [
    {
      key: 'name',
      label: 'Citizen Name',
      render: (row: any) => (
        <span style={{ fontWeight: 'var(--weight-semibold)' }}>{row.name}</span>
      ),
    },
    {
      key: 'phone_number',
      label: 'Phone Number',
      render: (row: any) => row.phone_number || '—',
    },
    {
      key: 'email',
      label: 'Email Address',
      render: (row: any) => row.email || '—',
    },
    {
      key: 'address',
      label: 'Address Location',
      render: (row: any) => (
        <span style={{ color: 'var(--muted-foreground)' }}>
          {row.address && row.address.length > 50 ? `${row.address.substring(0, 50)}...` : row.address || '—'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row: any) => (
        <Button variant="secondary" onClick={() => navigate(`/citizens/${row.id}`)}>
          View Profile
        </Button>
      ),
    },
  ]

  return (
    <PageTransition className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Citizen Profiles Registry</h1>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <PlusCircle size={16} style={{ marginRight: '8px' }} /> Register Citizen
        </Button>
      </div>

      <div className={styles.filterRow}>
        <div className={styles.searchBox}>
          <Search
            placeholder="Search citizens by name, email, or telephone contact..."
            value={searchQuery}
            onChange={handleSearchChange}
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
          title="No Citizen Profiles Registered"
          description="There are no citizen profiles matches."
          action={
            <Button onClick={() => setIsCreateOpen(true)}>Register First Profile</Button>
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

      {/* Registration Dialog */}
      <Dialog
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Register Citizen Profile"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsCreateOpen(false)} disabled={createCitizenMutation.isPending}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} loading={createCitizenMutation.isPending}>
              Register Profile
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Input
            id="citizenName"
            label="Full Name"
            placeholder="e.g. Jane Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={errors.name}
          />
          <Input
            id="citizenEmail"
            label="Email Address"
            placeholder="e.g. jane.doe@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            id="citizenPhone"
            label="Phone Number"
            placeholder="e.g. +91 98765 43210"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <Input
            id="citizenAddress"
            label="Home / Residential Address"
            placeholder="Enter full address details..."
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
        </form>
      </Dialog>
    </PageTransition>
  )
}
