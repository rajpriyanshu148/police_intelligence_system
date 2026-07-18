import React, { useState } from 'react'
import { CheckCircle, Printer } from 'lucide-react'
import { PageTransition, Card, Badge, Button, Input, TextArea, EmptyState } from '@/design-system'
import styles from './FIRWorkspacePage.module.css'

interface FIRRecord {
  id: string
  case_number: string
  complainant: string
  incident_date: string
  sections: string[]
  status: 'Pending Draft' | 'Pending Approval' | 'Approved' | 'Returned' | 'Registered'
  draft_text: string
  supervisor?: string
  last_modified: string
  versions: Array<{ version: number, editor: string, date: string }>
}

const mockFIRs: FIRRecord[] = [
  {
    id: 'f-10291',
    case_number: 'CASE-001',
    complainant: 'Amit Kumar',
    incident_date: '2026-07-16',
    sections: ['BNS Section 304 (Assault/Snatching)', 'BNS Section 324 (Hurt with Weapon)'],
    status: 'Pending Approval',
    draft_text: `FIRST INFORMATION REPORT
(Under Section 154 Cr.P.C.)

1. District: South Delhi | Police Station: Sector 18
2. FIR No: 2026/00192 | Date: 2026-07-17
3. Acts & Sections:
   - Bharatiya Nyaya Sanhita (BNS) Section 304
   - Bharatiya Nyaya Sanhita (BNS) Section 324
4. Type of Incident: Robbery and Physical Assault
5. Details of Complainant:
   - Name: Amit Kumar, S/o Ram Kumar
   - Address: House 410, Sector 18, Noida
6. Incident Narrative:
   Complainant was returning from his office on foot. At approximately 11:00 PM near the crossroads, a white SUV registered under plate DL-3C-AS-8812 blocked his path. Two males got out carrying iron rods. Complainant resisted snatching of his laptop, upon which the suspects assaulted him causing blunt force injuries. Suspects fled.
`,
    supervisor: 'Supervisor Officer',
    last_modified: '2026-07-17 11:20 AM',
    versions: [
      { version: 1, editor: 'AI Auto-Draft', date: '2026-07-16 11:58 PM' },
      { version: 2, editor: 'Investigator Priyanshu', date: '2026-07-17 11:20 AM' }
    ]
  },
  {
    id: 'f-10292',
    case_number: 'CASE-002',
    complainant: 'Sunita Devi',
    incident_date: '2026-07-15',
    sections: ['BNS Section 318 (Cheating)'],
    status: 'Registered',
    draft_text: `FIRST INFORMATION REPORT
(Under Section 154 Cr.P.C.)

1. District: South Delhi | Police Station: Sector 18
2. FIR No: 2026/00189 | Date: 2026-07-15
3. Acts & Sections: BNS Section 318
4. Type of Incident: Cyber Financial Fraud
5. Complainant: Sunita Devi
6. Narrative: Complainant received a phishing link requesting KYC details. Rs 45,000 was debited.
`,
    supervisor: 'Supervisor Officer',
    last_modified: '2026-07-16 02:15 PM',
    versions: [
      { version: 1, editor: 'AI Auto-Draft', date: '2026-07-15 04:12 PM' },
      { version: 2, editor: 'Supervisor Officer', date: '2026-07-16 02:15 PM' }
    ]
  }
]

