import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  ChevronLeft, UserPlus, Clock, CheckCircle, 
  File, Sparkles, Scale, Network, HelpCircle, 
  Calendar, CheckSquare, ShieldAlert, FileText, 
  Send, AlertTriangle, Activity, RefreshCw
} from 'lucide-react'
import { 
  PageTransition, Button, Card, Badge, Skeleton, Tabs, Timeline, 
  TimelineItem, Dialog, Input, TextArea, Select, EmptyState 
} from '@/design-system'
import { useCase, useCaseTimeline, useTransitionCase, useAssignCase, useAddTimelineEvent } from './hooks/useCases'
import { useOfficersList } from '../officers/hooks/useOfficers'
import { FIRPage } from '../fir/FIRPage'
import { EvidenceListPage } from '../evidence/EvidenceListPage'
import { formatDate } from '@/utils/format'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import styles from './CasesPage.module.css'

interface Comment {
  id: string
  officer: string
  role: string
  text: string
  date: string
}

interface DecisionAlert {
  id: string
  type: 'match' | 'conflict' | 'missing' | 'warning'
  title: string
  description: string
  confidence: number
  severity: 'high' | 'medium' | 'low'
}

const mockVictims = [
  { id: 'v1', name: 'Amit Kumar', gender: 'Male', dob: '1992-04-12', phone: '+91 98888 77777', email: 'amit.kumar@gmail.com', statement: 'I was returning from work when a white SUV blocked my path. Two men with iron rods got out and demanded my laptop bag. When I resisted, they assaulted me.', status: 'Verified' },
]

const mockSuspects = [
  { id: 's1', name: 'Rahul Yadav', alias: 'Sheru', height: '5\'10"', weight: '78kg', vehicle: 'White SUV (DL-3C-AS-8812)', phone: '+91 99999 11111', address: 'Village Badarpur, Delhi', status: 'In Custody', description: 'Scars on left forearm, tiger tattoo on right shoulder.' },
  { id: 's2', name: 'Unknown Suspect 2', alias: 'N/A', height: '5\'8"', weight: 'Unknown', vehicle: 'N/A', phone: 'Unknown', address: 'Unknown', status: 'Absconding', description: 'Wore a black leather jacket and a baseball cap.' }
]

const mockWitnesses = [
  { id: 'w1', name: 'Sanjay Dutt', gender: 'Male', phone: '+91 97777 66666', statement: 'I heard shouting near my shop and ran outside. I saw two men hitting a citizen. I shouted for help and noted the last 4 digits of the SUV: 8812.', reliability: 'High' },
  { id: 'w2', name: 'Priya Patel', gender: 'Female', phone: '+91 96666 55555', statement: 'I was standing on my balcony. It was dark, but I saw a struggle and a white SUV speeding away. I could not clearly identify the faces.', reliability: 'Medium' }
]

const mockDocuments = [
  { id: 'd1', title: 'Medical Examination Report', type: 'Medical Report', date: '2026-07-16', author: 'Dr. S. K. Sen (RML Hospital)', status: 'Signed', size: '2.4 MB' },
  { id: 'd2', title: 'Search Warrant - Badarpur Residence', type: 'Search Warrant', date: '2026-07-16', author: 'Magistrate Court 4', status: 'Approved', size: '1.1 MB' },
  { id: 'd3', title: 'Arrest Warrant - Rahul Yadav', type: 'Arrest Warrant', date: '2026-07-17', author: 'Magistrate Court 4', status: 'Executed', size: '1.2 MB' }
]

const mockCourtData = {
  case_number: 'CR-2026-00912',
  jurisdiction: 'District Court Delhi',
  judge: 'Hon\'ble Justice D. Y. Chandrachud',
  prosecutor: 'Adv. Abhishek Singh',
  defense_counsel: 'Adv. Harish Salve',
  hearings: [
    { date: '2026-07-28 10:30 AM', type: 'First Appearance & Bail Hearing', status: 'Scheduled', room: 'Courtroom No. 4' },
    { date: '2026-08-14 10:30 AM', type: 'Chargesheet Review', status: 'Scheduled', room: 'Courtroom No. 4' }
  ],
  verdict: 'Pending Trial Decision',
  appeals: 'N/A'
}

