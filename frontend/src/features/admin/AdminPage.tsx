import React, { useState } from 'react'
import { PlusCircle, RefreshCw, Save, X } from 'lucide-react'
import { PageTransition, Button, Card, Skeleton, Tabs, Table, Dialog, Input, Select, TextArea, EmptyState, Badge } from '@/design-system'
import { useSystemSettings, useUpdateSetting, useCreateStation, useCreateDepartment, useCreateLegalEntry, useClearCache } from './hooks/useAdmin'
import { useToast } from '@/hooks/useToast'
import styles from './AdminPage.module.css'

interface OfficerRecord {
  id: string
  badgeNum: string
  name: string
  role: 'ADMIN' | 'SUPERVISOR' | 'INVESTIGATOR'
  status: 'ACTIVE' | 'ON_DUTY' | 'SUSPENDED'
  station: string
}

interface ApiKey {
  id: string
  name: string
  prefix: string
  status: 'ACTIVE' | 'REVOKED'
  created: string
}

interface NotificationTemplate {
  id: string
  subject: string
  channel: 'SMS' | 'EMAIL' | 'PUSH'
  body: string
}

const mockOfficers: OfficerRecord[] = [
  { id: 'off-1', badgeNum: 'IND-DL-1092', name: 'Inspector Priyanshu', role: 'INVESTIGATOR', status: 'ACTIVE', station: 'PS Sector 18 Precinct' },
  { id: 'off-2', badgeNum: 'IND-DL-2309', name: 'Supervisor Deshmukh', role: 'SUPERVISOR', status: 'ACTIVE', station: 'PS Badarpur Precinct' },
  { id: 'off-3', badgeNum: 'IND-DL-0012', name: 'System Admin Raj', role: 'ADMIN', status: 'ACTIVE', station: 'Delhi Police HQ' },
  { id: 'off-4', badgeNum: 'IND-DL-9821', name: 'Constable Verma', role: 'INVESTIGATOR', status: 'ON_DUTY', station: 'PS Sector 18 Precinct' }
]

const mockApiKeys: ApiKey[] = [
  { id: 'key-1', name: 'SCREEN ENCODE Client Integrator', prefix: 'aipas_live_pk_8192a…', status: 'ACTIVE', created: '2026-07-10 11:20 AM' },
  { id: 'key-2', name: 'Court Docket API Sync SDK', prefix: 'aipas_live_pk_0921z…', status: 'ACTIVE', created: '2026-07-12 09:15 AM' }
]

const mockTemplates: NotificationTemplate[] = [
  { id: 'temp-1', subject: 'Emergency SOS Pulsing Dispatch Alert', channel: 'SMS', body: 'CRITICAL ALERT: Emergency SOS registered for citizen {name} at coordinates {coords}. First dispatch squad deployed.' },
  { id: 'temp-2', subject: 'Court Prosecution Hearing Reminder', channel: 'PUSH', body: 'Governance Reminder: Case {caseCode} hearing scheduled for {date} at {courtRoom}. Please update prosecution plan.' }
]

