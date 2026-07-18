import React from 'react'
import { Timeline, TimelineItem, Skeleton, EmptyState, Button } from '@/design-system'
import { useEvidenceVersions } from './hooks/useEvidence'
import { formatDate } from '@/utils/format'
import { Download } from 'lucide-react'

interface EvidenceVersionPanelProps {
  caseId: string
  evidenceId: string
  onDownload: (version: number) => void
}

export const EvidenceVersionPanel: React.FC<EvidenceVersionPanelProps> = ({ caseId, evidenceId, onDownload }) => {
  const { data: versions, isLoading, isError } = useEvidenceVersions(caseId, evidenceId)

  if (isLoading) {
    return <Skeleton height="150px" />
  }

  if (isError || !versions || versions.length === 0) {
    return <EmptyState description="No version history records found for this evidence file." />
  }

  return (
    <Timeline>
      {versions.map((ver) => (
        <TimelineItem
          key={ver.id}
          title={`Version ${ver.version_number} — ${ver.file_name}`}
          time={`${formatDate(ver.created_at)}`}
          description={
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--muted-foreground)' }}>
                SHA-256 Checksum: {ver.sha256_hash.substring(0, 16)}... | Size: {(ver.file_size / 1024).toFixed(1)} KB
              </span>
              <div>
                <Button
                  variant="secondary"
                  onClick={() => onDownload(ver.version_number)}
                  style={{ padding: '4px 8px', fontSize: 'var(--text-xs)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                >
                  <Download size={12} /> Download version {ver.version_number}
                </Button>
              </div>
            </div>
          }
        />
      ))}
    </Timeline>
  )
}