export const CaseDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { addToast } = useToast()
  
  const [activeTab, setActiveTab] = useState('overview')
  const [isAssignOpen, setIsAssignOpen] = useState(false)
  const [isStatusOpen, setIsStatusOpen] = useState(false)
  const [isEventOpen, setIsEventOpen] = useState(false)

  // Sub-dialog states
  const [selectedOfficer, setSelectedOfficer] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [eventTitle, setEventTitle] = useState('')
  const [eventTime, setEventTime] = useState(new Date().toISOString().substring(0, 16))
  const [eventDesc, setEventDesc] = useState('')

  // Task list local state
  const [tasks, setTasks] = useState([
    { id: 't1', title: 'Conduct spot verification and sketch map', done: true, assignee: 'Inspector Sharma' },
    { id: 't2', title: 'Verify Aadhaar ID of complainant Amit Kumar', done: true, assignee: 'Constable Verma' },
    { id: 't3', title: 'Request CCTV footage from Sector 18 traffic junction', done: false, assignee: 'Cyber Cell Lead' },
    { id: 't4', title: 'Send recovered iron rod weapon to forensics lab', done: false, assignee: 'Investigator Priyanshu' },
    { id: 't5', title: 'Draft chargesheet under BNS Section 304', done: false, assignee: 'Investigator Priyanshu' }
  ])

  const toggleTask = (taskId: string) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, done: !t.done } : t))
    addToast('Task checklist updated.', 'info')
  }

  // Active AI Decision Support alerts
  const [decisionAlerts, setDecisionAlerts] = useState<DecisionAlert[]>([
    {
      id: 'd_alt1',
      type: 'match',
      title: 'Linked Case Correlation Detected',
      description: 'Vehicle plate DL-3C-AS-8812 matches an absconding suspect from Cyber Fraud Case #CASE-2026-0941.',
      confidence: 94,
      severity: 'high'
    },
    {
      id: 'd_alt2',
      type: 'conflict',
      title: 'Witness Statement Inconsistency',
      description: 'Witness Priya Patel states the road was in absolute darkness, conflicting with Sanjay Dutt who claims to have read license plates clearly.',
      confidence: 88,
      severity: 'medium'
    },
    {
      id: 'd_alt3',
      type: 'missing',
      title: 'Critical Medical Record Omission',
      description: 'RML Hospital trauma sheets show emergency victim injuries, but final forensic fitness certificate is missing from files.',
      confidence: 95,
      severity: 'high'
    }
  ])

  const handleDecisionAction = (alertId: string, action: 'accept' | 'reject') => {
    setDecisionAlerts(prev => prev.filter(a => a.id !== alertId))
    addToast(action === 'accept' ? 'AI Recommendation successfully logged to case file.' : 'AI Recommendation dismissed.', action === 'accept' ? 'success' : 'info')
  }

  // Comments state
  const [comments, setComments] = useState<Comment[]>([
    { id: 'c1', officer: 'Constable Verma', role: 'Field Officer', text: 'Aadhaar ID and medical logs of Amit Kumar verified in person. Uploaded PDF file to custody directory.', date: '2026-07-17 10:12 AM' },
    { id: 'c2', officer: 'Cyber Cell Lead', role: 'Technical Officer', text: 'CCTV video from Sector 18 traffic junction successfully parsed. Vehicle DL-3C-AS-8812 is mapped. Bounding markers are saved.', date: '2026-07-17 01:14 PM' },
    { id: 'c3', officer: 'Inspector Sharma', role: 'Station Supervisor', text: 'Priyanshu, please check why forensic weapon fingerprints match results are taking this long. Complete it by Friday.', date: '2026-07-17 04:30 PM' }
  ])
  const [newCommentText, setNewCommentText] = useState('')

  const handlePostComment = () => {
    if (!newCommentText.trim()) return
    const nowStr = new Date().toISOString().substring(0, 16).replace('T', ' ')
    const commentObj: Comment = {
      id: `comm_${comments.length + 1}`,
      officer: user?.username || 'Investigator Priyanshu',
      role: user?.role || 'INVESTIGATOR',
      text: newCommentText.trim(),
      date: nowStr
    }
    setComments(prev => [...prev, commentObj])
    setNewCommentText('')
    addToast('Internal case comment posted.', 'success')
  }

  // AI Copilot context logs
  const [copilotQuery, setCopilotQuery] = useState('')
  const [copilotChat, setCopilotChat] = useState<Array<{ role: 'user' | 'assistant', text: string }>>([
    { role: 'assistant', text: 'Investigation Copilot active. I have reviewed Amit Kumar\'s complaint, forensic reports, and linked vehicle registrations. How can I assist you with legal sections, contradictions, or chargesheets?' }
  ])
  const [isAIProcessing, setIsAIProcessing] = useState(false)

  // Interactive Graph state
  const [selectedGraphNode, setSelectedGraphNode] = useState<string | null>('Case Node')

  // React Query hooks
  const { data: caseData, isLoading, isError, refetch } = useCase(id || '')
  const { data: timelineData, isLoading: isTimelineLoading } = useCaseTimeline(id || '')
  const { data: officersData } = useOfficersList({ role: 'INVESTIGATOR', page_size: 100 })
  
  const transitionMutation = useTransitionCase(id || '')
  const assignMutation = useAssignCase(id || '')
  const addEventMutation = useAddTimelineEvent(id || '')

  if (isLoading || !caseData) {
    return (
      <div className={styles.container}>
        <Skeleton width="120px" height="24px" />
        <Skeleton height="150px" className="mt-4" />
      </div>
    )
  }

  if (isError) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h3 style={{ color: 'var(--danger)', marginBottom: '16px' }}>Failed to Load Case Profile</h3>
        <Button onClick={() => refetch()}>Retry Connection</Button>
      </div>
    )
  }

  const handleAssignSubmit = async () => {
    if (!selectedOfficer) return
    try {
      await assignMutation.mutateAsync(selectedOfficer)
      setIsAssignOpen(false)
    } catch {}
  }

  const handleStatusSubmit = async () => {
    if (!selectedStatus) return
    try {
      await transitionMutation.mutateAsync(selectedStatus)
      setIsStatusOpen(false)
    } catch {}
  }

  const handleEventSubmit = async () => {
    if (!eventTitle.trim()) return
    try {
      await addEventMutation.mutateAsync({
        title: eventTitle,
        event_time: new Date(eventTime).toISOString(),
        description: eventDesc || undefined,
      })
      setIsEventOpen(false)
      setEventTitle('')
      setEventDesc('')
    } catch {}
  }

  const handleSendCopilot = () => {
    if (!copilotQuery.trim()) return
    const userMsg = copilotQuery.trim()
    executeCopilotResponse(userMsg)
  }

  const executeCopilotResponse = (query: string) => {
    setCopilotChat(prev => [...prev, { role: 'user', text: query }])
    setCopilotQuery('')
    setIsAIProcessing(true)

    // Simulate AI response
    setTimeout(() => {
      let reply = 'I have processed your query. Let me analyze the current file index.'
      const lower = query.toLowerCase()
      if (lower.includes('plan') || lower.includes('investigation plan')) {
        reply = `### AI Investigation Plan Outline (CASE-2026-0812)
1. **Source Evidence Check**: Extract background check logs for vehicle DL-3C-AS-8812.
2. **Biometric Audit**: Cross-reference recovered iron rod fingerprints in Crime Records database.
3. **Witness Confrontation**: Conduct a follow-up interview with Priya Patel regarding roadway streetlights.
4. **BNS Charging**: Frame draft charge under Section 304 (Snatching/Assault).`
      } else if (lower.includes('contradiction') || lower.includes('conflicting')) {
        reply = `### AI Testimony Contradiction Report:
* **Conflict Detected**: Witness Priya Patel states the incident took place in 'pitch darkness' with zero facial visibility.
* **Counter-Claim**: Witness Sanjay Dutt claims he read the license plate DL-3C-AS-8812 clearly from 40 feet.
* **Suggested Action**: Send a field constable to verify the street light grid operation times at the Sector 18 crossroads on the night of July 16th.`
      } else if (lower.includes('chargesheet') || lower.includes('charge sheet') || lower.includes('fir')) {
        reply = `### Draft BNS Chargesheet Summary:
* **Proposed Charge**: BNS Section 304 (Snatching with force and bodily harm).
* **Accused**: Rahul Yadav (In Custody).
* **Supporting Vector**: Fingerprints verified on weapon (Iron rod) + CCTV camera logs matching license plate.
* **Filing Status**: Ready for digital signature inside the FIR Workspace.`
      } else if (lower.includes('missing') || lower.includes('completeness')) {
        reply = `### AI Evidence Completeness Audit (Current: 72% Complete):
1. **Missing Document**: Medical fitness certificate/trauma report signed by Forensics doctor.
2. **Missing Statement**: Cross-statement from the registered owner of the white SUV (Rahul Yadav's father).
3. **Action Recommendation**: Issue notice under BNS Section 35(1) to SUV owner.`
      } else if (lower.includes('court') || lower.includes('prosecution')) {
        reply = `### Prosecution Readiness Brief:
* **Case Strength**: HIGH. Supported by direct eye-witness, matching forensic weapon prints, and CCTV logs.
* **Defense Counter-Risk**: Defense counsel Adv. Harish Salve will likely challenge the visual identification due to darkness.
* **Prosecution Advice**: Secure the street illumination logs from civic authorities to prove active streetlights.`
      }
      setCopilotChat(prev => [...prev, { role: 'assistant', text: reply }])
      setIsAIProcessing(false)
    }, 1200)
  }

  const isSupervisor = user && ['ADMIN', 'SUPERVISOR'].includes(user.role)

  return (
    <PageTransition className={styles.container}>
      <div>
        <Button variant="secondary" onClick={() => navigate('/cases')} style={{ marginBottom: '16px' }}>
          <ChevronLeft size={16} style={{ marginRight: '8px' }} /> Back to Workspace Registry
        </Button>
        <div className={styles.detailHeader}>
          <div>
            <h1 className={styles.title}>{caseData.case_number} — {caseData.title}</h1>
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--muted-foreground)' }}>
              Source Complaint ID: {caseData.complaint_id}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <Badge status={caseData.status === 'Closed' ? 'success' : caseData.status === 'Cold Case' ? 'danger' : 'warning'}>
              {caseData.status}
            </Badge>
            <Badge status="danger">Case Health Score: 80%</Badge>
          </div>
        </div>
      </div>

      {/* Meta Properties Grid */}
      <div className={styles.metaGrid}>
        <div className={styles.metaCard}>
          <span className={styles.metaLabel}>Category</span>
          <span className={styles.metaValue}>{caseData.category}</span>
        </div>
        <div className={styles.metaCard}>
          <span className={styles.metaLabel}>Severity Rating</span>
          <span className={styles.metaValue}>{caseData.severity}</span>
        </div>
        <div className={styles.metaCard}>
          <span className={styles.metaLabel}>Response Priority</span>
          <span className={styles.metaValue}>{caseData.priority}</span>
        </div>
        <div className={styles.metaCard}>
          <span className={styles.metaLabel}>Lead Investigator</span>
          <span className={styles.metaValue}>{caseData.assigned_officer_id || 'Unassigned'}</span>
        </div>
      </div>

      {/* Primary Tab Navigation */}
      <Tabs
        activeTab={activeTab}
        onChange={setActiveTab}
        tabs={[
          { value: 'overview', label: 'Overview' },
          { value: 'victims', label: 'Victims' },
          { value: 'suspects', label: 'Suspects' },
          { value: 'witnesses', label: 'Witnesses' },
          { value: 'evidence', label: 'Evidence' },
          { value: 'timeline', label: 'Timeline' },
          { value: 'documents', label: 'Documents' },
          { value: 'notes', label: 'Officer Notes' },
          { value: 'tasks', label: 'Tasks' },
          { value: 'activity', label: 'Activity' },
          { value: 'audit', label: 'Audit Trail' },
          { value: 'court', label: 'Court' },
          { value: 'legal', label: 'Legal Sections' },
          { value: 'ai', label: 'AI Copilot' },
          { value: 'relationships', label: 'Relationships' },
        ]}
      >
        <div className={styles.tabContent}>
          {/* OVERVIEW */}
          {activeTab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* AI Proactive Decision Support Alerts */}
              {decisionAlerts.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 6, color: 'var(--primary)' }}>
                    <ShieldAlert size={16} /> Proactive AI Decision Support Warnings
                  </h3>
                  <div className={styles.decisionSupportContainer}>
                    {decisionAlerts.map(alert => (
                      <div 
                        key={alert.id} 
                        className={`${styles.decisionCard} ${
                          alert.type === 'missing' ? styles.decisionCardWarning : 
                          alert.type === 'conflict' ? styles.decisionCardWarning : ''
                        }`}
                      >
                        <div className={styles.decisionCardContent}>
                          <AlertTriangle size={18} color={alert.severity === 'high' ? '#ef4444' : '#f59e0b'} style={{ flexShrink: 0, marginTop: 2 }} />
                          <div>
                            <strong>{alert.title} ({alert.confidence}% Confidence Index)</strong>
                            <p style={{ margin: '4px 0 0 0', color: 'var(--muted-foreground)' }}>{alert.description}</p>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <Button 
                            variant="secondary" 
                            style={{ padding: '4px 10px', fontSize: 11, borderColor: 'rgba(239, 68, 68, 0.4)', color: '#ef4444', background: 'none' }}
                            onClick={() => handleDecisionAction(alert.id, 'reject')}
                          >
                            Dismiss
                          </Button>
                          <Button 
                            style={{ padding: '4px 10px', fontSize: 11 }}
                            onClick={() => handleDecisionAction(alert.id, 'accept')}
                          >
                            Log Resolution
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Case Operational Status & Health Dashboard */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                <Card title="Case Integrity & Health Indices">
                  <div className={styles.healthGrid}>
                    <div className={styles.healthCard}>
                      <span style={{ fontSize: 9, color: 'var(--muted-foreground)' }}>Evidence Integrity</span>
                      <span className={styles.healthValue}>85%</span>
                    </div>
                    <div className={styles.healthCard}>
                      <span style={{ fontSize: 9, color: 'var(--muted-foreground)' }}>Witness Coverage</span>
                      <span className={styles.healthValue}>50%</span>
                    </div>
                    <div className={styles.healthCard}>
                      <span style={{ fontSize: 9, color: 'var(--muted-foreground)' }}>Legal Section Review</span>
                      <span className={styles.healthValue}>94%</span>
                    </div>
                    <div className={styles.healthCard}>
                      <span style={{ fontSize: 9, color: 'var(--muted-foreground)' }}>Court Readiness</span>
                      <span className={styles.healthValue} style={{ color: '#f59e0b' }}>Medium</span>
                    </div>
                  </div>
                </Card>

                <Card title="Workflow Completion Profile">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)' }}>
                      <span>Overall Workspace Progress</span>
                      <strong>72% Completed</strong>
                    </div>
                    <div style={{ height: '8px', backgroundColor: 'var(--muted)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: '72%', height: '100%', backgroundColor: 'var(--primary)' }} />
                    </div>
                    <span style={{ fontSize: '10px', color: 'var(--muted-foreground)' }}>
                      ✓ Aadhaar IDs Verified | ✓ Scene photos logged | ✗ Pending Forensic DNA certificates.
                    </span>
                  </div>
                </Card>
              </div>

              {/* Action and detail row */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
                <Card title="Operational Case Brief">
                  <p style={{ color: 'var(--muted-foreground)', marginBottom: '16px', lineHeight: 1.6, fontSize: 13 }}>
                    This case is registered as an active assault and robbery incident at the Sector 18 cross junction. 
                    The prime suspect is currently detained under judicial custody in Tihar jail pending formal chargesheet signature review. 
                    All investigation notes, evidence chains, and BNS legal sections can be updated using the tabs above.
                  </p>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    {isSupervisor && (
                      <Button variant="secondary" onClick={() => setIsAssignOpen(true)}>
                        <UserPlus size={16} style={{ marginRight: '8px' }} /> Assign Lead Officer
                      </Button>
                    )}
                    <Button variant="secondary" onClick={() => setIsStatusOpen(true)}>
                      <CheckCircle size={16} style={{ marginRight: '8px' }} /> Transition Case Stage
                    </Button>
                  </div>
                </Card>

                <Card title="Assigned Department Details">
                  <div style={{ fontSize: 'var(--text-sm)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div><strong>Department:</strong> Crime Investigation Division (CID)</div>
                    <div><strong>Section:</strong> Homicide & Robbery Squad</div>
                    <div><strong>SOP Protocol:</strong> Snatching Assault SOP v1.4</div>
                  </div>
                </Card>
              </div>

            </div>
          )}

          {/* VICTIMS */}
          {activeTab === 'victims' && (
            <div className={styles.cockpitGrid}>
              {mockVictims.map((v) => (
                <div key={v.id} className={styles.cockpitCard}>
                  <div className={styles.cockpitCardHeader}>
                    <span style={{ fontWeight: 'var(--weight-bold)' }}>{v.name} ({v.gender}, {v.dob})</span>
                    <Badge status="success">{v.status}</Badge>
                  </div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted-foreground)' }}>
                    <div><strong>Phone:</strong> {v.phone}</div>
                    <div style={{ marginTop: '4px' }}><strong>Email:</strong> {v.email}</div>
                    <div style={{ marginTop: '8px', borderTop: '1px dashed var(--card-border)', paddingTop: '8px', color: 'var(--foreground)' }}>
                      <strong>Assault Statement:</strong> "{v.statement}"
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* SUSPECTS */}
          {activeTab === 'suspects' && (
            <div className={styles.cockpitGrid}>
              {mockSuspects.map((s) => (
                <div key={s.id} className={styles.cockpitCard}>
                  <div className={styles.cockpitCardHeader}>
                    <span style={{ fontWeight: 'var(--weight-bold)' }}>{s.name} {s.alias !== 'N/A' && `(Alias: ${s.alias})`}</span>
                    <Badge status={s.status === 'In Custody' ? 'success' : 'danger'}>{s.status}</Badge>
                  </div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted-foreground)' }}>
                    <div><strong>Height:</strong> {s.height} | <strong>Weight:</strong> {s.weight}</div>
                    <div style={{ marginTop: '4px' }}><strong>Vehicle:</strong> {s.vehicle}</div>
                    <div style={{ marginTop: '4px' }}><strong>Address:</strong> {s.address}</div>
                    <div style={{ marginTop: '8px', borderTop: '1px dashed var(--card-border)', paddingTop: '8px', color: 'var(--foreground)' }}>
                      <strong>Dossier Description:</strong> {s.description}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* WITNESSES */}
          {activeTab === 'witnesses' && (
            <div className={styles.cockpitGrid}>
              {mockWitnesses.map((w) => (
                <div key={w.id} className={styles.cockpitCard}>
                  <div className={styles.cockpitCardHeader}>
                    <span style={{ fontWeight: 'var(--weight-bold)' }}>{w.name} ({w.gender})</span>
                    <Badge status={w.reliability === 'High' ? 'success' : 'warning'}>{w.reliability} Reliability</Badge>
                  </div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted-foreground)' }}>
                    <div><strong>Phone:</strong> {w.phone}</div>
                    <div style={{ marginTop: '8px', borderTop: '1px dashed var(--card-border)', paddingTop: '8px', color: 'var(--foreground)' }}>
                      <strong>Witness Testimony:</strong> "{w.statement}"
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* EVIDENCE */}
          {activeTab === 'evidence' && <EvidenceListPage caseId={caseData.id} />}

          {/* TIMELINE */}
          {activeTab === 'timeline' && (
            <div className={styles.timelineSection}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)' }}>Investigation Chronology</h3>
                <Button onClick={() => setIsEventOpen(true)}>
                  <Clock size={16} style={{ marginRight: '8px' }} /> Log Incident Event
                </Button>
              </div>

              {isTimelineLoading ? (
                <Skeleton height="150px" />
              ) : !timelineData || timelineData.length === 0 ? (
                <EmptyState description="No timeline events logged for this case investigation yet." />
              ) : (
                <Timeline>
                  {timelineData.map((evt) => (
                    <TimelineItem
                      key={evt.id}
                      title={evt.title}
                      time={`${formatDate(evt.event_time)} (${evt.actor_role})`}
                      description={evt.description}
                    />
                  ))}
                </Timeline>
              )}
            </div>
          )}

          {/* DOCUMENTS */}
          {activeTab === 'documents' && (
            <div className={styles.cockpitGrid}>
              {mockDocuments.map((doc) => (
                <div key={doc.id} className={styles.cockpitCard}>
                  <div className={styles.cockpitCardHeader}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <File size={16} />
                      <span style={{ fontWeight: 'var(--weight-bold)' }}>{doc.title}</span>
                    </div>
                    <Badge status="info">{doc.status}</Badge>
                  </div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted-foreground)' }}>
                    <div><strong>Type:</strong> {doc.type}</div>
                    <div style={{ marginTop: '4px' }}><strong>Date:</strong> {doc.date}</div>
                    <div style={{ marginTop: '4px' }}><strong>Issued By:</strong> {doc.author}</div>
                    <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed var(--card-border)', paddingTop: '8px' }}>
                      <span>Size: {doc.size}</span>
                      <span style={{ color: 'var(--primary)', cursor: 'pointer', fontWeight: 'var(--weight-bold)' }}>Download PDF</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* NOTES & COLLABORATION COMMENTS */}
          {activeTab === 'notes' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }}>
              
              {/* Note Editor */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <TextArea
                  id="notesEditor"
                  label="Investigator Notebook Logs"
                  placeholder="Write operational logs, interview notes, or leads here..."
                  rows={8}
                  defaultValue={`# Investigation Notes - Robbery case Sector 18\n* Date: 2026-07-17\n* Investigator: Investigator Priyanshu\n* Status: suspect Rahul Yadav interrogating under progress`}
                />
                <div style={{ display: 'flex', gap: '12px', alignSelf: 'flex-end' }}>
                  <Button variant="secondary">
                    <Sparkles size={14} style={{ marginRight: '8px' }} /> AI Summarize
                  </Button>
                  <Button onClick={() => addToast('Incident notes saved successfully.', 'success')}>Save Notes</Button>
                </div>
              </div>

              {/* Discussion Comment Threads */}
              <Card title="Shared Collaboration Thread">
                <div className={styles.commentThread}>
                  <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10, paddingRight: 6 }}>
                    {comments.map(c => (
                      <div key={c.id} className={styles.commentItem}>
                        <div className={styles.commentHeader}>
                          <span>{c.officer} ({c.role})</span>
                          <span style={{ fontSize: 9, fontWeight: 'normal', color: 'var(--muted-foreground)' }}>{c.date}</span>
                        </div>
                        <p style={{ margin: 0 }}>{c.text}</p>
                      </div>
                    ))}
                  </div>

                  <div style={{ borderTop: '1px solid var(--card-border)', paddingTop: 10, marginTop: 6 }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <Input 
                        id="commentBox"
                        placeholder="Type comment or mention officer (@name)…"
                        value={newCommentText}
                        onChange={(e) => setNewCommentText(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') handlePostComment() }}
                        style={{ flex: 1 }}
                      />
                      <Button onClick={handlePostComment} style={{ padding: '0 12px' }}>
                        <Send size={14} />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>

            </div>
          )}

          {/* TASKS */}
          {activeTab === 'tasks' && (
            <Card title="Assigned Tasks Checklist" style={{ maxWidth: '600px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {tasks.map((task) => (
                  <div 
                    key={task.id} 
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '12px', 
                      padding: '10px 14px', 
                      border: '1px solid var(--card-border)', 
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--muted)',
                      cursor: 'pointer'
                    }}
                    onClick={() => toggleTask(task.id)}
                  >
                    <CheckSquare size={18} color={task.done ? 'var(--success)' : 'var(--muted-foreground)'} />
                    <div style={{ flex: 1 }}>
                      <span style={{ textDecoration: task.done ? 'line-through' : 'none', color: task.done ? 'var(--muted-foreground)' : 'var(--foreground)', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)' }}>
                        {task.title}
                      </span>
                      <div style={{ fontSize: 'var(--text-xxs)', color: 'var(--muted-foreground)', marginTop: '2px' }}>
                        Assignee: {task.assignee}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* ACTIVITY FEED */}
          {activeTab === 'activity' && (
            <Card title="Live Case Operations Log" style={{ maxWidth: '700px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ fontSize: 'var(--text-xs)', padding: '8px 12px', borderLeft: '3px solid var(--primary)', backgroundColor: 'var(--muted)' }}>
                  <div><strong>Evidence Uploaded:</strong> Iron Rod (Recovered Weapon) attached to records database.</div>
                  <div style={{ color: 'var(--muted-foreground)', marginTop: '4px' }}>By Investigator Priyanshu | 2026-07-17 02:40 PM</div>
                </div>
                <div style={{ fontSize: 'var(--text-xs)', padding: '8px 12px', borderLeft: '3px solid var(--success)', backgroundColor: 'var(--muted)' }}>
                  <div><strong>Suspect Status Update:</strong> Rahul Yadav marked as 'In Custody'.</div>
                  <div style={{ color: 'var(--muted-foreground)', marginTop: '4px' }}>By Supervisor Officer | 2026-07-17 11:20 AM</div>
                </div>
                <div style={{ fontSize: 'var(--text-xs)', padding: '8px 12px', borderLeft: '3px solid var(--warning)', backgroundColor: 'var(--muted)' }}>
                  <div><strong>Complaint Registered:</strong> Citizen Complaint logged under Category: Robbery.</div>
                  <div style={{ color: 'var(--muted-foreground)', marginTop: '4px' }}>By Constable Verma | 2026-07-16 11:54 PM</div>
                </div>
              </div>
            </Card>
          )}

          {/* AUDIT TRAIL */}
          {activeTab === 'audit' && (
            <Card title="Sensitive Data Access Audit Ledger">
              <table style={{ width: '100%', fontSize: 'var(--text-xs)', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--card-border)', textAlign: 'left' }}>
                    <th style={{ padding: '12px' }}>Officer</th>
                    <th style={{ padding: '12px' }}>Access Event</th>
                    <th style={{ padding: '12px' }}>IP Address</th>
                    <th style={{ padding: '12px' }}>Timestamp</th>
                    <th style={{ padding: '12px' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid var(--card-border)' }}>
                    <td style={{ padding: '12px' }}>Investigator Priyanshu</td>
                    <td style={{ padding: '12px' }}>Modified Suspect Dossier (Rahul Yadav)</td>
                    <td style={{ padding: '12px' }}>192.168.1.104</td>
                    <td style={{ padding: '12px' }}>2026-07-17 15:35:51</td>
                    <td style={{ padding: '12px' }}><Badge status="success">COMPLIANT</Badge></td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--card-border)' }}>
                    <td style={{ padding: '12px' }}>Constable Verma</td>
                    <td style={{ padding: '12px' }}>Viewed Victim Address details</td>
                    <td style={{ padding: '12px' }}>192.168.1.112</td>
                    <td style={{ padding: '12px' }}>2026-07-17 14:02:10</td>
                    <td style={{ padding: '12px' }}><Badge status="success">COMPLIANT</Badge></td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--card-border)' }}>
                    <td style={{ padding: '12px' }}>Unknown Agent</td>
                    <td style={{ padding: '12px' }}>Attempted access without credentials</td>
                    <td style={{ padding: '12px' }}>103.4.12.89</td>
                    <td style={{ padding: '12px' }}>2026-07-17 08:12:00</td>
                    <td style={{ padding: '12px' }}><Badge status="danger">DENIED</Badge></td>
                  </tr>
                </tbody>
              </table>
            </Card>
          )}

          {/* COURT */}
          {activeTab === 'court' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              <Card title="Prosecution Overview">
                <div style={{ fontSize: 'var(--text-sm)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div><strong>Court Case Reference:</strong> {mockCourtData.case_number}</div>
                  <div><strong>Jurisdiction:</strong> {mockCourtData.jurisdiction}</div>
                  <div><strong>Hearing Judge:</strong> {mockCourtData.judge}</div>
                  <div><strong>Lead Prosecutor:</strong> {mockCourtData.prosecutor}</div>
                  <div><strong>Defense Counsel:</strong> {mockCourtData.defense_counsel}</div>
                  <div><strong>Verdict Status:</strong> <Badge status="warning">{mockCourtData.verdict}</Badge></div>
                </div>
              </Card>

              <Card title="Hearing Calendar Schedule">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {mockCourtData.hearings.map((h, idx) => (
                    <div key={idx} style={{ padding: '10px 14px', border: '1px solid var(--card-border)', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--muted)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <span style={{ fontWeight: 'var(--weight-bold)', fontSize: 'var(--text-xs)' }}>{h.type}</span>
                        <Badge status="info">{h.status}</Badge>
                      </div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted-foreground)' }}>
                        <div style={{ display: 'flex', gap: '12px', marginTop: '2px' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Calendar size={12} /> {h.date}</span>
                          <span>Room: {h.room}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {/* LEGAL SECTIONS */}
          {activeTab === 'legal' && <FIRPage caseId={caseData.id} />}

          {/* AI COPILOT WORKSPACE */}
          {activeTab === 'ai' && (
            <div className={styles.copilotLayout}>
              {/* Chat Panel */}
              <Card title="AI Investigation Assistant Terminal">
                <div style={{ display: 'flex', flexDirection: 'column', height: '400px' }}>
                  <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', padding: '12px', backgroundColor: 'var(--background)', borderRadius: 'var(--radius-md)', border: '1px solid var(--card-border)' }}>
                    {copilotChat.map((msg, idx) => (
                      <div 
                        key={idx} 
                        style={{ 
                          alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                          backgroundColor: msg.role === 'user' ? 'var(--primary)' : 'var(--muted)',
                          color: msg.role === 'user' ? '#ffffff' : 'var(--foreground)',
                          padding: '10px 14px',
                          borderRadius: 'var(--radius-lg)',
                          maxWidth: '85%',
                          fontSize: 'var(--text-xs)',
                          lineHeight: 1.4,
                          whiteSpace: 'pre-line',
                          border: msg.role === 'assistant' ? '1px solid var(--card-border)' : 'none'
                        }}
                      >
                        {msg.text}
                      </div>
                    ))}
                    {isAIProcessing && (
                      <div style={{ alignSelf: 'flex-start', padding: '10px', fontSize: 'var(--text-xxs)', color: 'var(--muted-foreground)', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <RefreshCw size={12} className={styles.spinIcon} /> AI Co-Pilot is reconstructing logs…
                      </div>
                    )}
                  </div>
                  
                  <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                    <Input
                      id="copilotInput"
                      placeholder="Ask copilot or select quick actions on the right…"
                      value={copilotQuery}
                      onChange={(e) => setCopilotQuery(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleSendCopilot() }}
                      style={{ flex: 1 }}
                    />
                    <Button onClick={handleSendCopilot} disabled={isAIProcessing}>
                      Send
                    </Button>
                  </div>
                </div>
              </Card>

              {/* Action Buttons Panel */}
              <Card title="Copilot Action Cues">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <Button variant="secondary" onClick={() => executeCopilotResponse('Draft investigation plan')} style={{ justifyContent: 'flex-start', textAlign: 'left' }}>
                    <ShieldAlert size={14} style={{ marginRight: '8px', flexShrink: 0 }} /> Draft Investigation Plan
                  </Button>
                  <Button variant="secondary" onClick={() => executeCopilotResponse('Detect contradictions in witness statements')} style={{ justifyContent: 'flex-start', textAlign: 'left' }}>
                    <Scale size={14} style={{ marginRight: '8px', flexShrink: 0 }} /> Testimonies Auditing
                  </Button>
                  <Button variant="secondary" onClick={() => executeCopilotResponse('Draft BNS chargesheet narrative')} style={{ justifyContent: 'flex-start', textAlign: 'left' }}>
                    <FileText size={14} style={{ marginRight: '8px', flexShrink: 0 }} /> Draft BNS Chargesheet
                  </Button>
                  <Button variant="secondary" onClick={() => executeCopilotResponse('Audit evidence completeness')} style={{ justifyContent: 'flex-start', textAlign: 'left' }}>
                    <CheckCircle size={14} style={{ marginRight: '8px', flexShrink: 0 }} /> Check Missing Evidence
                  </Button>
                  <Button variant="secondary" onClick={() => executeCopilotResponse('Generate prosecution brief')} style={{ justifyContent: 'flex-start', textAlign: 'left' }}>
                    <Activity size={14} style={{ marginRight: '8px', flexShrink: 0 }} /> Prosecution Readiness
                  </Button>
                </div>
              </Card>
            </div>
          )}

          {/* RELATIONSHIPS */}
          {activeTab === 'relationships' && (
            <div className={styles.copilotLayout}>
              {/* Interactive Node Graph */}
              <div className={styles.graphContainer}>
                <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-bold)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Network size={16} /> Linkage Graph (Confidence Index: 98%)
                </h3>
                <svg className={styles.graphSvg} width="600" height="400" viewBox="0 0 600 400">
                  {/* Link Lines */}
                  <line x1="300" y1="200" x2="150" y2="100" stroke="var(--primary)" strokeWidth="2" opacity="0.6" />
                  <line x1="300" y1="200" x2="450" y2="100" stroke="var(--primary)" strokeWidth="2" opacity="0.6" />
                  <line x1="300" y1="200" x2="200" y2="320" stroke="var(--primary)" strokeWidth="2" opacity="0.6" />
                  <line x1="300" y1="200" x2="400" y2="320" stroke="var(--primary)" strokeWidth="2" opacity="0.6" />
                  
                  {/* Associated cross links */}
                  <line x1="150" y1="100" x2="100" y2="230" stroke="var(--accent)" strokeWidth="2" />
                  <line x1="150" y1="100" x2="400" y2="320" stroke="#10b981" strokeWidth="2" />
                  
                  {/* AI Cross-Case Matches (Red dashed lines) */}
                  <line x1="100" y1="230" x2="500" y2="100" stroke="#ef4444" strokeWidth="2" strokeDasharray="5,5" />
                  <line x1="150" y1="100" x2="500" y2="100" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="3,3" />

                  {/* Center Node: Case */}
                  <circle 
                    cx="300" cy="200" r="28" 
                    fill="var(--primary)" 
                    style={{ cursor: 'pointer', transition: 'r 0.2s' }}
                    onClick={() => setSelectedGraphNode('Case Node')}
                  />
                  <text x="300" y="204" fill="#ffffff" fontSize="9" textAnchor="middle" fontWeight="bold">CASE</text>

                  {/* Suspect Node: Rahul Yadav */}
                  <circle 
                    cx="150" cy="100" r="24" 
                    fill="var(--danger)" 
                    style={{ cursor: 'pointer' }}
                    onClick={() => setSelectedGraphNode('Rahul Yadav (Suspect)')}
                  />
                  <text x="150" y="103" fill="#ffffff" fontSize="8" textAnchor="middle">Rahul</text>

                  {/* Victim Node: Amit Kumar */}
                  <circle 
                    cx="450" cy="100" r="24" 
                    fill="var(--success)" 
                    style={{ cursor: 'pointer' }}
                    onClick={() => setSelectedGraphNode('Amit Kumar (Victim)')}
                  />
                  <text x="450" y="103" fill="#ffffff" fontSize="8" textAnchor="middle">Amit</text>

                  {/* Witness Node: Sanjay Dutt */}
                  <circle 
                    cx="200" cy="320" r="24" 
                    fill="var(--accent)" 
                    style={{ cursor: 'pointer' }}
                    onClick={() => setSelectedGraphNode('Sanjay Dutt (Witness)')}
                  />
                  <text x="200" y="323" fill="#ffffff" fontSize="8" textAnchor="middle">Sanjay</text>

                  {/* Evidence Node: Iron Rod */}
                  <circle 
                    cx="400" cy="320" r="24" 
                    fill="var(--warning)" 
                    style={{ cursor: 'pointer' }}
                    onClick={() => setSelectedGraphNode('Iron Rod (Evidence)')}
                  />
                  <text x="400" y="323" fill="#000000" fontSize="8" textAnchor="middle">Weapon</text>

                  {/* Vehicle Node: White SUV */}
                  <circle 
                    cx="100" cy="230" r="22" 
                    fill="#9c27b0" 
                    style={{ cursor: 'pointer' }}
                    onClick={() => setSelectedGraphNode('White SUV (DL-3C-AS-8812)')}
                  />
                  <text x="100" y="233" fill="#ffffff" fontSize="7" textAnchor="middle">SUV</text>

                  {/* Cross Match Suspect Node (Cyber case) */}
                  <circle 
                    cx="500" cy="100" r="24" 
                    fill="#ef6c00" 
                    style={{ cursor: 'pointer' }}
                    onClick={() => setSelectedGraphNode('Extortion Dossier (Case #CASE-2026-0941)')}
                  />
                  <text x="500" y="103" fill="#ffffff" fontSize="8" textAnchor="middle">Extortion</text>
                </svg>

                {/* Graph Tooltip Details Panel */}
                <div className={styles.graphInfoPanel}>
                  {selectedGraphNode ? (
                    <div>
                      <strong>Selected Node:</strong> {selectedGraphNode}
                      {selectedGraphNode.includes('Case Node') && (
                        <div style={{ marginTop: '4px' }}>Central assault robbery case in Sector 18. Directly maps coordinates, victim Amit Kumar, and suspect Rahul Yadav.</div>
                      )}
                      {selectedGraphNode.includes('Rahul') && (
                        <div style={{ marginTop: '4px' }}>Primary suspect. Fingerprint index match is mapped on Iron Rod. Shared connection link discovered with Extortion Case #CASE-2026-0941.</div>
                      )}
                      {selectedGraphNode.includes('SUV') && (
                        <div style={{ marginTop: '4px' }}>White SUV (DL-3C-AS-8812). Visual matching from junction cameras confirms it was utilized in both robbery and extortion flights.</div>
                      )}
                      {selectedGraphNode.includes('Extortion') && (
                        <div style={{ marginTop: '4px' }}>🚨 **AI Cross-Link Detected**: Bitcoin extortion letter from cyber files was traced back to the same mobile contact number linked to Rahul Yadav.</div>
                      )}
                    </div>
                  ) : (
                    <div style={{ color: 'var(--muted-foreground)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <HelpCircle size={14} /> Click on any node circle in the graph network above to audit relationship links.
                    </div>
                  )}
                </div>
              </div>

              {/* Relationship List Details */}
              <Card title="AI Linkage Identification">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: 'var(--text-xs)' }}>
                  <div style={{ padding: '8px', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(239, 68, 68, 0.04)' }}>
                    <strong>🚨 Shared Vehicle Vector</strong>: SUV DL-3C-AS-8812 is registered under suspect Rahul Yadav but was also logged in Phishing Fraud Case #CASE-2026-0941.
                  </div>
                  <div style={{ padding: '8px', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(239, 68, 68, 0.04)' }}>
                    <strong>🚨 Shared Phone Number Contact</strong>: Mobile link on Extortion Letter match (+91 99999 11111) maps suspect Rahul Yadav\'s SIM ledger.
                  </div>
                  <div style={{ padding: '8px', border: '1px solid var(--card-border)', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--muted)' }}>
                    <strong>✓ Weapon Verification</strong>: Forensics prints found on recovered rod handle verify suspect\'s dossier file.
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>
      </Tabs>

      {/* Dialog Modals */}
      <Dialog
        isOpen={isAssignOpen}
        onClose={() => setIsAssignOpen(false)}
        title="Assign Lead Officer to Case"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsAssignOpen(false)}>Cancel</Button>
            <Button onClick={handleAssignSubmit} loading={assignMutation.isPending}>Assign</Button>
          </>
        }
      >
        <Select
          id="assignOfficer"
          label="Choose lead investigator officer"
          options={[
            { value: '', label: 'Select investigator...' },
            ...(officersData?.items || []).map((o) => ({
              value: o.id,
              label: `${o.username} (${o.badge_number})`,
            })),
          ]}
          value={selectedOfficer}
          onChange={(e) => setSelectedOfficer(e.target.value)}
        />
      </Dialog>

      <Dialog
        isOpen={isStatusOpen}
        onClose={() => setIsStatusOpen(false)}
        title="Transition Investigation Stage"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsStatusOpen(false)}>Cancel</Button>
            <Button onClick={handleStatusSubmit} loading={transitionMutation.isPending}>Transition</Button>
          </>
        }
      >
        <Select
          id="transitionStatus"
          label="New status"
          options={[
            { value: '', label: 'Select status...' },
            { value: 'Under Investigation', label: 'Under Investigation' },
            { value: 'Pending Review', label: 'Pending Review' },
            { value: 'Closed', label: 'Closed' },
            { value: 'Cold Case', label: 'Cold Case' },
            { value: 'Referred', label: 'Referred' },
          ]}
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
        />
      </Dialog>

      <Dialog
        isOpen={isEventOpen}
        onClose={() => setIsEventOpen(false)}
        title="Add Case Timeline Event"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsEventOpen(false)}>Cancel</Button>
            <Button onClick={handleEventSubmit} loading={addEventMutation.isPending}>Add Event</Button>
          </>
        }
      >
        <div className={styles.eventForm}>
          <Input
            id="eventTitle"
            label="Event Subject / Operation"
            placeholder="e.g. Conducted interview with primary witness"
            value={eventTitle}
            onChange={(e) => setEventTitle(e.target.value)}
          />
          <Input
            id="eventTime"
            type="datetime-local"
            label="Incident / Event Timestamp"
            value={eventTime}
            onChange={(e) => setEventTime(e.target.value)}
          />
          <TextArea
            id="eventDesc"
            label="Additional operation details (Optional)"
            placeholder="Add specific details of what transpired..."
            value={eventDesc}
            onChange={(e) => setEventDesc(e.target.value)}
          />
        </div>
      </Dialog>
    </PageTransition>
  )
}
export default CaseDetailPage
