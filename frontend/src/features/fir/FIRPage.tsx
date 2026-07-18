import React, { useState, useEffect } from 'react'
import { Send, Eye, ShieldCheck, CornerUpLeft } from 'lucide-react'
import { PageTransition, Button, Card, Badge, Skeleton, Input, TextArea, Dialog } from '@/design-system'
import { useFIR, useCreateFIR, useUpdateFIR, useSubmitFIR, useReviewFIR } from './hooks/useFIR'
import { FIRHistoryPanel } from './FIRHistoryPanel'
import { useAuth } from '@/hooks/useAuth'
import styles from './FIRPage.module.css'

interface FIRPageProps {
  caseId: string
}

export const FIRPage: React.FC<FIRPageProps> = ({ caseId }) => {
  const { user } = useAuth()
  
  const { data: fir, isLoading, isError } = useFIR(caseId)
  
  const createMutation = useCreateFIR(caseId)
  const updateMutation = useUpdateFIR(caseId)
  const submitMutation = useSubmitFIR(caseId)
  const reviewMutation = useReviewFIR(caseId)

  // Draft form states
  const [complainantName, setComplainantName] = useState('')
  const [complainantContact, setComplainantContact] = useState('')
  const [incidentDate, setIncidentDate] = useState('')
  const [incidentPlace, setIncidentPlace] = useState('')
  const [actsSections, setActsSections] = useState('')
  const [details, setDetails] = useState('')
  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  // Supervisor review state
  const [feedback, setFeedback] = useState('')
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)

  // Set default values when draft is active
  useEffect(() => {
    if (fir) {
      setComplainantName(fir.complainant_name || '')
      setComplainantContact(fir.complainant_contact || '')
      setIncidentDate(fir.incident_date ? fir.incident_date.substring(0, 10) : '')
      setIncidentPlace(fir.incident_place || '')
      setActsSections(fir.acts_sections || '')
      setDetails(fir.details || '')
    }
  }, [fir])

  const validate = () => {
    const errs: { [key: string]: string } = {}
    if (!complainantName.trim()) errs.complainantName = 'Complainant name is required.'
    if (!complainantContact.trim()) errs.complainantContact = 'Contact details are required.'
    if (!incidentDate) errs.incidentDate = 'Incident date is required.'
    if (!incidentPlace.trim()) errs.incidentPlace = 'Incident location place is required.'
    if (!actsSections.trim()) errs.actsSections = 'Applicable Acts/Sections are required.'
    if (!details.trim()) errs.details = 'FIR narrative details are required.'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleCreateDraft = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    try {
      await createMutation.mutateAsync({
        complainant_name: complainantName,
        complainant_contact: complainantContact,
        incident_date: new Date(incidentDate).toISOString(),
        incident_place: incidentPlace,
        acts_sections: actsSections,
        details,
      })
    } catch {}
  }

  const handleSaveDraft = async () => {
    try {
      await updateMutation.mutateAsync({
        acts_sections: actsSections,
        details,
      })
    } catch {}
  }

  const handleSubmitForReview = async () => {
    try {
      await submitMutation.mutateAsync()
    } catch {}
  }

  const handleReviewAction = async (action: 'APPROVE' | 'RETURN' | 'REJECT') => {
    try {
      await reviewMutation.mutateAsync({
        approved: action === 'APPROVE',
        feedback: feedback || undefined,
        action,
      })
      setFeedback('')
    } catch {}
  }

  if (isLoading) {
    return <Skeleton height="250px" />
  }

  // Handle case where FIR doesn't exist (e.g. status code 404)
  const noFirExists = isError || !fir

  if (noFirExists) {
    return (
      <div className={styles.container}>
        <Card title="Register Active Case FIR">
          <p style={{ color: 'var(--muted-foreground)', marginBottom: '24px' }}>
            No FIR narrative details are registered for this case yet. Enter incident details below to register a draft narrative.
          </p>

          <form onSubmit={handleCreateDraft} className={styles.firForm}>
            <div className={styles.detailsGrid}>
              <Input
                id="compName"
                label="Complainant Full Name"
                value={complainantName}
                onChange={(e) => setComplainantName(e.target.value)}
                error={errors.complainantName}
              />
              <Input
                id="compContact"
                label="Complainant Contact details"
                value={complainantContact}
                onChange={(e) => setComplainantContact(e.target.value)}
                error={errors.complainantContact}
              />
              <Input
                id="incDate"
                type="date"
                label="Incident Date"
                value={incidentDate}
                onChange={(e) => setIncidentDate(e.target.value)}
                error={errors.incidentDate}
              />
              <Input
                id="incPlace"
                label="Incident Place / Location"
                value={incidentPlace}
                onChange={(e) => setIncidentPlace(e.target.value)}
                error={errors.incidentPlace}
              />
            </div>
            <Input
              id="actsSections"
              label="Applicable Legal Acts & Sections"
              placeholder="e.g. IPC Section 379 (Theft), IPC Section 34 (Common Intention)"
              value={actsSections}
              onChange={(e) => setActsSections(e.target.value)}
              error={errors.actsSections}
            />
            <TextArea
              id="details"
              label="Incident Description Narrative Details"
              rows={8}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              error={errors.details}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
              <Button type="submit" loading={createMutation.isPending}>
                <Send size={16} style={{ marginRight: '8px' }} /> Save FIR Draft
              </Button>
            </div>
          </form>
        </Card>
      </div>
    )
  }

  const isDraft = fir.status === 'Draft' || fir.status === 'Returned'
  const isSubmitted = fir.status === 'Submitted'
  const isApproved = fir.status === 'Approved'
  const isSupervisor = user && ['ADMIN', 'SUPERVISOR'].includes(user.role)

  let badgeStatus: 'success' | 'warning' | 'danger' | 'info' = 'warning'
  if (isApproved) badgeStatus = 'success'
  if (fir.status === 'Rejected') badgeStatus = 'danger'
  if (isSubmitted) badgeStatus = 'info'

  return (
    <PageTransition className={styles.container}>
      <div className={styles.firHeader}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)' }}>
            FIR Registry: {fir.fir_number || 'DRAFT'}
          </h2>
          <Badge status={badgeStatus}>{fir.status}</Badge>
        </div>
        <Button variant="secondary" onClick={() => setIsHistoryOpen(true)}>
          <Eye size={16} style={{ marginRight: '8px' }} /> Amendment History
        </Button>
      </div>

      {isDraft ? (
        <Card title="Update FIR Draft Details">
          <div className={styles.firForm}>
            <div className={styles.detailsGrid}>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Complainant Name</span>
                <span className={styles.detailValue}>{fir.complainant_name}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Contact details</span>
                <span className={styles.detailValue}>{fir.complainant_contact}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Incident Date</span>
                <span className={styles.detailValue}>{new Date(fir.incident_date).toLocaleDateString()}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Incident Place</span>
                <span className={styles.detailValue}>{fir.incident_place}</span>
              </div>
            </div>

            <Input
              id="actsSections"
              label="Applicable Legal Acts & Sections"
              value={actsSections}
              onChange={(e) => setActsSections(e.target.value)}
            />
            <TextArea
              id="details"
              label="Incident Description Narrative Details"
              rows={8}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
            />
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
              <Button variant="secondary" onClick={handleSaveDraft} loading={updateMutation.isPending}>
                Save Draft
              </Button>
              <Button onClick={handleSubmitForReview} loading={submitMutation.isPending}>
                <Send size={16} style={{ marginRight: '8px' }} /> Submit for Supervisor Review
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        // Read-only Details for Submitted, Approved, or Rejected statuses
        <div className={styles.readOnlyDetails}>
          <div className={styles.detailsGrid}>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Complainant Name</span>
              <span className={styles.detailValue}>{fir.complainant_name}</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Contact details</span>
              <span className={styles.detailValue}>{fir.complainant_contact}</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Incident Date</span>
              <span className={styles.detailValue}>{new Date(fir.incident_date).toLocaleDateString()}</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Incident Place</span>
              <span className={styles.detailValue}>{fir.incident_place}</span>
            </div>
          </div>

          <div className={styles.detailItem} style={{ marginTop: '16px' }}>
            <span className={styles.detailLabel}>Applicable Legal Acts & Sections</span>
            <div style={{ marginTop: '4px' }}>
              <Badge status="info">{fir.acts_sections}</Badge>
            </div>
          </div>

          <div className={styles.detailItem} style={{ marginTop: '16px' }}>
            <span className={styles.detailLabel}>Narrative Description</span>
            <div className={styles.narrativeBox}>{fir.details}</div>
          </div>

          {/* Supervisor Review Operations */}
          {isSubmitted && isSupervisor && (
            <div className={styles.reviewSection}>
              <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--weight-semibold)' }}>
                Supervisor Review Actions
              </h3>
              <TextArea
                id="reviewFeedback"
                label="Review feedback description / notes (required for Reject or Return)"
                placeholder="Explain the changes requested or reasons for rejection..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
              />
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
                <Button variant="danger" onClick={() => handleReviewAction('REJECT')} loading={reviewMutation.isPending}>
                  <CornerUpLeft size={16} style={{ marginRight: '8px' }} /> Reject FIR
                </Button>
                <Button variant="secondary" onClick={() => handleReviewAction('RETURN')} loading={reviewMutation.isPending}>
                  <CornerUpLeft size={16} style={{ marginRight: '8px' }} /> Return for Edit
                </Button>
                <Button onClick={() => handleReviewAction('APPROVE')} loading={reviewMutation.isPending}>
                  <ShieldCheck size={16} style={{ marginRight: '8px' }} /> Approve & File FIR
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* History Dialog */}
      <Dialog
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        title="FIR Amendment & Version Log History"
      >
        <FIRHistoryPanel caseId={caseId} />
      </Dialog>
    </PageTransition>
  )
}
