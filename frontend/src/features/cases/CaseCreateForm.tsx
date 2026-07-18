import React, { useState, useEffect } from 'react'
import { Dialog, Input, Select, Button } from '@/design-system'
import { useCreateCase } from './hooks/useCases'

interface CaseCreateFormProps {
  isOpen: boolean
  onClose: () => void
  complaintId?: string
}

export const CaseCreateForm: React.FC<CaseCreateFormProps> = ({ isOpen, onClose, complaintId }) => {
  const createCaseMutation = useCreateCase()

  const [formComplaintId, setFormComplaintId] = useState(complaintId || '')
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('Criminal')
  const [severity, setSeverity] = useState('Moderate')
  const [priority, setPriority] = useState('P3')
  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  // Update complaintId if it shifts via parent prop
  useEffect(() => {
    if (complaintId) {
      setFormComplaintId(complaintId)
    }
  }, [complaintId])

  const validate = () => {
    const errs: { [key: string]: string } = {}
    if (!formComplaintId.trim()) errs.complaintId = 'Complaint ID is required.'
    if (!title.trim()) errs.title = 'Case Title is required.'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    try {
      await createCaseMutation.mutateAsync({
        complaint_id: formComplaintId,
        title,
        category,
        severity,
        priority,
      })
      onClose()
      // Reset form
      setTitle('')
      setCategory('Criminal')
      setSeverity('Moderate')
      setPriority('P3')
    } catch {
      // Toast notification handles display
    }
  }

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Launch New Case Investigation"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={createCaseMutation.isPending}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={createCaseMutation.isPending}>
            Create Case
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Input
          id="complaintId"
          label="Source Complaint ID (UUID)"
          placeholder="e.g. 123e4567-e89b-12d3-a456-426614174000"
          value={formComplaintId}
          onChange={(e) => setFormComplaintId(e.target.value)}
          error={errors.complaintId}
          disabled={!!complaintId}
        />

        <Input
          id="title"
          label="Investigation Title"
          placeholder="e.g. Theft of electronics from warehouse..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          error={errors.title}
        />

        <Select
          id="category"
          label="Crime Category"
          options={[
            { value: 'Criminal', label: 'Criminal Law' },
            { value: 'Civil', label: 'Civil Dispute' },
            { value: 'Traffic', label: 'Traffic Violation' },
            { value: 'Cybercrime', label: 'Cybercrime' },
            { value: 'Domestic', label: 'Domestic Violence' },
            { value: 'Other', label: 'Other Classification' },
          ]}
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        />

        <Select
          id="severity"
          label="Investigation Severity"
          options={[
            { value: 'Critical', label: 'Critical' },
            { value: 'High', label: 'High' },
            { value: 'Moderate', label: 'Moderate' },
            { value: 'Low', label: 'Low' },
          ]}
          value={severity}
          onChange={(e) => setSeverity(e.target.value)}
        />

        <Select
          id="priority"
          label="Response Priority"
          options={[
            { value: 'P1', label: 'Priority 1 (Emergency Response)' },
            { value: 'P2', label: 'Priority 2 (High Response)' },
            { value: 'P3', label: 'Priority 3 (Routine Investigation)' },
            { value: 'P4', label: 'Priority 4 (Low Resource)' },
          ]}
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
        />
      </form>
    </Dialog>
  )
}
