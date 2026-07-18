import React, { useState } from 'react'
import { Calendar, Scale, ExternalLink } from 'lucide-react'
import { PageTransition, Card, Badge, Button, Input, Table, Select, EmptyState } from '@/design-system'
import { useNavigate } from 'react-router-dom'
import { useToast } from '@/hooks/useToast'

interface CourtCase {
  id: string
  caseNumber: string
  firNumber: string
  title: string
  offense: string
  prosecutor: string
  judgeName: string
  hearingDate: string
  courtRoom: string
  bailStatus: 'Bailable' | 'Non-Bailable' | 'Granted' | 'Denied'
  verdict: 'Pending Trial' | 'Convicted' | 'Acquitted' | 'On Appeal'
  prosecutionStage: string
}

const mockCourtCases: CourtCase[] = [
  {
    id: 'court1',
    caseNumber: 'CASE-2026-0812',
    firNumber: 'FIR-2026-0812',
    title: 'State vs. Rahul Yadav & Ors.',
    offense: 'BNS Sec 304 (Snatching with Hurt)',
    prosecutor: 'Govt. Advocate Rajesh Sharma',
    judgeName: 'Hon\'ble Justice M. K. Gupta',
    hearingDate: '2026-07-24 10:30 AM',
    courtRoom: 'Session Court No. 4, Saket',
    bailStatus: 'Denied',
    verdict: 'Pending Trial',
    prosecutionStage: 'Arguments on Charges'
  },
  {
    id: 'court2',
    caseNumber: 'CASE-2026-0922',
    firNumber: 'FIR-2026-0922',
    title: 'State vs. Vikram Singh',
    offense: 'BNS Sec 318 (Cyber Phishing Theft)',
    prosecutor: 'Advocate Sneha Deshmukh',
    judgeName: 'Hon\'ble Judge Rohini Sen',
    hearingDate: '2026-07-21 02:00 PM',
    courtRoom: 'Fast Track Cyber Court No. 1',
    bailStatus: 'Granted',
    verdict: 'Pending Trial',
    prosecutionStage: 'Evidence Examination'
  },
  {
    id: 'court3',
    caseNumber: 'CASE-2026-0104',
    firNumber: 'FIR-2026-0104',
    title: 'State vs. Sameer Khan',
    offense: 'BNS Sec 103 (Attempted Homicide)',
    prosecutor: 'Govt. Advocate Rajesh Sharma',
    judgeName: 'Hon\'ble Justice M. K. Gupta',
    hearingDate: '2026-07-15 11:15 AM',
    courtRoom: 'Session Court No. 4, Saket',
    bailStatus: 'Denied',
    verdict: 'Convicted',
    prosecutionStage: 'Sentencing Order Passed'
  },
  {
    id: 'court4',
    caseNumber: 'CASE-2026-0442',
    firNumber: 'FIR-2026-0442',
    title: 'State vs. Pritam Roy',
    offense: 'BNS Sec 303 (Home Burglary)',
    prosecutor: 'Advocate Amit Deshpande',
    judgeName: 'Judge K. S. Reddy',
    hearingDate: '2026-08-01 09:30 AM',
    courtRoom: 'Magistrate Court No. 2, Saket',
    bailStatus: 'Bailable',
    verdict: 'On Appeal',
    prosecutionStage: 'Appellate Review'
  }
]

