import React, { useState } from 'react'
import { Dialog, Input, TextArea, Select, Button, Progress } from '@/design-system'
import { useUploadEvidence } from './hooks/useEvidence'

interface EvidenceUploadDialogProps {
  isOpen: boolean
  onClose: () => void
  caseId: string
}

export const EvidenceUploadDialog: React.FC<EvidenceUploadDialogProps> = ({ isOpen, onClose, caseId }) => {
  const uploadMutation = useUploadEvidence(caseId)

  // Form states
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('Other')
  const [file, setFile] = useState<File | null>(null)
  
  // Upload status states
  const [step, setStep] = useState<'form' | 'uploading'>('form')
  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  const validate = () => {
    const errs: { [key: string]: string } = {}
    if (!title.trim()) errs.title = 'Title is required.'
    if (!file) errs.file = 'Please choose a file to upload.'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0]
      setFile(selectedFile)
      if (!title) {
        // Pre-fill title with file name without extension
        setTitle(selectedFile.name.substring(0, selectedFile.name.lastIndexOf('.')) || selectedFile.name)
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate() || !file) return

    setStep('uploading')

    try {
      await uploadMutation.mutateAsync({
        file,
        meta: {
          file_name: file.name,
          file_size: file.size,
          mime_type: file.type || 'application/octet-stream',
          category,
          title,
          description: description || undefined,
          captured_at: new Date().toISOString(),
        },
      })
      
      // Reset state and close
      setStep('form')
      setTitle('')
      setDescription('')
      setCategory('Other')
      setFile(null)
      onClose()
    } catch {
      setStep('form') // fallback on error
    }
  }

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={step === 'form' ? 'Upload Case Evidence File' : 'Uploading File...'}
      footer={
        step === 'form' ? (
          <>
            <Button variant="secondary" onClick={onClose} disabled={uploadMutation.isPending}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} loading={uploadMutation.isPending}>
              Upload Evidence
            </Button>
          </>
        ) : null
      }
    >
      {step === 'form' ? (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Input
            id="evidenceTitle"
            label="Evidence Label / Title"
            placeholder="e.g. Crime Scene Photo 1"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            error={errors.title}
          />

          <Select
            id="evidenceCategory"
            label="Evidence Category"
            options={[
              { value: 'Photo', label: 'Photographic Image' },
              { value: 'Video', label: 'Video Footage' },
              { value: 'Audio', label: 'Audio Recording' },
              { value: 'Document', label: 'Documentary Record' },
              { value: 'Other', label: 'Other Exhibit' },
            ]}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />

          <TextArea
            id="evidenceDesc"
            label="Brief description / notes"
            placeholder="Enter metadata details, condition, location found..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label htmlFor="filePicker" style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--muted-foreground)' }}>
              Choose File Exhibit
            </label>
            <input
              id="filePicker"
              type="file"
              onChange={handleFileChange}
              style={{
                padding: '12px',
                border: '1px dashed var(--input-border)',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--muted)',
                cursor: 'pointer',
              }}
            />
            {errors.file && <span style={{ color: 'var(--danger)', fontSize: 'var(--text-xs)' }}>{errors.file}</span>}
          </div>
        </form>
      ) : (
        <div style={{ padding: '24px 0', textAlign: 'center' }}>
          <p style={{ marginBottom: '16px', color: 'var(--muted-foreground)' }}>
            Transmitting file and calculating cryptographic checksums...
          </p>
          <Progress value={85} />
          <div style={{ marginTop: '8px', fontSize: 'var(--text-xs)', color: 'var(--muted-foreground)' }}>
            Uploading: {file?.name} ({(file?.size || 0) / 1024} KB)
          </div>
        </div>
      )}
    </Dialog>
  )
}
