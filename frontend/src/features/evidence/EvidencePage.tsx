import React, { useState } from 'react'
import { 
  FileText, Image, Video, Music, Sparkles, PlusCircle, 
  MapPin, ShieldCheck, Tag, RefreshCw, ArrowRight, 
  Check, X, ShieldAlert, FolderOpen, Table
} from 'lucide-react'
import { 
  PageTransition, Card, Badge, Button, Input, TextArea, 
  Select, Timeline, TimelineItem, Dialog, EmptyState 
} from '@/design-system'
import { useToast } from '@/hooks/useToast'
import styles from './EvidencePage.module.css'

interface CustodyLog {
  step: string
  actor: string
  date: string
  integrity: boolean
}

interface FileVersion {
  version: number
  hash: string
  date: string
  actor: string
}

interface EvidenceFile {
  id: string
  title: string
  case_number: string
  file_name: string
  file_size: string
  type: 'Image' | 'Video' | 'Audio' | 'Document' | 'CCTV' | 'Spreadsheet' | 'Archive'
  hash: string
  status: 'Uploaded' | 'Verified' | 'AI Processing' | 'Officer Reviewed' | 'Lab Verified' | 'Court Submitted' | 'Archived'
  uploaded_by: string
  uploaded_at: string
  gps_coordinates: string
  court_status: 'Admissible' | 'Pending Review' | 'Inadmissible'
  evidence_tags: string[]
  chain_of_custody: CustodyLog[]
  version_history: FileVersion[]
  ocr_text?: string
  transcription?: string
  detected_objects?: string[]
  detected_faces?: string[]
  detected_vehicles?: string[]
  translation_text?: string
  duplicate_reference?: string
  ai_confidence?: number
  human_approved?: boolean | null
}

