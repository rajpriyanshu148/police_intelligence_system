import React, { useState } from 'react'
import { Upload, Download, History, Trash2 } from 'lucide-react'
import { PageTransition, Button, Badge, Skeleton, EmptyState, Dialog } from '@/design-system'
import { useEvidenceList, useDownloadEvidence, useDeleteEvidence } from './hooks/useEvidence'
import { EvidenceUploadDialog } from './EvidenceUploadDialog'
import { EvidenceVersionPanel } from './EvidenceVersionPanel'
import { formatDate } from '@/utils/format'
import { useAuth } from '@/hooks/useAuth'
import styles from './EvidencePage.module.css'

interface EvidenceListPageProps {
  caseId: string
}

export const EvidenceListPage: React.FC<EvidenceListPageProps> = ({ caseId }) => {
  const { user } = useAuth()
  
  const { data: evidence, isLoading, isError, refetch } = useEvidenceList(caseId)
  
  const downloadMutation = useDownloadEvidence()
  const deleteMutation = useDeleteEvidence(caseId)

  // Dialog triggers
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [selectedEvidenceId, setSelectedEvidenceId] = useState<string | null>(null)
  const [isVersionsOpen, setIsVersionsOpen] = useState(false)

  const handleDownload = (evidenceId: string, version: number) => {
    downloadMutation.mutate({
      caseId,
      evidenceId,
      version,
      reason: 'Investigation review download',
    })
  }

  const handleDelete = async (evidenceId: string) => {
    if (!window.confirm('Are you sure you want to permanently delete this evidence file from the case?')) return
    try {
      await deleteMutation.mutateAsync(evidenceId)
    } catch {}
  }

  if (isLoading) {
    return (
      <div className={styles.grid}>
        {Array.from({ length: 3 }).map((_, idx) => (
          <Skeleton key={idx} height="180px" borderRadius="var(--radius-lg)" />
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h3 style={{ color: 'var(--danger)', marginBottom: '16px' }}>Failed to Load Evidence Vault</h3>
        <Button onClick={() => refetch()}>Retry Connection</Button>
      </div>
    )
  }

  const isSupervisor = user && ['ADMIN', 'SUPERVISOR'].includes(user.role)

  return (
    <PageTransition className={styles.container}>
      <div className={styles.headerRow}>
        <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)' }}>Case Evidence Vault</h3>
        <Button onClick={() => setIsUploadOpen(true)}>
          <Upload size={16} style={{ marginRight: '8px' }} /> Upload New Evidence
        </Button>
      </div>

      {!evidence || evidence.length === 0 ? (
        <EmptyState
          title="Evidence Vault Empty"
          description="There are no evidence records logged for this case investigation."
          action={
            <Button onClick={() => setIsUploadOpen(true)}>
              Upload First File
            </Button>
          }
        />
      ) : (
        <div className={styles.grid}>
          {evidence.map((item) => (
            <div key={item.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <div>
                  <h4 className={styles.cardTitle}>{item.title}</h4>
                  <span className={styles.cardMeta}>{item.file_name}</span>
                </div>
                <Badge status="info">{item.category}</Badge>
              </div>

              <div className={styles.cardDesc}>
                {item.description || 'No description narrative registered.'}
              </div>

              <div className={styles.cardMeta} style={{ marginTop: 'auto' }}>
                <div>Size: {(item.file_size / 1024).toFixed(1)} KB | Version: {item.current_version_number}</div>
                <div>Uploaded: {formatDate(item.created_at)}</div>
              </div>

              <div className={styles.cardFooter}>
                {isSupervisor && (
                  <Button
                    variant="danger"
                    onClick={() => handleDelete(item.id)}
                    loading={deleteMutation.isPending}
                    style={{ marginRight: 'auto', padding: '6px' }}
                    aria-label="Delete evidence record"
                  >
                    <Trash2 size={14} />
                  </Button>
                )}
                <Button
                  variant="secondary"
                  onClick={() => {
                    setSelectedEvidenceId(item.id)
                    setIsVersionsOpen(true)
                  }}
                  style={{ padding: '6px 12px', fontSize: 'var(--text-xs)' }}
                >
                  <History size={12} style={{ marginRight: '6px' }} /> Version History
                </Button>
                <Button
                  onClick={() => handleDownload(item.id, item.current_version_number)}
                  loading={downloadMutation.isPending}
                  style={{ padding: '6px 12px', fontSize: 'var(--text-xs)' }}
                >
                  <Download size={12} style={{ marginRight: '6px' }} /> Download File
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Dialog */}
      <EvidenceUploadDialog
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        caseId={caseId}
      />

      {/* Version History Dialog */}
      <Dialog
        isOpen={isVersionsOpen}
        onClose={() => setIsVersionsOpen(false)}
        title="Evidence File Version & Audit Log"
      >
        {selectedEvidenceId && (
          <EvidenceVersionPanel
            caseId={caseId}
            evidenceId={selectedEvidenceId}
            onDownload={(v) => handleDownload(selectedEvidenceId, v)}
          />
        )}
      </Dialog>
    </PageTransition>
  )
}
