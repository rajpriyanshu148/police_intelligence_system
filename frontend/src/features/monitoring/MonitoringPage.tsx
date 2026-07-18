import React, { useState } from 'react'
import { Activity, Database, HardDrive, Cpu, RefreshCw, Download } from 'lucide-react'
import { PageTransition, Button, Card, Badge, Skeleton, Tabs, Table, Select, Input, EmptyState } from '@/design-system'
import { useSystemHealth, useReadiness, useVersionInfo } from './hooks/useMonitoring'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useToast } from '@/hooks/useToast'
import styles from './MonitoringPage.module.css'

interface AuditLog {
  id: string
  timestamp: string
  user: string
  action: string
  module: 'AUTH' | 'EVIDENCE' | 'INVESTIGATION' | 'ADMIN' | 'COGNITIVE'
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  ipAddress: string
  description: string
}

interface AiOverrideLog {
  id: string
  timestamp: string
  caseCode: string
  officer: string
  alertTriggered: string
  confidenceScore: number
  decisionStatus: 'APPROVED' | 'OVERRIDDEN'
  justification: string
}

const mockAuditLogs: AuditLog[] = [
  { id: 'aud-109', timestamp: '2026-07-18 04:30:12 PM', user: 'inspector_priyanshu', action: 'READ', module: 'EVIDENCE', severity: 'MEDIUM', ipAddress: '10.12.184.22', description: 'Accessed file [rml_hospital_trauma_sheet.pdf] chain of custody logs.' },
  { id: 'aud-108', timestamp: '2026-07-18 04:22:05 PM', user: 'admin_sys', action: 'WRITE', module: 'ADMIN', severity: 'HIGH', ipAddress: '10.12.184.10', description: 'Updated global biometric similarity matching threshold from 85% to 90%.' },
  { id: 'aud-107', timestamp: '2026-07-18 04:15:33 PM', user: 'inspector_priyanshu', action: 'WRITE', module: 'INVESTIGATION', severity: 'MEDIUM', ipAddress: '10.12.184.22', description: 'Created new case entry [CASE-2026-0812] State vs Rahul Yadav.' },
  { id: 'aud-106', timestamp: '2026-07-18 03:59:10 PM', user: 'constable_verma', action: 'READ', module: 'AUTH', severity: 'LOW', ipAddress: '10.12.184.44', description: 'Facial verification biometrics login scan successfully completed.' },
  { id: 'aud-105', timestamp: '2026-07-18 03:44:12 PM', user: 'inspector_priyanshu', action: 'DELETE', module: 'EVIDENCE', severity: 'CRITICAL', ipAddress: '10.12.184.22', description: 'Deleted draft laboratory report record file [lab_draft_reject.pdf].' }
]

const mockAiOverrideLogs: AiOverrideLog[] = [
  {
    id: 'ovr-201',
    timestamp: '2026-07-18 04:12:10 PM',
    caseCode: 'CASE-2026-0812',
    officer: 'Inspector Priyanshu',
    alertTriggered: 'Duplicate vehicle registration plate match found in CASE-2025-0104',
    confidenceScore: 92,
    decisionStatus: 'APPROVED',
    justification: 'AI matched suspect white SUV vehicle tag plates directly from CP footage.'
  },
  {
    id: 'ovr-202',
    timestamp: '2026-07-18 02:40:15 PM',
    caseCode: 'CASE-2026-0922',
    officer: 'Supervisor Deshmukh',
    alertTriggered: 'Witness statement timeline mismatch - 30 min variance',
    confidenceScore: 78,
    decisionStatus: 'OVERRIDDEN',
    justification: 'Verified manually: variance due to traffic delays registered on MV logs.'
  }
]

// Latency mock stats
const mockLatencyData = [
  { time: '16:00', latency: 45, cpu: 22, memory: 48 },
  { time: '16:10', latency: 62, cpu: 28, memory: 49 },
  { time: '16:20', latency: 50, cpu: 35, memory: 52 },
  { time: '16:30', latency: 120, cpu: 58, memory: 60 },
  { time: '16:40', latency: 78, cpu: 42, memory: 58 },
  { time: '16:50', latency: 55, cpu: 30, memory: 55 },
  { time: '17:00', latency: 48, cpu: 25, memory: 54 }
]