export const AdminPage: React.FC = () => {
  const { addToast } = useToast()
  const [activeTab, setActiveTab] = useState('settings')
  
  // Dialog visibility states
  const [isStationOpen, setIsStationOpen] = useState(false)
  const [isDeptOpen, setIsDeptOpen] = useState(false)
  const [isLegalOpen, setIsLegalOpen] = useState(false)

  // Inline edit states
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [editingValue, setEditingValue] = useState('')

  // Form states
  const [stationCode, setStationCode] = useState('')
  const [stationName, setStationName] = useState('')
  const [stationDistrict, setStationDistrict] = useState('')
  const [stationState, setStationState] = useState('')

  const [deptName, setDeptName] = useState('')
  const [deptCode, setDeptCode] = useState('')
  const [deptStationId, setDeptStationId] = useState('')

  const [actName, setActName] = useState('')
  const [sectionCode, setSectionCode] = useState('')
  const [legalTitle, setLegalTitle] = useState('')
  const [legalDesc, setLegalDesc] = useState('')
  const [legalPunishment, setLegalPunishment] = useState('')

  // AI Configuration state
  const [aiThreshold, setAiThreshold] = useState(90)
  const [activeModel, setActiveModel] = useState('BNS Classifier v2.1')
  
  // API Keys state
  const [apiKeys, setApiKeys] = useState<ApiKey[]>(mockApiKeys)
  const [newKeyName, setNewKeyName] = useState('')

  // Notification Template states
  const [templates, setTemplates] = useState<NotificationTemplate[]>(mockTemplates)
  const [editingTemplate, setEditingTemplate] = useState<NotificationTemplate | null>(null)
  const [templateBody, setTemplateBody] = useState('')

  // Query hooks
  const { data: settings, isLoading, isError } = useSystemSettings()
  const updateSettingMutation = useUpdateSetting()
  const createStationMutation = useCreateStation()
  const createDeptMutation = useCreateDepartment()
  const createLegalMutation = useCreateLegalEntry()
  const clearCacheMutation = useClearCache()

  const handleUpdateSetting = async (key: string) => {
    if (!editingValue.trim()) return
    try {
      await updateSettingMutation.mutateAsync({ key, value: editingValue })
      setEditingKey(null)
      setEditingValue('')
    } catch {}
  }

  const handleStationSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stationCode || !stationName) return
    try {
      await createStationMutation.mutateAsync({
        code: stationCode,
        name: stationName,
        district: stationDistrict,
        state: stationState,
      })
      setIsStationOpen(false)
      setStationCode('')
      setStationName('')
      addToast('Police precinct registered successfully.', 'success')
    } catch {}
  }

  const handleDeptSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!deptCode || !deptName || !deptStationId) return
    try {
      await createDeptMutation.mutateAsync({
        station_id: deptStationId,
        name: deptName,
        code: deptCode,
      })
      setIsDeptOpen(false)
      setDeptName('')
      setDeptCode('')
      setDeptStationId('')
      addToast('Precinct department registered successfully.', 'success')
    } catch {}
  }

  const handleLegalSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!actName || !sectionCode || !legalTitle) return
    try {
      await createLegalMutation.mutateAsync({
        act_name: actName,
        section_code: sectionCode,
        title: legalTitle,
        description: legalDesc,
        punishment: legalPunishment || undefined,
      })
      setIsLegalOpen(false)
      setActName('')
      setSectionCode('')
      setLegalTitle('')
      setLegalDesc('')
      setLegalPunishment('')
      addToast('Legal act code dictionary entry registered successfully.', 'success')
    } catch {}
  }

  const handleGenerateKey = () => {
    if (!newKeyName.trim()) {
      addToast('Please enter an API Client identifier name.', 'error')
      return
    }
    const newKey: ApiKey = {
      id: `key-${Date.now()}`,
      name: newKeyName,
      prefix: `aipas_live_pk_${Math.floor(1000 + Math.random() * 9000)}x…`,
      status: 'ACTIVE',
      created: new Date().toISOString().substring(0, 16).replace('T', ' ')
    }
    setApiKeys(prev => [...prev, newKey])
    setNewKeyName('')
    addToast('Developer API SDK key generated successfully.', 'success')
  }

  const handleRevokeKey = (id: string) => {
    setApiKeys(prev => prev.map(k => k.id === id ? { ...k, status: 'REVOKED' } : k))
    addToast('API Key credentials successfully revoked.', 'warning')
  }

  const handleSaveTemplate = () => {
    if (!editingTemplate) return
    setTemplates(prev => prev.map(t => 
      t.id === editingTemplate.id ? { ...t, body: templateBody } : t
    ))
    setEditingTemplate(null)
    setTemplateBody('')
    addToast('System Notification Template updated.', 'success')
  }

  const settingsColumns = [
    {
      key: 'key',
      label: 'Configuration Key',
      render: (row: any) => {
        const key = Object.keys(row)[0]
        return <span style={{ fontWeight: 'var(--weight-bold)' }}>{key}</span>
      },
    },
    {
      key: 'value',
      label: 'Value',
      render: (row: any) => {
        const key = Object.keys(row)[0]
        const val = row[key]
        const isEditing = editingKey === key

        if (isEditing) {
          return (
            <div className={styles.inlineEditRow} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <Input
                id={`edit-${key}`}
                value={editingValue}
                onChange={(e) => setEditingValue(e.target.value)}
                style={{ marginBottom: 0, padding: '4px 8px' }}
              />
              <Button onClick={() => handleUpdateSetting(key)} loading={updateSettingMutation.isPending} style={{ padding: '6px' }}>
                <Save size={14} />
              </Button>
              <Button variant="secondary" onClick={() => setEditingKey(null)} style={{ padding: '6px' }}>
                <X size={14} />
              </Button>
            </div>
          )
        }

        return (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>{val}</span>
            <Button
              variant="secondary"
              onClick={() => {
                setEditingKey(key)
                setEditingValue(val || '')
              }}
              style={{ padding: '4px 8px', fontSize: 'var(--text-xs)' }}
            >
              Change Value
            </Button>
          </div>
        )
      },
    },
    {
      key: 'description',
      label: 'Setting Description',
      render: (row: any) => <span style={{ color: 'var(--muted-foreground)' }}>{row.description || '—'}</span>,
    },
  ]

  const columnsOfficers = [
    { key: 'badgeNum', label: 'Badge Number' },
    { key: 'name', label: 'Officer Name' },
    {
      key: 'role',
      label: 'Access Permission Role',
      render: (row: OfficerRecord) => <Badge status="info">{row.role}</Badge>
    },
    {
      key: 'status',
      label: 'Duty Status',
      render: (row: OfficerRecord) => <Badge status={row.status === 'ACTIVE' || row.status === 'ON_DUTY' ? 'success' : 'danger'}>{row.status}</Badge>
    },
    { key: 'station', label: 'Precinct Station' }
  ]

  return (
    <PageTransition className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Precinct Administration Console</h1>
          <p className={styles.subtitle}>System variables, force registries, AI configs, and developer access credentials</p>
        </div>
        {activeTab === 'settings' && (
          <Button variant="secondary" onClick={() => { clearCacheMutation.mutate(); addToast('Analytics caches cleared successfully.', 'success') }} loading={clearCacheMutation.isPending}>
            <RefreshCw size={16} style={{ marginRight: '8px' }} /> Clear Analytics Cache
          </Button>
        )}
      </div>

      <Tabs
        activeTab={activeTab}
        onChange={setActiveTab}
        tabs={[
          { value: 'settings', label: 'System Settings' },
          { value: 'users', label: 'Officer Directory' },
          { value: 'ai_configs', label: 'AI Configurations' },
          { value: 'api_keys', label: 'API Keys Registry' },
          { value: 'templates', label: 'Alert Templates' },
          { value: 'stations', label: 'Police Stations' },
          { value: 'departments', label: 'Departments' },
          { value: 'legal', label: 'Legal Dictionary' }
        ]}
      >
        <div className={styles.tabContent} style={{ marginTop: 20 }}>
          {activeTab === 'settings' && (
            <Card title="System Variables Registry">
              {isLoading ? (
                <Skeleton height="200px" />
              ) : isError ? (
                <EmptyState description="Failed to load settings variables." />
              ) : (
                <Table columns={settingsColumns as any} data={(settings || []) as any} keyField="key" />
              )}
            </Card>
          )}

          {activeTab === 'users' && (
            <Card title="Station Authorized Officers Directory">
              <Table columns={columnsOfficers} data={mockOfficers} keyField="id" />
            </Card>
          )}

          {activeTab === 'ai_configs' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              <Card title="AI Matching & Prediction Parameters">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 'bold', display: 'block', marginBottom: 8 }}>
                      Global Biometric & Plate Similarity Match Threshold: {aiThreshold}%
                    </label>
                    <input 
                      type="range"
                      min="50"
                      max="100"
                      value={aiThreshold}
                      onChange={(e) => {
                        const val = Number(e.target.value)
                        setAiThreshold(val)
                        localStorage.setItem('aipas_ai_similarity_threshold', String(val))
                      }}
                      style={{ width: '100%', accentColor: 'var(--primary)' }}
                    />
                    <span style={{ fontSize: 10, color: 'var(--muted-foreground)' }}>Higher values decrease false positives in scanner match notifications.</span>
                  </div>

                  <div>
                    <Select 
                      id="activeModel"
                      label="Active Legal Classification LLM Model Version"
                      options={[
                        { value: 'BNS Classifier v2.1', label: 'BNS Classifier v2.1 (Bharatiya Nyaya Sanhita)' },
                        { value: 'IPC Legacy Matcher v1.0', label: 'IPC Code Model (Legacy Indian Penal Code)' },
                        { value: 'Fine-tuned Llama-3-Precinct', label: 'Fine-tuned Llama-3-Precinct (Local training)' }
                      ]}
                      value={activeModel}
                      onChange={(e) => setActiveModel(e.target.value)}
                    />
                  </div>

                  <Button onClick={() => addToast('AI Model configuration synced successfully.', 'success')}>
                    Apply Model Changes
                  </Button>
                </div>
              </Card>

              <Card title="Cognitive Pipeline Breaker Limits">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 13 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--card-border)', paddingBottom: 6 }}>
                    <span>Breaker Trip Error Threshold</span>
                    <strong>5 failures / 30s</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--card-border)', paddingBottom: 6, paddingTop: 6 }}>
                    <span>Auto-Reset Timeout period</span>
                    <strong>60 seconds</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--card-border)', paddingBottom: 6, paddingTop: 6 }}>
                    <span>OCR Scan Max File Size</span>
                    <strong>15 MB limit</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 6 }}>
                    <span>BNS Match confidence cut-off</span>
                    <strong>75% accuracy index</strong>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {activeTab === 'api_keys' && (
            <Card title="External Developer API Access Keys">
              <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'flex-end' }}>
                <div style={{ flex: 1 }}>
                  <Input 
                    id="newKeyName"
                    label="API client / Consumer Name"
                    placeholder="e.g. High Court Sync Client"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    style={{ marginBottom: 0 }}
                  />
                </div>
                <Button onClick={handleGenerateKey}>
                  <PlusCircle size={14} style={{ marginRight: 8 }} /> Generate API Key
                </Button>
              </div>

              <Table 
                columns={[
                  { key: 'name', label: 'Consumer Client' },
                  { key: 'prefix', label: 'API SDK Key Prefix' },
                  {
                    key: 'status',
                    label: 'State',
                    render: (row: ApiKey) => <Badge status={row.status === 'ACTIVE' ? 'success' : 'danger'}>{row.status}</Badge>
                  },
                  { key: 'created', label: 'Issued' },
                  {
                    key: 'actions',
                    label: 'Actions',
                    render: (row: ApiKey) => (
                      row.status === 'ACTIVE' ? (
                        <Button variant="secondary" onClick={() => handleRevokeKey(row.id)} style={{ padding: '4px 8px', fontSize: 11, color: 'var(--danger)' }}>
                          Revoke Key
                        </Button>
                      ) : <span>—</span>
                    )
                  }
                ]}
                data={apiKeys}
                keyField="id"
              />
            </Card>
          )}

          {activeTab === 'templates' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 24 }}>
              <Card title="Central Alert Templates list">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {templates.map(t => (
                    <div 
                      key={t.id}
                      style={{ padding: 12, border: '1px solid var(--card-border)', borderRadius: 8, cursor: 'pointer', background: 'var(--card-bg)' }}
                      onClick={() => {
                        setEditingTemplate(t)
                        setTemplateBody(t.body)
                      }}
                    >
                      <strong style={{ fontSize: 13, display: 'block' }}>{t.subject}</strong>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--muted-foreground)', marginTop: 4 }}>
                        <span>Channel: {t.channel}</span>
                        <span>Click to edit</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card title="Alert Template Content Editor">
                {editingTemplate ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div>
                      <strong>Editing: {editingTemplate.subject}</strong>
                      <span style={{ display: 'block', fontSize: 11, color: 'var(--muted-foreground)', marginTop: 2 }}>Target Notification Channel: {editingTemplate.channel}</span>
                    </div>
                    <TextArea 
                      id="templateBody"
                      label="Template Text Body"
                      value={templateBody}
                      onChange={(e) => setTemplateBody(e.target.value)}
                      rows={5}
                    />
                    <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                      <Button variant="secondary" onClick={() => setEditingTemplate(null)}>Cancel</Button>
                      <Button onClick={handleSaveTemplate}>Save Template</Button>
                    </div>
                  </div>
                ) : (
                  <EmptyState description="Select an alert template from the list to edit its SMS/Email layout." />
                )}
              </Card>
            </div>
          )}

          {activeTab === 'stations' && (
            <Card title="Registered Police Stations">
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
                <Button onClick={() => setIsStationOpen(true)}>
                  <PlusCircle size={16} style={{ marginRight: '8px' }} /> Register Station
                </Button>
              </div>
              <Table 
                columns={[
                  { key: 'code', label: 'Precinct ID Code' },
                  { key: 'name', label: 'Station Name' },
                  { key: 'district', label: 'Sub-District Division' },
                  { key: 'state', label: 'State Region' }
                ]}
                data={[
                  { code: 'PS-SEC18', name: 'PS Sector 18 Precinct', district: 'South Delhi Division', state: 'Delhi' },
                  { code: 'PS-BADAR', name: 'PS Badarpur Precinct', district: 'South East Division', state: 'Delhi' },
                  { code: 'PS-OKHLA', name: 'PS Okhla Precinct', district: 'Okhla Division', state: 'Delhi' }
                ]}
                keyField="code"
              />
            </Card>
          )}

          {activeTab === 'departments' && (
            <Card title="Force Departments Registry">
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
                <Button onClick={() => setIsDeptOpen(true)}>
                  <PlusCircle size={16} style={{ marginRight: '8px' }} /> Register Department
                </Button>
              </div>
              <Table 
                columns={[
                  { key: 'code', label: 'Department Code' },
                  { key: 'name', label: 'Division Squad Name' },
                  { key: 'station_id', label: 'Station Association Code' }
                ]}
                data={[
                  { code: 'CYBER-CELL', name: 'Cyber Phishing Investigations Squad', station_id: 'PS-SEC18' },
                  { code: 'ROBBERY-SQ', name: 'Armed Burglary Taskforce', station_id: 'PS-SEC18' },
                  { code: 'TRAFFIC-DIV', name: 'Traffic challan MV Enforcement', station_id: 'PS-BADAR' }
                ]}
                keyField="code"
              />
            </Card>
          )}

          {activeTab === 'legal' && (
            <Card title="Legal Code Dictionary">
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
                <Button onClick={() => setIsLegalOpen(true)}>
                  <PlusCircle size={16} style={{ marginRight: '8px' }} /> Add Legal Dictionary Entry
                </Button>
              </div>
              <Table 
                columns={[
                  { key: 'section_code', label: 'BNS/IPC Section' },
                  { key: 'title', label: 'Title Subject' },
                  { key: 'act_name', label: 'Act Code' },
                  { key: 'punishment', label: 'Punishment Details' }
                ]}
                data={[
                  { section_code: 'Section 103', title: 'Punishment for Murder', act_name: 'BNS (Bharatiya Nyaya Sanhita)', punishment: 'Death penalty or life imprisonment' },
                  { section_code: 'Section 304', title: 'Snatching & Robbery with Hurt', act_name: 'BNS (Bharatiya Nyaya Sanhita)', punishment: 'Rigorous imprisonment up to 3 years' },
                  { section_code: 'Section 318', title: 'Cheating by online impersonation', act_name: 'BNS (Bharatiya Nyaya Sanhita)', punishment: 'Imprisonment up to 7 years' }
                ]}
                keyField="section_code"
              />
            </Card>
          )}
        </div>
      </Tabs>

      {/* Police Station Dialog */}
      <Dialog
        isOpen={isStationOpen}
        onClose={() => setIsStationOpen(false)}
        title="Register Police Station"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsStationOpen(false)}>Cancel</Button>
            <Button onClick={handleStationSubmit} loading={createStationMutation.isPending}>Register</Button>
          </>
        }
      >
        <form onSubmit={handleStationSubmit} className={styles.formGrid} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Input id="stCode" label="Station Code" value={stationCode} onChange={(e) => setStationCode(e.target.value)} />
          <Input id="stName" label="Station Name" value={stationName} onChange={(e) => setStationName(e.target.value)} />
          <Input id="stDistrict" label="District" value={stationDistrict} onChange={(e) => setStationDistrict(e.target.value)} />
          <Input id="stState" label="State" value={stationState} onChange={(e) => setStationState(e.target.value)} />
        </form>
      </Dialog>

      {/* Department Dialog */}
      <Dialog
        isOpen={isDeptOpen}
        onClose={() => setIsDeptOpen(false)}
        title="Register Station Department"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsDeptOpen(false)}>Cancel</Button>
            <Button onClick={handleDeptSubmit} loading={createDeptMutation.isPending}>Register</Button>
          </>
        }
      >
        <form onSubmit={handleDeptSubmit} className={styles.formGrid} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Input id="deptStation" label="Station ID (UUID)" value={deptStationId} onChange={(e) => setDeptStationId(e.target.value)} />
          <Input id="deptName" label="Department Name" value={deptName} onChange={(e) => setDeptName(e.target.value)} />
          <Input id="deptCode" label="Department Code" value={deptCode} onChange={(e) => setDeptCode(e.target.value)} />
        </form>
      </Dialog>

      {/* Legal Entry Dialog */}
      <Dialog
        isOpen={isLegalOpen}
        onClose={() => setIsLegalOpen(false)}
        title="Register Legal Dictionary Section"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsLegalOpen(false)}>Cancel</Button>
            <Button onClick={handleLegalSubmit} loading={createLegalMutation.isPending}>Add Entry</Button>
          </>
        }
      >
        <form onSubmit={handleLegalSubmit} className={styles.formGrid} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Input id="lAct" label="Act Name (e.g. IPC, CrPC)" value={actName} onChange={(e) => setActName(e.target.value)} />
          <Input id="lSection" label="Section Code (e.g. 302, 34)" value={sectionCode} onChange={(e) => setSectionCode(e.target.value)} />
          <Input id="lTitle" label="Title Subject" value={legalTitle} onChange={(e) => setLegalTitle(e.target.value)} />
          <Input id="lPunish" label="Punishment Details" value={legalPunishment} onChange={(e) => setLegalPunishment(e.target.value)} />
          <TextArea id="lDesc" label="Section Full Description" value={legalDesc} onChange={(e) => setLegalDesc(e.target.value)} rows={4} />
        </form>
      </Dialog>
    </PageTransition>
  )
}
export default AdminPage