export const CourtPage: React.FC = () => {
  const navigate = useNavigate()
  const { addToast } = useToast()
  
  const [courtList] = useState<CourtCase[]>(mockCourtCases)
  const [searchQuery, setSearchQuery] = useState('')
  const [verdictFilter, setVerdictFilter] = useState('All')

  const handleNotifyTeam = (courtCase: CourtCase) => {
    addToast(`Notifications successfully dispatched to case investigators for ${courtCase.caseNumber}`, 'success')
  }

  const columns = [
    {
      key: 'caseNumber',
      label: 'Case Link',
      render: (row: CourtCase) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <button 
            onClick={() => navigate(`/cases/${row.caseNumber}`)}
            style={{ 
              background: 'none', 
              border: 'none', 
              color: 'var(--primary)', 
              fontWeight: 'var(--weight-bold)', 
              cursor: 'pointer', 
              padding: 0,
              textAlign: 'left',
              display: 'flex',
              alignItems: 'center',
              gap: 4
            }}
          >
            {row.caseNumber} <ExternalLink size={12} />
          </button>
          <span style={{ fontSize: 10, color: 'var(--muted-foreground)' }}>FIR: {row.firNumber}</span>
        </div>
      )
    },
    {
      key: 'title',
      label: 'Trial Title',
      render: (row: CourtCase) => (
        <div>
          <span style={{ fontWeight: 'var(--weight-semibold)' }}>{row.title}</span>
          <span style={{ display: 'block', fontSize: 11, color: 'var(--muted-foreground)' }}>{row.offense}</span>
        </div>
      )
    },
    {
      key: 'hearingDate',
      label: 'Next Hearing',
      render: (row: CourtCase) => (
        <div>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Calendar size={13} color="var(--primary)" />
            {row.hearingDate}
          </span>
          <span style={{ display: 'block', fontSize: 10, color: 'var(--muted-foreground)', marginTop: 2 }}>{row.courtRoom}</span>
        </div>
      )
    },
    {
      key: 'prosecutor',
      label: 'Legal Counsel',
      render: (row: CourtCase) => (
        <div>
          <span style={{ fontSize: 12 }}>Adv: {row.prosecutor}</span>
          <span style={{ display: 'block', fontSize: 10, color: 'var(--muted-foreground)', marginTop: 2 }}>Judge: {row.judgeName}</span>
        </div>
      )
    },
    {
      key: 'bailStatus',
      label: 'Bail',
      render: (row: CourtCase) => {
        let statusColor: 'success' | 'warning' | 'danger' | 'info' = 'warning'
        if (row.bailStatus === 'Granted') statusColor = 'success'
        if (row.bailStatus === 'Denied') statusColor = 'danger'
        return <Badge status={statusColor}>{row.bailStatus.toUpperCase()}</Badge>
      }
    },
    {
      key: 'verdict',
      label: 'Verdict / Stage',
      render: (row: CourtCase) => (
        <div>
          <Badge status={
            row.verdict === 'Convicted' ? 'danger' : 
            row.verdict === 'Acquitted' ? 'success' : 
            row.verdict === 'On Appeal' ? 'warning' : 'info'
          }>
            {row.verdict.toUpperCase()}
          </Badge>
          <span style={{ display: 'block', fontSize: 10, color: 'var(--muted-foreground)', marginTop: 4 }}>{row.prosecutionStage}</span>
        </div>
      )
    },
    {
      key: 'actions',
      label: 'Governance Alerts',
      render: (row: CourtCase) => (
        <Button variant="secondary" onClick={() => handleNotifyTeam(row)} style={{ padding: '6px 12px', fontSize: 11 }}>
          Notify Squad
        </Button>
      )
    }
  ]

  const filteredCases = courtList.filter(c => {
    const matchesQuery = c.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         c.caseNumber.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         c.offense.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesVerdict = verdictFilter === 'All' || c.verdict === verdictFilter
    return matchesQuery && matchesVerdict
  })

  return (
    <PageTransition>
      <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', marginBottom: 4 }}>Court & Prosecution Console</h1>
            <p style={{ color: 'var(--muted-foreground)', fontSize: 'var(--text-sm)' }}>Track schedules, prosecutors, bail status, and trial stage verifications</p>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <Scale size={28} color="var(--primary)" />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24 }}>
          
          {/* Filters */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 260 }}>
              <Input 
                id="courtSearch"
                placeholder="Search court cases by accused name, case number, or offense section..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ marginBottom: 0 }}
              />
            </div>
            <div style={{ minWidth: 180 }}>
              <Select 
                id="courtVerdict"
                options={[
                  { value: 'All', label: 'All Verdict Statuses' },
                  { value: 'Pending Trial', label: 'Pending Trial Stage' },
                  { value: 'Convicted', label: 'Conviction Orders' },
                  { value: 'Acquitted', label: 'Acquittal Judgments' },
                  { value: 'On Appeal', label: 'Appellate Toggles' }
                ]}
                value={verdictFilter}
                onChange={(e) => setVerdictFilter(e.target.value)}
              />
            </div>
          </div>

          {/* Schedule Listing Table */}
          <Card title="Prosecution Trial & Bail Hearings Ledger">
            {filteredCases.length === 0 ? (
              <EmptyState description="No prosecution logs matching the search queries." />
            ) : (
              <Table columns={columns} data={filteredCases} keyField="id" />
            )}
          </Card>

        </div>
      </div>
    </PageTransition>
  )
}
export default CourtPage