const mockEvidenceList: EvidenceFile[] = [
  {
    id: 'e1',
    title: 'Incident Spot CCTV Clip',
    case_number: 'CASE-2026-0812',
    file_name: 'cctv_sector18_spot.mp4',
    file_size: '42.8 MB',
    type: 'CCTV',
    hash: '8f921a2c918c5082103a812e9bd0c821ea1082fc',
    status: 'Lab Verified',
    uploaded_by: 'Inspector Priyanshu',
    uploaded_at: '2026-07-16 11:42 PM',
    gps_coordinates: '28.5629° N, 77.2090° E',
    court_status: 'Admissible',
    evidence_tags: ['CCTV', 'Night Vision', 'Sector 18'],
    chain_of_custody: [
      { step: 'CCTV Feed Extracted from Spot Camera', actor: 'Constable Verma', date: '2026-07-16 11:20 PM', integrity: true },
      { step: 'Uploaded to Secure Storage Vault', actor: 'Inspector Priyanshu', date: '2026-07-16 11:42 PM', integrity: true },
      { step: 'Forensic Hash Verified Match', actor: 'Lab Lead Malhotra', date: '2026-07-17 09:15 AM', integrity: true }
    ],
    version_history: [
      { version: 2, hash: '8f921a2c918c5082103a812e9bd0c821ea1082fc', date: '2026-07-17 09:15 AM', actor: 'Lab Lead Malhotra' },
      { version: 1, hash: '1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t', date: '2026-07-16 11:42 PM', actor: 'Inspector Priyanshu' }
    ],
    detected_objects: ['White SUV', 'Iron Rod', 'Backpack'],
    detected_faces: ['Unknown Male (Match ID: FAC-9821)', 'Victim Amit Kumar'],
    detected_vehicles: ['White SUV (License Plate: DL-3C-AS-8812)'],
    ai_confidence: 94,
    human_approved: true
  },
  {
    id: 'e2',
    title: 'Assault Weapon (Iron Rod) Photo',
    case_number: 'CASE-2026-0812',
    file_name: 'recovered_iron_rod.jpg',
    file_size: '2.1 MB',
    type: 'Image',
    hash: '3d9e812fc02a9bd08f92a1c2108acbe2019ea812',
    status: 'Officer Reviewed',
    uploaded_by: 'Inspector Priyanshu',
    uploaded_at: '2026-07-17 09:20 AM',
    gps_coordinates: '28.5631° N, 77.2088° E',
    court_status: 'Pending Review',
    evidence_tags: ['Weapon', 'Fingerprints', 'Physical Spot'],
    chain_of_custody: [
      { step: 'Seized at Sector 18 Crossroads spot', actor: 'Constable Verma', date: '2026-07-16 11:05 PM', integrity: true },
      { step: 'Logged & Photographed', actor: 'Inspector Priyanshu', date: '2026-07-17 09:20 AM', integrity: true }
    ],
    version_history: [
      { version: 1, hash: '3d9e812fc02a9bd08f92a1c2108acbe2019ea812', date: '2026-07-17 09:20 AM', actor: 'Inspector Priyanshu' }
    ],
    detected_objects: ['Metal Rod', 'Blood Stains', 'Cloth Fiber'],
    ai_confidence: 98,
    human_approved: null
  },
  {
    id: 'e3',
    title: 'Victim Statement Audio Recording',
    case_number: 'CASE-2026-0812',
    file_name: 'amit_kumar_statement.wav',
    file_size: '14.5 MB',
    type: 'Audio',
    hash: '6a10c921be02af98b92dc012a9efc981eac812ab',
    status: 'Verified',
    uploaded_by: 'Inspector Priyanshu',
    uploaded_at: '2026-07-17 10:15 AM',
    gps_coordinates: '28.5621° N, 77.2104° E',
    court_status: 'Admissible',
    evidence_tags: ['Statement', 'Audio Record', 'Victim Statement'],
    chain_of_custody: [
      { step: 'Audio Statement Recorded in Hospital Ward', actor: 'Inspector Priyanshu', date: '2026-07-17 10:00 AM', integrity: true },
      { step: 'Uploaded to Case File', actor: 'Inspector Priyanshu', date: '2026-07-17 10:15 AM', integrity: true }
    ],
    version_history: [
      { version: 1, hash: '6a10c921be02af98b92dc012a9efc981eac812ab', date: '2026-07-17 10:15 AM', actor: 'Inspector Priyanshu' }
    ],
    transcription: 'I was returning from work when a white SUV blocked my path. Two men with iron rods got out... I resisted and was assaulted.',
    translation_text: 'I was returning from my office shifts when a white SUV vehicle blocked my way. Two individuals carrying metal bars came out and beat me.',
    ai_confidence: 96,
    human_approved: true
  },
  {
    id: 'e4',
    title: 'Phishing Threat Message Scan',
    case_number: 'CASE-2026-0941',
    file_name: 'extortion_letter_scan.pdf',
    file_size: '3.4 MB',
    type: 'Document',
    hash: 'a5c7f8e1d2c3b4a5908f9210c8eacbd20a81fe20',
    status: 'Uploaded',
    uploaded_by: 'Cyber Cell Detective',
    uploaded_at: '2026-07-18 01:10 PM',
    gps_coordinates: '28.6139° N, 77.2090° E',
    court_status: 'Pending Review',
    evidence_tags: ['Document', 'PDF', 'Extortion', 'Letter'],
    chain_of_custody: [
      { step: 'Extortion letter recovered from suspect bag', actor: 'Constable Sharma', date: '2026-07-18 10:30 AM', integrity: true },
      { step: 'Scanned and uploaded to Vault', actor: 'Cyber Cell Detective', date: '2026-07-18 01:10 PM', integrity: true }
    ],
    version_history: [
      { version: 1, hash: 'a5c7f8e1d2c3b4a5908f9210c8eacbd20a81fe20', date: '2026-07-18 01:10 PM', actor: 'Cyber Cell Detective' }
    ],
    ocr_text: 'NOTICE OF EXTORTION:\nPay the sum of ₹5,00,000 to the specified Bitcoin wallet address before 20th July or face severe consequences for your establishment. This is your final warning.',
    ai_confidence: 99,
    human_approved: null
  },
  {
    id: 'e5',
    title: 'Phishing Wallet Transactions Grid',
    case_number: 'CASE-2026-0941',
    file_name: 'transaction_ledger.xlsx',
    file_size: '1.2 MB',
    type: 'Spreadsheet',
    hash: 'efc212a9bcde81a2f9b8c7d6e5a4098fbacde823',
    status: 'Verified',
    uploaded_by: 'Cyber Cell Detective',
    uploaded_at: '2026-07-18 02:40 PM',
    gps_coordinates: 'N/A (Virtual Network)',
    court_status: 'Admissible',
    evidence_tags: ['Transaction', 'Excel', 'Ledger', 'Bitcoin'],
    chain_of_custody: [
      { step: 'Downloaded Blockchain Ledger from Public Explorer', actor: 'Cyber Cell Analyst', date: '2026-07-18 02:15 PM', integrity: true },
      { step: 'Compiled and Uploaded spreadsheet', actor: 'Cyber Cell Detective', date: '2026-07-18 02:40 PM', integrity: true }
    ],
    version_history: [
      { version: 1, hash: 'efc212a9bcde81a2f9b8c7d6e5a4098fbacde823', date: '2026-07-18 02:40 PM', actor: 'Cyber Cell Detective' }
    ],
    ocr_text: 'TRANSACTION LISTING:\n- Txn: 0x82f1... Dest: Wallet_Alpha, Amount: 1.25 BTC (Flagged)\n- Txn: 0x9a3c... Dest: Wallet_Beta, Amount: 3.42 BTC (Flagged)\n- Txn: 0x7c1a... Dest: Wallet_Gamma, Amount: 0.12 BTC (Unflagged)',
    ai_confidence: 95,
    human_approved: null
  }
]