export const FIRWorkspacePage: React.FC = () => {
  const [firs, setFirs] = useState<FIRRecord[]>(mockFIRs)
  const [selectedFir, setSelectedFir] = useState<FIRRecord | null>(mockFIRs[0])
  const [isEditing, setIsEditing] = useState(false)
  const [editDraftText, setEditDraftText] = useState('')
  const [digitalSig, setDigitalSig] = useState('')
  const [isSigApproved, setIsSigApproved] = useState(false)

  const handleEditStart = () => {
    if (!selectedFir) return
    setEditDraftText(selectedFir.draft_text)
    setIsEditing(true)
  }

  const handleEditSave = () => {
    if (!selectedFir) return
    const updatedVersions = [
      ...selectedFir.versions,
      { version: selectedFir.versions.length + 1, editor: 'Investigator Priyanshu', date: new Date().toISOString().substring(0, 16).replace('T', ' ') }
    ]
    const updated = {
      ...selectedFir,
      draft_text: editDraftText,
      versions: updatedVersions,
      last_modified: new Date().toISOString().substring(0, 16).replace('T', ' ')
    }
    setFirs(prev => prev.map(f => f.id === selectedFir.id ? updated : f))
    setSelectedFir(updated)
    setIsEditing(false)
  }

  const handleApprove = () => {
    if (!selectedFir || !digitalSig.trim()) return
    const updated = {
      ...selectedFir,
      status: 'Registered' as const,
      last_modified: new Date().toISOString().substring(0, 16).replace('T', ' ')
    }
    setFirs(prev => prev.map(f => f.id === selectedFir.id ? updated : f))
    setSelectedFir(updated)
    setIsSigApproved(true)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Registered': return <Badge status="success">REGISTERED</Badge>
      case 'Pending Approval': return <Badge status="warning">PENDING APPROVAL</Badge>
      default: return <Badge status="info">{status}</Badge>
    }
  }

  const handlePrint = () => {
    if (!selectedFir) return

    // Create a hidden iframe for isolated print context
    const iframe = document.createElement('iframe')
    iframe.style.position = 'fixed'
    iframe.style.right = '0'
    iframe.style.bottom = '0'
    iframe.style.width = '0'
    iframe.style.height = '0'
    iframe.style.border = '0'
    document.body.appendChild(iframe)

    const doc = iframe.contentWindow?.document
    if (!doc) return

    doc.open()
    doc.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>FIR_${selectedFir.id}</title>
        <style>
          body {
            font-family: 'Times New Roman', Times, serif;
            color: #000000;
            background: #ffffff;
            margin: 40px;
            padding: 0;
            line-height: 1.6;
            font-size: 14px;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px double #000000;
            padding-bottom: 15px;
          }
          .logo {
            width: 70px;
            height: auto;
            margin-bottom: 8px;
          }
          .gov-title {
            font-size: 18px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin: 4px 0;
          }
          .dept-title {
            font-size: 13px;
            font-weight: bold;
            margin: 4px 0;
          }
          .doc-title {
            font-size: 19px;
            font-weight: bold;
            text-decoration: underline;
            margin-top: 15px;
            letter-spacing: 0.5px;
          }
          .info-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 25px;
            margin-top: 20px;
          }
          .info-table th, .info-table td {
            border: 1px solid #000000;
            padding: 8px 12px;
            text-align: left;
            vertical-align: top;
            font-size: 13px;
          }
          .info-table th {
            background-color: #f2f2f2;
            font-weight: bold;
            width: 32%;
          }
          .narrative-box {
            border: 1px solid #000000;
            padding: 15px;
            min-height: 200px;
            white-space: pre-wrap;
            font-family: 'Courier New', Courier, monospace;
            font-size: 13px;
            background-color: #fafafa;
            margin-bottom: 30px;
            line-height: 1.7;
          }
          .signature-section {
            display: flex;
            justify-content: space-between;
            margin-top: 60px;
          }
          .signature-block {
            text-align: center;
            width: 240px;
          }
          .stamp-box {
            border: 2px solid #16a34a;
            color: #16a34a;
            border-radius: 6px;
            padding: 4px 10px;
            font-weight: bold;
            text-transform: uppercase;
            font-size: 10px;
            display: inline-block;
            margin-top: 8px;
            letter-spacing: 1px;
            transform: rotate(-2deg);
          }
          .watermark {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-45deg);
            font-size: 70px;
            font-weight: bold;
            color: rgba(0, 0, 0, 0.025);
            white-space: nowrap;
            pointer-events: none;
            z-index: -1;
          }
        </style>
      </head>
      <body>
        <div class="watermark">AIPAS OFFICIAL RECORD</div>
        <div class="header">
          <img class="logo" src="https://upload.wikimedia.org/wikipedia/commons/5/55/Emblem_of_India.svg" alt="Emblem of India" />
          <div class="gov-title">Government of India</div>
          <div class="dept-title">Ministry of Home Affairs &bull; Delhi Police Department</div>
          <div class="dept-title">South Delhi District &bull; Sector 18 Police Precinct</div>
          <div class="doc-title">FIRST INFORMATION REPORT (FIR)</div>
          <div style="font-size: 11px; margin-top: 6px; font-style: italic;">
            (Registered under Section 173 of the Bharatiya Nagarik Suraksha Sanhita, 2023 / Sec 154 CrPC)
          </div>
        </div>

        <table class="info-table">
          <tr>
            <th>1. FIR Reference ID</th>
            <td><strong>${selectedFir.id.toUpperCase()}</strong></td>
          </tr>
          <tr>
            <th>2. Associated Case Code</th>
            <td>${selectedFir.case_number}</td>
          </tr>
          <tr>
            <th>3. Date & Time of Compilation</th>
            <td>${selectedFir.last_modified}</td>
          </tr>
          <tr>
            <th>4. Date & Time of Occurrence</th>
            <td>${selectedFir.incident_date}</td>
          </tr>
          <tr>
            <th>5. Primary Complainant</th>
            <td>${selectedFir.complainant}</td>
          </tr>
          <tr>
            <th>6. BNS Crime Classification Codes</th>
            <td>
              <ul style="margin: 0; padding-left: 20px;">
                ${selectedFir.sections.map(sec => `<li>${sec}</li>`).join('')}
              </ul>
            </td>
          </tr>
          <tr>
            <th>7. Current Registration Status</th>
            <td>${selectedFir.status.toUpperCase()}</td>
          </tr>
        </table>

        <div style="font-weight: bold; margin-bottom: 8px; font-size: 14px;">8. Details of Incident and Statement Narrative:</div>
        <div class="narrative-box">${selectedFir.draft_text}</div>

        <div class="signature-section">
          <div class="signature-block">
            <div style="font-style: italic; border-bottom: 1px dashed #000000; padding-bottom: 40px; margin-bottom: 5px;"></div>
            <div style="font-size: 11px;">Complainant Signature / Thumb Impression</div>
          </div>
          <div class="signature-block">
            <div style="border-bottom: 1px dashed #000000; padding-bottom: 5px; font-weight: bold; font-size: 12px; margin-bottom: 5px;">
              ${selectedFir.status === 'Registered' ? 'Digitally Signed by Duty Officer' : 'Pending Signature Authorization'}
            </div>
            <div style="font-size: 11px;">Registering Officer / Precinct Inspector</div>
            ${selectedFir.status === 'Registered' ? `
              <div class="stamp-box">
                AIPAS Secured<br/>
                Verified Seal
              </div>
            ` : ''}
          </div>
        </div>
      </body>
      </html>
    `)
    doc.close()

    iframe.contentWindow?.focus()
    setTimeout(() => {
      iframe.contentWindow?.print()
      setTimeout(() => {
        document.body.removeChild(iframe)
      }, 1000)
    }, 500)
  }

  return (
    <PageTransition className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>First Information Report (FIR) Workspace</h1>
          <p className={styles.subtitle}>AI-Assisted FIR Compilation, Sign-off & Printable Registry</p>
        </div>
      </div>

      <div className={styles.splitLayout}>
        {/* Left Side: Directory */}
        <div className={styles.listPanel}>
          <Card title="Active Case FIR Folders">
            <div className={styles.listGrid}>
              {firs.map(fir => (
                <div 
                  key={fir.id}
                  className={`${styles.listItem} ${selectedFir?.id === fir.id ? styles.listItemSelected : ''}`}
                  onClick={() => { setSelectedFir(fir); setIsEditing(false); setIsSigApproved(false); setDigitalSig('') }}
                >
                  <div>
                    <span className={styles.itemTitle}>FIR No: {fir.id}</span>
                    <div className={styles.itemMeta}>Case: {fir.case_number} | Complainant: {fir.complainant}</div>
                  </div>
                  {getStatusBadge(fir.status)}
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right Side: Editor/Viewer */}
        <div className={styles.detailsPanel}>
          {selectedFir ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <Card 
                title={`FIR Details - ${selectedFir.id}`}
                actions={
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Button variant="secondary" onClick={handlePrint} style={{ padding: '6px 12px', fontSize: '12px' }}>
                      <Printer size={14} style={{ marginRight: '6px' }} /> Print / Export
                    </Button>
                    {!isEditing && selectedFir.status !== 'Registered' && (
                      <Button onClick={handleEditStart} style={{ padding: '6px 12px', fontSize: '12px' }}>Edit Document</Button>
                    )}
                  </div>
                }
              >
                {isEditing ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <TextArea
                      id="firDraftEditor"
                      label="FIR Content Text"
                      value={editDraftText}
                      onChange={(e) => setEditDraftText(e.target.value)}
                      rows={14}
                    />
                    <div style={{ display: 'flex', gap: '8px', alignSelf: 'flex-end' }}>
                      <Button variant="secondary" onClick={() => setIsEditing(false)}>Cancel</Button>
                      <Button onClick={handleEditSave}>Save Revisions</Button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div className={styles.printableText}>{selectedFir.draft_text}</div>
                    
                    <div style={{ display: 'flex', gap: '24px', borderTop: '1px dashed var(--card-border)', paddingTop: '12px', fontSize: 'var(--text-xs)', color: 'var(--muted-foreground)' }}>
                      <span><strong>Last Revision:</strong> {selectedFir.last_modified}</span>
                      <span><strong>Supervisor:</strong> {selectedFir.supervisor || 'Unassigned'}</span>
                    </div>
                  </div>
                )}
              </Card>

              {/* Version History */}
              <Card title="Document Revision Timeline">
                <table style={{ width: '100%', fontSize: 'var(--text-xs)', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--card-border)', textAlign: 'left', color: 'var(--muted-foreground)' }}>
                      <th style={{ padding: '8px' }}>Version</th>
                      <th style={{ padding: '8px' }}>Editor Role</th>
                      <th style={{ padding: '8px' }}>Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedFir.versions.map((ver, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid var(--card-border)' }}>
                        <td style={{ padding: '8px', fontWeight: 'bold' }}>v{ver.version}</td>
                        <td style={{ padding: '8px' }}>{ver.editor}</td>
                        <td style={{ padding: '8px' }}>{ver.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>

              {/* Digital Signature & Approval Workspace */}
              {selectedFir.status !== 'Registered' && (
                <Card title="Digital Approval & Signature Pad">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--muted-foreground)' }}>
                      Enter your security credentials or signature key below to register the FIR officially in the digital record system.
                    </p>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
                      <Input
                        id="digitalSigInput"
                        label="Authorized Officer Digital Signature key"
                        placeholder="e.g. BADGE-10827-PRIYANSHU"
                        value={digitalSig}
                        onChange={(e) => setDigitalSig(e.target.value)}
                        style={{ flex: 1 }}
                      />
                      <Button onClick={handleApprove} disabled={!digitalSig.trim()}>
                        <CheckCircle size={14} style={{ marginRight: '8px' }} /> Register FIR
                      </Button>
                    </div>
                    {isSigApproved && (
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--success)', marginTop: '6px', fontWeight: 'bold' }}>
                        ✓ Document signed with key: {digitalSig}. Status changed to Registered.
                      </div>
                    )}
                  </div>
                </Card>
              )}
            </div>
          ) : (
            <EmptyState description="Select an FIR record to verify details." />
          )}
        </div>
      </div>
    </PageTransition>
  )
}
export default FIRWorkspacePage
