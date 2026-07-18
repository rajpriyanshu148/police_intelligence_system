import React from 'react'
import { Timeline, TimelineItem, Skeleton, EmptyState } from '@/design-system'
import { useFIRHistory } from './hooks/useFIR'
import { formatDate } from '@/utils/format'

interface FIRHistoryPanelProps {
  caseId: string
}

export const FIRHistoryPanel: React.FC<FIRHistoryPanelProps> = ({ caseId }) => {
  const { data: history, isLoading, isError } = useFIRHistory(caseId)

  if (isLoading) {
    return <Skeleton height="150px" />
  }

  if (isError || !history || history.length === 0) {
    return <EmptyState description="No version or amendment history recorded for this FIR." />
  }

  return (
    <Timeline>
      {history.map((version) => (
        <TimelineItem
          key={version.id}
          title={`Version ${version.version_number}`}
          time={formatDate(version.created_at)}
          description={`Amended acts/sections: ${version.acts_sections || 'none'}. Narrative details truncated to: ${version.details.substring(0, 100)}...`}
        />
      ))}
    </Timeline>
  )
}