export const EvidencePage: React.FC = () => {
  const { addToast } = useToast()
  const [evidenceList, setEvidenceList] = useState<EvidenceFile[]>(mockEvidenceList)
  const [selectedFile, setSelectedFile] = useState<EvidenceFile | null>(mockEvidenceList[0])
  
  // Pipeline Processing state
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingProgress, setProcessingProgress] = useState(0)
  const [processingLog, setProcessingLog] = useState('')

  // Transfer Custody state
  const [isTransferOpen, setIsTransferOpen] = useState(false)
  const [transferDest, setTransferDest] = useState('Forensics Lab')
  const [transferActor, setTransferActor] = useState('Director Roy')

  // Form states for simulated upload
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [caseNum, setCaseNum] = useState('')
  const [fileType, setFileType] = useState('Image')
  const [gpsInput, setGpsInput] = useState('')
  const [desc, setDesc] = useState('')

  const handleUploadSubmit = () => {
    if (!title.trim() || !caseNum.trim()) {
      addToast('Please enter title and case number.', 'error')
      return
    }
    const newId = `e${evidenceList.length + 1}`
    const nowStr = new Date().toISOString().substring(0, 16).replace('T', ' ')
    const randomHash = Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join('')
    
    const newEv: EvidenceFile = {
      id: newId,
      title,
      case_number: caseNum.toUpperCase(),
      file_name: `${title.toLowerCase().replace(/\s+/g, '_')}_upload.${fileType === 'Document' ? 'pdf' : fileType === 'Spreadsheet' ? 'xlsx' : fileType === 'Archive' ? 'zip' : 'bin'}`,
      file_size: '2.5 MB',
      type: fileType as any,
      hash: randomHash,
      status: 'Uploaded',
      uploaded_by: 'Inspector Priyanshu',
      uploaded_at: nowStr,
      gps_coordinates: gpsInput.trim() || 'N/A',
      court_status: 'Pending Review',
      evidence_tags: [fileType, 'Upload'],
      chain_of_custody: [
        { step: 'Uploaded to AIPAS Storage', actor: 'Inspector Priyanshu', date: nowStr, integrity: true }
      ],
      version_history: [
        { version: 1, hash: randomHash, date: nowStr, actor: 'Inspector Priyanshu' }
      ],
      ai_confidence: 90,
      human_approved: null
    }

    // Set mock data based on type
    if (fileType === 'Audio') {
      newEv.transcription = 'Simulated transcription of voice logs.'
    } else if (fileType === 'Document') {
      newEv.ocr_text = 'Simulated OCR text content from the uploaded scanned document.'
    }
    
    setEvidenceList(prev => [...prev, newEv])
    setSelectedFile(newEv)
    setIsUploadOpen(false)
    setTitle('')
    setCaseNum('')
    setGpsInput('')
    setDesc('')
    addToast('New evidence file uploaded and registered successfully.', 'success')
  }

  const runAIPipeline = () => {
    if (!selectedFile) return
    setIsProcessing(true)
    setProcessingProgress(0)
    setProcessingLog('Initializing AI Analysis Pipeline…')

    const logs = [
      'Extracting file headers & properties…',
      'Calculating cryptographically secure SHA-256 integrity hash…',
      'Verifying digital signature validation keys…',
      'Executing OCR character extraction layers…',
      'Scanning audio frequencies for Speech-to-Text transcription…',
      'Executing Object Detection maps on visual grids…',
      'Verifying similarity index across similar case registries…',
      'AI Processing complete. Writing metadata results to file.'
    ]

    let logIndex = 0
    const interval = setInterval(() => {
      setProcessingProgress(p => {
        if (p >= 100) {
          clearInterval(interval)
          setTimeout(() => {
            setIsProcessing(false)
            setEvidenceList(prev => prev.map(item => {
              if (item.id === selectedFile.id) {
                const updated: EvidenceFile = {
                  ...item,
                  status: 'AI Processing',
                  detected_objects: item.detected_objects || ['Document Letterhead', 'Signature Ink', 'Timestamp Marker'],
                  ocr_text: item.ocr_text || 'AI OCR EXTRACTED TEXT:\nThis is simulated text extracted from scanning document headers.',
                  ai_confidence: 95
                }
                setSelectedFile(updated)
                return updated
              }
              return item
            }))
            addToast('AI Analysis pipeline execution complete!', 'success')
          }, 400)
          return 100
        }
        
        // Update logs every 15% progress
        const logPos = Math.floor((p / 100) * logs.length)
        if (logPos > logIndex && logPos < logs.length) {
          logIndex = logPos
          setProcessingLog(logs[logIndex])
        }

        return p + 8
      })
    }, 150)
  }

  const handleTransferSubmit = () => {
    if (!selectedFile) return
    const nowStr = new Date().toISOString().substring(0, 16).replace('T', ' ')
    
    setEvidenceList(prev => prev.map(item => {
      if (item.id === selectedFile.id) {
        const updatedLogs = [
          ...item.chain_of_custody,
          { 
            step: `Custody transferred to: ${transferDest}`, 
            actor: transferActor, 
            date: nowStr, 
            integrity: true 
          }
        ]
        const updated: EvidenceFile = {
          ...item,
          chain_of_custody: updatedLogs
        }
        setSelectedFile(updated)
        return updated
      }
      return item
    }))
    
    setIsTransferOpen(false)
    addToast(`Custody transferred to ${transferDest} successfully.`, 'success')
  }

  const handleRestoreVersion = (version: FileVersion) => {
    if (!selectedFile) return
    setEvidenceList(prev => prev.map(item => {
      if (item.id === selectedFile.id) {
        const updated: EvidenceFile = {
          ...item,
          hash: version.hash,
          uploaded_at: version.date,
          uploaded_by: version.actor
        }
        setSelectedFile(updated)
        return updated
      }
      return item
    }))
    addToast(`Restored to Version ${version.version} successfully.`, 'info')
  }

  const handleVerifyAI = (approved: boolean) => {
    if (!selectedFile) return
    setEvidenceList(prev => prev.map(item => {
      if (item.id === selectedFile.id) {
        const updated: EvidenceFile = {
          ...item,
          status: 'Officer Reviewed',
          human_approved: approved,
          court_status: approved ? 'Admissible' : 'Inadmissible'
        }
        setSelectedFile(updated)
        return updated
      }
      return item
    }))
    addToast(approved ? 'AI Analysis accepted and marked Admissible.' : 'AI Analysis rejected. Output marked Inadmissible.', approved ? 'success' : 'warning')
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'Image': return <Image size={18} />
      case 'Video': return <Video size={18} />
      case 'Audio': return <Music size={18} />
      case 'CCTV': return <Video size={18} />
      case 'Spreadsheet': return <Table size={18} />
      case 'Archive': return <FolderOpen size={18} />
      default: return <FileText size={18} />
    }
  }

  return (
    <PageTransition className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Digital Evidence Center</h1>
          <p className={styles.subtitle}>Enterprise Chain of Custody & File Intelligence Vault</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <Button onClick={() => setIsUploadOpen(true)}>
            <PlusCircle size={16} style={{ marginRight: '8px' }} /> Upload New Evidence
          </Button>
        </div>
      </div>

      {/* Main split dashboard layout */}
      <div className={styles.splitLayout}>
        {/* Left list panel */}
        <div className={styles.listPanel}>
          <Card title="Secure Vault Directories">
            <div className={styles.listGrid}>
              {evidenceList.map(item => (
                <div 
                  key={item.id} 
                  className={`${styles.listItem} ${selectedFile?.id === item.id ? styles.listItemSelected : ''}`}
                  onClick={() => setSelectedFile(item)}
                >
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <div className={styles.itemIcon}>{getIcon(item.type)}</div>
                    <div style={{ flex: 1 }}>
                      <span className={styles.itemTitle}>{item.title}</span>
                      <div className={styles.itemMeta}>Case: {item.case_number} | Size: {item.file_size}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                    <Badge status={
                      item.status === 'Lab Verified' ? 'success' : 
                      item.status === 'Officer Reviewed' ? 'info' : 
                      item.status === 'Verified' ? 'success' : 'warning'
                    }>
                      {item.status}
                    </Badge>
                    <span style={{ fontSize: 9, color: 'var(--muted-foreground)' }}>{item.type}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right workspace details panel */}
        <div className={styles.detailsPanel}>
          {selectedFile ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* Evidence High-Fidelity Previews */}
              <Card title="Asset Preview & Diagnostics">
                <div className={styles.previewBoxContainer}>
                  {selectedFile.type === 'Image' && (
                    <div className={styles.previewImageMock}>
                      <div className={styles.boundingTag} style={{ top: '35%', left: '42%' }}>Fingerprint Node (98% Match)</div>
                      <div className={styles.boundingTag} style={{ top: '65%', left: '30%', borderColor: '#ef4444', color: '#ef4444' }}>Stain Detected</div>
                      <Image size={40} className={styles.previewPlaceholderIcon} />
                      <span style={{ fontSize: 11, fontWeight: 'bold' }}>RECOVERED_IRON_ROD.JPG</span>
                    </div>
                  )}

                  {selectedFile.type === 'CCTV' && (
                    <div className={styles.previewVideoMock}>
                      <div className={styles.videoScanTracker} style={{ top: '25%', left: '20%', width: '120px', height: '80px' }}>
                        <span className={styles.trackerLabel}>WHITE SUV (DL-3C-AS-8812)</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', width: '92%', position: 'absolute', top: 12, left: 16, fontSize: 10, fontFamily: 'monospace', color: '#22c55e' }}>
                        <span>CAM_18_SEC18_CROSSROADS</span>
                        <span>LIVE TRACKING ENGAGED</span>
                      </div>
                      <Video size={40} className={styles.previewPlaceholderIcon} />
                      <div className={styles.videoControlsOverlay}>
                        <div style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: '#ef4444' }} />
                        <span>0:04 / 0:42</span>
                        <div style={{ flex: 1, height: 3, backgroundColor: 'rgba(255,255,255,0.2)', margin: '0 8px', borderRadius: 1.5 }}>
                          <div style={{ width: '10%', height: '100%', backgroundColor: 'var(--primary)' }} />
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedFile.type === 'Audio' && (
                    <div className={styles.previewAudioMock}>
                      <Music size={28} color="var(--primary)" />
                      <div className={styles.audioWaveform}>
                        {Array.from({ length: 28 }).map((_, idx) => {
                          const heights = [12, 28, 16, 40, 32, 10, 48, 22, 14, 38, 45, 12, 8, 24, 32, 16, 38, 24, 42, 12, 28, 35, 10, 18, 25, 12, 30, 8]
                          return (
                            <div 
                              key={idx} 
                              className={styles.audioBar} 
                              style={{ 
                                height: `${heights[idx % heights.length]}px`,
                                backgroundColor: idx < 8 ? 'var(--primary)' : 'rgba(255,255,255,0.15)'
                              }} 
                            />
                          )
                        })}
                      </div>
                      <span style={{ fontSize: 11, fontFamily: 'monospace' }}>0:12 / 1:28</span>
                    </div>
                  )}

                  {selectedFile.type === 'Document' && (
                    <div className={styles.previewDocMock}>
                      <div className={styles.docHeaderLine}>MOCK DIGITAL DOCUMENT PREVIEW</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%', padding: '0 12px' }}>
                        <div style={{ height: 10, width: '90%', backgroundColor: 'var(--card-border)' }} />
                        <div style={{ height: 10, width: '80%', backgroundColor: 'var(--card-border)' }} />
                        <div style={{ height: 10, width: '95%', backgroundColor: 'var(--card-border)' }} />
                        <div style={{ height: 10, width: '60%', backgroundColor: 'var(--card-border)' }} />
                      </div>
                    </div>
                  )}

                  {selectedFile.type === 'Spreadsheet' && (
                    <div className={styles.previewSpreadsheetMock}>
                      <table className={styles.excelTable}>
                        <thead>
                          <tr>
                            <th>TIMESTAMP</th>
                            <th>TXN_SOURCE</th>
                            <th>TXN_DEST</th>
                            <th>VAL_INR</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td>12:10:45</td>
                            <td>0xWallet_A</td>
                            <td>0xWallet_B</td>
                            <td>₹45,000</td>
                          </tr>
                          <tr>
                            <td>12:12:02</td>
                            <td>0xWallet_C</td>
                            <td>0xWallet_B</td>
                            <td>₹1,20,000</td>
                          </tr>
                          <tr>
                            <td>12:18:14</td>
                            <td>0xWallet_D</td>
                            <td>0xWallet_A</td>
                            <td>₹5,000</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )}

                  {selectedFile.type === 'Archive' && (
                    <div className={styles.previewArchiveMock}>
                      <FolderOpen size={24} color="#f59e0b" />
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '80%' }}>
                        <div className={styles.archiveFileRow}><FileText size={10} /> incident_report_final.doc (420 KB)</div>
                        <div className={styles.archiveFileRow}><Image size={10} /> scene_photo_1.png (1.2 MB)</div>
                        <div className={styles.archiveFileRow}><Video size={10} /> dashcam_raw_feed.mp4 (45 MB)</div>
                      </div>
                    </div>
                  )}
                </div>
              </Card>

              {/* Main Metadata and Status Panel */}
              <Card title="Asset Properties & Chain of Custody">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  
                  {/* Left Column: Properties */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: 'var(--text-sm)' }}>
                    <div>
                      <span style={{ color: 'var(--muted-foreground)', display: 'block', fontSize: 11 }}>File Name</span>
                      <strong>{selectedFile.file_name}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--muted-foreground)', display: 'block', fontSize: 11 }}>SHA-256 Integrity Hash</span>
                      <code className={styles.hashBlock}>{selectedFile.hash}</code>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div>
                        <span style={{ color: 'var(--muted-foreground)', display: 'block', fontSize: 11 }}>GPS Spot Tag</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <MapPin size={12} color="var(--primary)" />
                          <strong>{selectedFile.gps_coordinates}</strong>
                        </div>
                      </div>
                      <div>
                        <span style={{ color: 'var(--muted-foreground)', display: 'block', fontSize: 11 }}>Court Admissibility</span>
                        <div style={{ marginTop: 2 }}>
                          <Badge status={
                            selectedFile.court_status === 'Admissible' ? 'success' : 
                            selectedFile.court_status === 'Pending Review' ? 'warning' : 'danger'
                          }>
                            {selectedFile.court_status}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div>
                      <span style={{ color: 'var(--muted-foreground)', display: 'block', fontSize: 11 }}>Evidence Keywords / Tags</span>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
                        {selectedFile.evidence_tags.map(t => (
                          <Badge key={t} status="info">{t}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Custody Lifecycle */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: 'var(--muted-foreground)', fontSize: 11, fontWeight: 600 }}>Evidence Lifecycle Timeline</span>
                      <Button variant="secondary" onClick={() => setIsTransferOpen(true)} style={{ padding: '4px 10px', fontSize: 11 }}>
                        <ArrowRight size={12} style={{ marginRight: 4 }} /> Transfer Custody
                      </Button>
                    </div>

                    <div className={styles.lifecycleBar}>
                      {['Uploaded', 'Verified', 'AI Processing', 'Lab Verified', 'Court Submitted'].map((stage, idx) => {
                        const stages = ['Uploaded', 'Verified', 'AI Processing', 'Lab Verified', 'Court Submitted'];
                        const activeIdx = stages.indexOf(selectedFile.status);
                        const isDone = activeIdx >= idx;
                        const isCurrent = activeIdx === idx;
                        return (
                          <div key={stage} className={styles.lifecycleNode}>
                            <div className={`${styles.lifecycleIndicator} ${isDone ? styles.lifecycleIndicatorDone : ''} ${isCurrent ? styles.lifecycleIndicatorCurrent : ''}`}>
                              {isDone ? <Check size={10} /> : idx + 1}
                            </div>
                            <span className={styles.lifecycleLabel}>{stage}</span>
                          </div>
                        )
                      })}
                      <div className={styles.lifecycleConnector} />
                    </div>

                    <div style={{ marginTop: 'auto', padding: '10px 14px', borderRadius: '8px', background: 'var(--muted)', border: '1px solid var(--card-border)', display: 'flex', alignItems: 'center', gap: 10 }}>
                      <ShieldCheck size={16} color="#10b981" style={{ flexShrink: 0 }} />
                      <div style={{ fontSize: 11, lineHeight: 1.4 }}>
                        <strong>Integrity Verification: PASS</strong><br/>
                        SHA-256 match confirmed. Chain custody trace contains zero unauthorized deletions.
                      </div>
                    </div>
                  </div>

                </div>
              </Card>

              {/* AI Analysis Terminal */}
              <Card title="AIPAS AI Analysis Terminal">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {isProcessing ? (
                    <div className={styles.terminalLoader}>
                      <RefreshCw size={24} className={styles.spinIcon} />
                      <strong style={{ fontSize: 13 }}>Executing Script Pipeline… {processingProgress}%</strong>
                      <span style={{ fontSize: 11, color: 'var(--muted-foreground)', fontFamily: 'monospace' }}>{processingLog}</span>
                      <div className={styles.progressBarBg}>
                        <div className={styles.progressBarFill} style={{ width: `${processingProgress}%` }} />
                      </div>
                    </div>
                  ) : (
                    <div style={{ fontSize: 'var(--text-xs)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      
                      {/* OCR and speech logs */}
                      {selectedFile.ocr_text && (
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                            <strong>AI OCR Text Extraction ({selectedFile.ai_confidence || 95}% Confidence)</strong>
                            <Badge status="info">Tesseract Engine</Badge>
                          </div>
                          <div className={styles.extractedTextContainer}>
                            {selectedFile.ocr_text}
                          </div>
                        </div>
                      )}

                      {selectedFile.transcription && (
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                            <strong>AI Speech-to-Text Transcription ({selectedFile.ai_confidence || 95}% Confidence)</strong>
                            <Badge status="info">Whisper v3 Engine</Badge>
                          </div>
                          <div className={styles.extractedTextContainer} style={{ fontStyle: 'italic' }}>
                            "{selectedFile.transcription}"
                          </div>
                          {selectedFile.translation_text && (
                            <div style={{ marginTop: 8 }}>
                              <strong>AI Translation (English Standard):</strong>
                              <div className={styles.extractedTextContainer} style={{ borderStyle: 'dashed', marginTop: 4 }}>
                                {selectedFile.translation_text}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Vision Detections */}
                      {(selectedFile.detected_objects || selectedFile.detected_faces || selectedFile.detected_vehicles) && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', borderTop: '1px dashed var(--card-border)', paddingTop: '12px' }}>
                          <div>
                            <strong>Object & Concept Tags:</strong>
                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px' }}>
                              {(selectedFile.detected_objects || []).map(obj => (
                                <Badge key={obj} status="info">{obj}</Badge>
                              ))}
                            </div>
                          </div>
                          <div>
                            <strong>Biometric Faces / Vehicles Maps:</strong>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: '6px' }}>
                              {(selectedFile.detected_faces || []).map(face => (
                                <div key={face} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
                                  <ShieldAlert size={10} color="var(--primary)" /> {face}
                                </div>
                              ))}
                              {(selectedFile.detected_vehicles || []).map(veh => (
                                <div key={veh} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
                                  <Tag size={10} color="#10b981" /> {veh}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Similarity & Duplicate checking */}
                      {selectedFile.status !== 'Uploaded' && (
                        <div style={{ padding: '8px 12px', borderRadius: '8px', backgroundColor: 'rgba(37,99,235,0.06)', border: '1px solid rgba(37,99,235,0.2)', fontSize: 11, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <strong>Duplicate Similarity Analyzer:</strong>
                            <span style={{ display: 'block', color: 'var(--muted-foreground)', marginTop: 2 }}>No matching duplicate evidence files detected inside active station folders. Similarity Index: 0.12</span>
                          </div>
                          <Badge status="success">UNIQUE</Badge>
                        </div>
                      )}

                      {/* Verification Overrides */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--card-border)', paddingTop: '14px', marginTop: 8 }}>
                        <div>
                          <strong style={{ display: 'block', fontSize: 12 }}>Human Officer Verification Status:</strong>
                          <span style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>
                            {selectedFile.human_approved === true ? '✓ Accepted by Inspector Priyanshu' : 
                             selectedFile.human_approved === false ? '✗ Rejected / Overridden by Inspector' : 
                             'Pending human approval verification.'}
                          </span>
                        </div>
                        
                        <div style={{ display: 'flex', gap: 8 }}>
                          {selectedFile.status === 'Uploaded' ? (
                            <Button onClick={runAIPipeline}>
                              <Sparkles size={14} style={{ marginRight: 6 }} /> Run AI Pipeline
                            </Button>
                          ) : (
                            <>
                              <Button 
                                variant="secondary" 
                                style={{ borderColor: '#ef4444', color: '#ef4444', background: 'none' }}
                                onClick={() => handleVerifyAI(false)}
                              >
                                <X size={14} style={{ marginRight: 6 }} /> Reject AI Output
                              </Button>
                              <Button onClick={() => handleVerifyAI(true)}>
                                <Check size={14} style={{ marginRight: 6 }} /> Accept AI Output
                              </Button>
                            </>
                          )}
                        </div>
                      </div>

                    </div>
                  )}
                </div>
              </Card>

              {/* Version History ledger */}
              <Card title="Secure File Version History">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <table className={styles.excelTable} style={{ fontSize: 11 }}>
                    <thead>
                      <tr>
                        <th>Version</th>
                        <th>File Hash Integrity</th>
                        <th>Modification Date</th>
                        <th>Modified By</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedFile.version_history.map(v => (
                        <tr key={v.version} style={{ fontWeight: v.hash === selectedFile.hash ? 'bold' : 'normal' }}>
                          <td>V{v.version} {v.hash === selectedFile.hash && <span style={{ color: 'var(--primary)', fontSize: 9 }}>(Active)</span>}</td>
                          <td><code>{v.hash.substring(0, 16)}…</code></td>
                          <td>{v.date}</td>
                          <td>{v.actor}</td>
                          <td style={{ textAlign: 'right' }}>
                            <Button 
                              variant="secondary" 
                              disabled={v.hash === selectedFile.hash} 
                              onClick={() => handleRestoreVersion(v)} 
                              style={{ padding: '3px 8px', fontSize: 10 }}
                            >
                              Restore
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>

              {/* Chain of Custody logs */}
              <Card title="Chain of Custody Transfer Logs">
                <Timeline>
                  {selectedFile.chain_of_custody.map((step, idx) => (
                    <TimelineItem 
                      key={idx}
                      title={step.step}
                      time={step.date}
                      description={`Authorized Officer: ${step.actor} | Hash integrity check: Valid`}
                    />
                  ))}
                </Timeline>
              </Card>

            </div>
          ) : (
            <EmptyState description="Select an evidence file from the vault to inspect details." />
          )}
        </div>
      </div>

      {/* Upload Dialog Modal */}
      <Dialog
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        title="Register & Upload Digital Evidence File"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsUploadOpen(false)}>Cancel</Button>
            <Button onClick={handleUploadSubmit}>Upload and Hash</Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Input 
            id="title"
            label="Evidence Title"
            placeholder="e.g. CCTV recording from crossroads"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <Input 
              id="caseNum"
              label="Assigned Case Number"
              placeholder="e.g. CASE-2026-0812"
              value={caseNum}
              onChange={(e) => setCaseNum(e.target.value)}
            />
            <Input 
              id="gpsInput"
              label="GPS Spot Coordinates (Optional)"
              placeholder="e.g. 28.5629° N, 77.2090° E"
              value={gpsInput}
              onChange={(e) => setGpsInput(e.target.value)}
            />
          </div>
          <Select 
            id="fileType"
            label="Evidence Category Type"
            options={[
              { value: 'Image', label: 'Photograph / Image' },
              { value: 'Video', label: 'CCTV / Video Clip' },
              { value: 'Audio', label: 'Witness Audio Statement' },
              { value: 'Document', label: 'Scanned Document (PDF/Word)' },
              { value: 'Spreadsheet', label: 'Transaction Excel File' },
              { value: 'Archive', label: 'Forensic ZIP Archive' }
            ]}
            value={fileType}
            onChange={(e) => setFileType(e.target.value)}
          />
          <TextArea 
            id="desc"
            label="Capture Description Notes"
            placeholder="Write description details..."
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
          />
        </div>
      </Dialog>

      {/* Transfer Custody Modal */}
      <Dialog
        isOpen={isTransferOpen}
        onClose={() => setIsTransferOpen(false)}
        title="Transfer Custody & Log Handover"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsTransferOpen(false)}>Cancel Handover</Button>
            <Button onClick={handleTransferSubmit}>Authorize Transfer</Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <p style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>
            This logs a secure chain of custody transfer. Both parties will be authenticated and cryptographic hashes re-evaluated.
          </p>
          <Select 
            id="transferDest"
            label="Destination Division / Unit"
            options={[
              { value: 'Forensics Lab', label: 'PS Sector 18 Forensics Lab' },
              { value: 'Crime Branch HQ', label: 'Delhi Police Crime Branch HQ' },
              { value: 'District Magistrate Court', label: 'South Delhi District Court' },
              { value: 'Cyber Intelligence Unit', label: 'Cyber Intelligence Unit' }
            ]}
            value={transferDest}
            onChange={(e) => setTransferDest(e.target.value)}
          />
          <Input 
            id="transferActor"
            label="Receiving Officer / Custodian Name"
            placeholder="e.g. Director Malhotra"
            value={transferActor}
            onChange={(e) => setTransferActor(e.target.value)}
          />
        </div>
      </Dialog>

    </PageTransition>
  )
}
export default EvidencePage