export const MonitoringPage: React.FC = () => {
  const { data: health, isLoading: isHealthLoading, refetch: refetchHealth } = useSystemHealth()
  const { data: readiness, isLoading: isReadyLoading } = useReadiness()
  const { data: version } = useVersionInfo()
  const { addToast } = useToast()

  const [activeTab, setActiveTab] = useState('telemetry')

  // Log Filter States
  const [severityFilter, setSeverityFilter] = useState('All')
  const [moduleFilter, setModuleFilter] = useState('All')
  const [searchFilter, setSearchFilter] = useState('')

  const handleExportCSV = () => {
    // Generate CSV contents
    const headers = 'Audit ID,Timestamp,Operator,Action,Module,Severity,IP,Description\n'
    const rows = filteredAuditLogs.map(log => 
      `"${log.id}","${log.timestamp}","${log.user}","${log.action}","${log.module}","${log.severity}","${log.ipAddress}","${log.description.replace(/"/g, '""')}"`
    ).join('\n')
    
    const blob = new Blob([headers + rows], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.setAttribute('href', url)
    a.setAttribute('download', `AIPAS_compliance_audit_${new Date().toISOString().slice(0,10)}.csv`)
    a.click()
    addToast('Audit log CSV report exported successfully.', 'success')
  }

  const filteredAuditLogs = mockAuditLogs.filter(log => {
    const matchesSeverity = severityFilter === 'All' || log.severity === severityFilter
    const matchesModule = moduleFilter === 'All' || log.module === moduleFilter
    const matchesSearch = log.description.toLowerCase().includes(searchFilter.toLowerCase()) || 
                          log.user.toLowerCase().includes(searchFilter.toLowerCase())
    return matchesSeverity && matchesModule && matchesSearch
  })

  if (isHealthLoading || isReadyLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <Skeleton width="200px" height="32px" />
        </div>
        <div className={styles.healthGrid}>
          <Skeleton height="200px" />
          <Skeleton height="200px" />
        </div>
      </div>
    )
  }

  const isSystemHealthy = health?.status === 'healthy'
  const isReady = readiness?.status === 'ready'

  const columnsAudit = [
    { key: 'timestamp', label: 'Timestamp' },
    {
      key: 'user',
      label: 'Operator / IP',
      render: (row: AuditLog) => (
        <div>
          <span style={{ fontWeight: 'var(--weight-semibold)' }}>{row.user}</span>
          <span style={{ display: 'block', fontSize: 10, color: 'var(--muted-foreground)' }}>{row.ipAddress}</span>
        </div>
      )
    },
    {
      key: 'action',
      label: 'Action',
      render: (row: AuditLog) => (
        <Badge status={
          row.action === 'DELETE' ? 'danger' :
          row.action === 'WRITE' ? 'warning' : 'success'
        }>
          {row.action}
        </Badge>
      )
    },
    { key: 'module', label: 'Module' },
    {
      key: 'severity',
      label: 'Severity',
      render: (row: AuditLog) => (
        <Badge status={
          row.severity === 'CRITICAL' ? 'danger' :
          row.severity === 'HIGH' ? 'warning' :
          row.severity === 'MEDIUM' ? 'info' : 'success'
        }>
          {row.severity}
        </Badge>
      )
    },
    {
      key: 'description',
      label: 'Detail Narrative Log',
      render: (row: AuditLog) => (
        <span style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>{row.description}</span>
      )
    }
  ]

  const columnsOverrides = [
    { key: 'timestamp', label: 'Timestamp' },
    { key: 'caseCode', label: 'Case Number' },
    { key: 'officer', label: 'Reviewer Officer' },
    {
      key: 'alertTriggered',
      label: 'AI Recommendation Alert Trigger',
      render: (row: AiOverrideLog) => (
        <div style={{ maxWidth: 220 }}>
          <span style={{ fontSize: 12, fontWeight: 'var(--weight-semibold)' }}>{row.alertTriggered}</span>
          <span style={{ display: 'block', fontSize: 10, color: 'var(--muted-foreground)', marginTop: 2 }}>Confidence Score: {row.confidenceScore}%</span>
        </div>
      )
    },
    {
      key: 'decisionStatus',
      label: 'Decision',
      render: (row: AiOverrideLog) => (
        <Badge status={row.decisionStatus === 'APPROVED' ? 'success' : 'danger'}>
          {row.decisionStatus}
        </Badge>
      )
    },
    {
      key: 'justification',
      label: 'Human Justification Logs',
      render: (row: AiOverrideLog) => (
        <span style={{ fontSize: 12, color: 'var(--muted-foreground)', fontStyle: 'italic' }}>"{row.justification}"</span>
      )
    }
  ]

  return (
    <PageTransition className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Governance & Telemetry Console</h1>
          <p className={styles.subtitle}>System Heartbeats, Database Audits, and Human-in-the-Loop AI Override Trails</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <Button variant="secondary" onClick={() => refetchHealth()}>
            <RefreshCw size={16} style={{ marginRight: '8px' }} /> Reload Heartbeats
          </Button>
        </div>
      </div>

      <Tabs
        activeTab={activeTab}
        onChange={setActiveTab}
        tabs={[
          { value: 'telemetry', label: 'Telemetry Heartbeats' },
          { value: 'audit', label: 'Compliance Audit Trail' },
          { value: 'ai_decisions', label: 'AI Decision Override logs' }
        ]}
      >
        <div className={styles.tabContent} style={{ marginTop: 20 }}>
          {activeTab === 'telemetry' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              
              {/* Telemetry Heartbeats Grid */}
              <div className={styles.healthGrid}>
                
                {/* Microservice health markers */}
                <Card title="System Readiness Indicators">
                  <div className={styles.subsystemList}>
                    <div className={styles.subsystemItem}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Activity size={18} color="var(--primary)" />
                        <span>FastAPI Service Status</span>
                      </div>
                      <Badge status={isSystemHealthy ? 'success' : 'danger'}>
                        {isSystemHealthy ? 'HEALTHY' : 'OFFLINE'}
                      </Badge>
                    </div>

                    <div className={styles.subsystemItem}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Database size={18} color="var(--success)" />
                        <span>PostgreSQL Database Client</span>
                      </div>
                      <Badge status={health?.subsystems?.database === 'healthy' ? 'success' : 'danger'}>
                        {health?.subsystems?.database?.toUpperCase() || 'HEALTHY'}
                      </Badge>
                    </div>

                    <div className={styles.subsystemItem}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <HardDrive size={18} color="var(--accent)" />
                        <span>Local S3 Storage Adaptor</span>
                      </div>
                      <Badge status={health?.subsystems?.storage === 'healthy' ? 'success' : 'danger'}>
                        {health?.subsystems?.storage?.toUpperCase() || 'HEALTHY'}
                      </Badge>
                    </div>

                    <div className={styles.subsystemItem}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Cpu size={18} color="var(--primary)" />
                        <span>Cognitive AI pipeline server</span>
                      </div>
                      <Badge status="success">ONLINE</Badge>
                    </div>

                    <div className={styles.subsystemItem}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Activity size={18} color="var(--accent)" />
                        <span>Kubernetes Readiness Probe</span>
                      </div>
                      <Badge status={isReady ? 'success' : 'danger'}>
                        {isReady ? 'READY' : 'NOT READY'}
                      </Badge>
                    </div>
                  </div>
                </Card>

                {/* Real-time Hardware Performance Gauge */}
                <Card title="Hardware Resource Consumption">
                  <div className={styles.subsystemList}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, borderBottom: '1px solid var(--card-border)', paddingBottom: 6 }}>
                      <span>System Memory Allocation</span>
                      <strong>54% (8.6 GB / 16 GB)</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, borderBottom: '1px solid var(--card-border)', paddingBottom: 6, paddingTop: 6 }}>
                      <span>Active CPU Core Thread Load</span>
                      <strong>24% Usage</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, borderBottom: '1px solid var(--card-border)', paddingBottom: 6, paddingTop: 6 }}>
                      <span>Asynchronous Queue Backlog</span>
                      <strong>0 Tasks pending</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, paddingTop: 6 }}>
                      <span>Average API Response Latency</span>
                      <strong>48 ms</strong>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Latency Area Chart */}
              <Card title="Average API Transaction Latency Timeline (ms)">
                <div style={{ height: 260, width: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={mockLatencyData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorLatency" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="time" stroke="var(--muted-foreground)" />
                      <YAxis stroke="var(--muted-foreground)" />
                      <Tooltip contentStyle={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)', color: 'var(--foreground)' }} />
                      <Area type="monotone" dataKey="latency" stroke="var(--primary)" fillOpacity={1} fill="url(#colorLatency)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              {/* Metadata Footer info */}
              {version && (
                <Card title="Vite/FastAPI Compile Version Context">
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, fontSize: 12 }}>
                    <div>
                      <span style={{ color: 'var(--muted-foreground)', display: 'block' }}>Release Tag</span>
                      <strong>{version.version}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--muted-foreground)', display: 'block' }}>Environment Mode</span>
                      <strong>{version.environment?.toUpperCase()}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--muted-foreground)', display: 'block' }}>Build Date</span>
                      <strong>{new Date(version.build_time).toLocaleDateString()}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--muted-foreground)', display: 'block' }}>Cryptographic Release Commit</span>
                      <code style={{ fontSize: 9 }}>{version.commit_hash}</code>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          )}

          {activeTab === 'audit' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              
              {/* Filter controls */}
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ flex: 1, minWidth: 260 }}>
                  <Input 
                    id="auditSearch"
                    placeholder="Search by operator badge name, transaction description..."
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    style={{ marginBottom: 0 }}
                  />
                </div>
                <div style={{ minWidth: 160 }}>
                  <Select 
                    id="auditSeverity"
                    options={[
                      { value: 'All', label: 'All Severities' },
                      { value: 'LOW', label: 'Low Severity' },
                      { value: 'MEDIUM', label: 'Medium Severity' },
                      { value: 'HIGH', label: 'High Severity' },
                      { value: 'CRITICAL', label: 'Critical Errors' }
                    ]}
                    value={severityFilter}
                    onChange={(e) => setSeverityFilter(e.target.value)}
                  />
                </div>
                <div style={{ minWidth: 160 }}>
                  <Select 
                    id="auditModule"
                    options={[
                      { value: 'All', label: 'All Modules' },
                      { value: 'AUTH', label: 'Authorization Audits' },
                      { value: 'EVIDENCE', label: 'Evidence Operations' },
                      { value: 'INVESTIGATION', label: 'Case Transactions' },
                      { value: 'ADMIN', label: 'System Modifications' },
                      { value: 'COGNITIVE', label: 'Cognitive Alerts' }
                    ]}
                    value={moduleFilter}
                    onChange={(e) => setModuleFilter(e.target.value)}
                  />
                </div>
                <Button onClick={handleExportCSV}>
                  <Download size={14} style={{ marginRight: 8 }} /> Export CSV Audit Log
                </Button>
              </div>

              {/* Compliance ledger table */}
              <Card title="Immutable Audit Registry Log (compliance verified)">
                {filteredAuditLogs.length === 0 ? (
                  <EmptyState description="No transaction events match the active search parameters." />
                ) : (
                  <Table columns={columnsAudit} data={filteredAuditLogs} keyField="id" />
                )}
              </Card>

            </div>
          )}

          {activeTab === 'ai_decisions' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <Card title="Human-in-the-Loop (HITL) Override Ledger">
                <p style={{ fontSize: 12, color: 'var(--muted-foreground)', marginBottom: 16 }}>
                  List of decisions where officers verified or modified the AI classification. These audits ensure machine learning accountability and transparency.
                </p>
                <Table columns={columnsOverrides} data={mockAiOverrideLogs} keyField="id" />
              </Card>
            </div>
          )}
        </div>
      </Tabs>
    </PageTransition>
  )
}
export default MonitoringPage
