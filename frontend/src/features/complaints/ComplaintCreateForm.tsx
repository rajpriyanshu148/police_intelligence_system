import React, { useState } from 'react'
import { Dialog, Input, Select, TextArea, Button } from '@/design-system'
import { useCreateComplaint } from './hooks/useComplaints'

interface ComplaintCreateFormProps {
  isOpen: boolean
  onClose: () => void
}

export const ComplaintCreateForm: React.FC<ComplaintCreateFormProps> = ({ isOpen, onClose }) => {
  const createComplaintMutation = useCreateComplaint()
  
  const [citizenName, setCitizenName] = useState('')
  const [citizenContact, setCitizenContact] = useState('')
  const [complaintText, setComplaintText] = useState('')
  const [source, setSource] = useState('Walk-in')
  const [citizenId, setCitizenId] = useState('')
  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  const validate = () => {
    const errs: { [key: string]: string } = {}
    if (!citizenName.trim()) errs.citizenName = 'Citizen name is required.'
    if (!citizenContact.trim()) errs.citizenContact = 'Citizen contact is required.'
    if (!complaintText.trim()) {
      errs.complaintText = 'Complaint narrative text is required.'
    } else if (complaintText.trim().length < 20) {
      errs.complaintText = 'Narrative text must be at least 20 characters.'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    try {
      await createComplaintMutation.mutateAsync({
        citizen_name: citizenName,
        citizen_contact: citizenContact,
        complaint_text: complaintText,
        source,
        citizen_id: citizenId || undefined,
      })
      onClose()
      // Reset form fields
      setCitizenName('')
      setCitizenContact('')
      setComplaintText('')
      setSource('Walk-in')
      setCitizenId('')
    } catch {
      // Handled in mutation error toast
    }
  }

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Log New Citizen Complaint"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={createComplaintMutation.isPending}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={createComplaintMutation.isPending}>
            Log Complaint
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Input
          id="citizenName"
          label="Citizen Full Name"
          placeholder="e.g. John Doe"
          value={citizenName}
          onChange={(e) => setCitizenName(e.target.value)}
          error={errors.citizenName}
        />
        
        <Input
          id="citizenContact"
          label="Contact Number / Email"
          placeholder="e.g. +91 99999 88888 or citizen@email.com"
          value={citizenContact}
          onChange={(e) => setCitizenContact(e.target.value)}
          error={errors.citizenContact}
        />

        <Select
          id="source"
          label="Reporting Source"
          options={[
            { value: 'Walk-in', label: 'Walk-in Station' },
            { value: 'Phone', label: 'Phone Hotline' },
            { value: 'Online', label: 'Online Web Portal' },
            { value: 'Referred', label: 'Referred Department' },
          ]}
          value={source}
          onChange={(e) => setSource(e.target.value)}
        />

        <Input
          id="citizenId"
          label="Citizen Profile ID (Optional)"
          placeholder="Existing Citizen UUID if known"
          value={citizenId}
          onChange={(e) => setCitizenId(e.target.value)}
        />

        <TextArea
          id="complaintText"
          label="Complaint Incident Description Narrative"
          placeholder="Explain the incident fully, including date, time, location, suspect details, and sequence of events..."
          rows={6}
          value={complaintText}
          onChange={(e) => setComplaintText(e.target.value)}
          error={errors.complaintText}
        />
      </form>
    </Dialog>
  )
}
