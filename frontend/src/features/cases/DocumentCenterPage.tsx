import React, { useState } from 'react'
import { FileText, Download, ShieldCheck, FileSignature } from 'lucide-react'
import { PageTransition, Card, Badge, Button, Input, Select, EmptyState, Timeline, TimelineItem, Dialog } from '@/design-system'
import { useToast } from '@/hooks/useToast'
import styles from './CasesPage.module.css'

interface DocFile {
  id: string
  title: string
  category: 'FIR' | 'Search Warrant' | 'Arrest Warrant' | 'Medical Report' | 'Lab Report' | 'Chargesheet'
  fileName: string
  fileSize: string
  created_at: string
  uploader: string
  signedBy?: string
  signedAt?: string
  caseNumber: string
  version: number
  hash: string
  versions: Array<{ version: number, hash: string, actor: string, date: string }>
}

const mockDocFiles: DocFile[] = [
  {
    id: 'doc1',
    title: 'First Information Report (FIR-2026-0812)',
    category: 'FIR',
    fileName: 'fir_robbery_sector18.pdf',
    fileSize: '1.8 MB',
    created_at: '2026-07-16 11:55 PM',
    uploader: 'Constable Verma',
    signedBy: 'Inspector Priyanshu',
    signedAt: '2026-07-17 09:10 AM',
    caseNumber: 'CASE-2026-0812',
    version: 2,
    hash: 'fa821acbe8120fa21bcd9ea02ab08f92109cf821',
    versions: [
      { version: 2, hash: 'fa821acbe8120fa21bcd9ea02ab08f92109cf821', actor: 'Inspector Priyanshu', date: '2026-07-17 09:10 AM' },
      { version: 1, hash: 'a12bc8f309d21ec89b120fa12ab89c2019ea812f', actor: 'Constable Verma', date: '2026-07-16 11:55 PM' }
    ]
  },
  {
    id: 'doc2',
    title: 'Trauma Examination Certificate - Amit Kumar',
    category: 'Medical Report',
    fileName: 'rml_hospital_trauma_sheet.pdf',
    fileSize: '3.2 MB',
    created_at: '2026-07-17 08:30 AM',
    uploader: 'Medical Tech Sharma',
    signedBy: 'Dr. S. K. Sen (RML Hospital)',
    signedAt: '2026-07-17 08:30 AM',
    caseNumber: 'CASE-2026-0812',
    version: 1,
    hash: '6a10c921be02af98b92dc012a9efc981eac812ab',
    versions: [
      { version: 1, hash: '6a10c921be02af98b92dc012a9efc981eac812ab', actor: 'Medical Tech Sharma', date: '2026-07-17 08:30 AM' }
    ]
  },
  {
    id: 'doc3',
    title: 'Badarpur Residential Premises Search Warrant',
    category: 'Search Warrant',
    fileName: 'search_warrant_badarpur.pdf',
    fileSize: '1.2 MB',
    created_at: '2026-07-17 11:00 AM',
    uploader: 'Inspector Priyanshu',
    signedBy: 'Magistrate Court No. 4',
    signedAt: '2026-07-17 11:00 AM',
    caseNumber: 'CASE-2026-0812',
    version: 1,
    hash: '3d9e812fc02a9bd08f92a1c2108acbe2019ea812',
    versions: [
      { version: 1, hash: '3d9e812fc02a9bd08f92a1c2108acbe2019ea812', actor: 'Inspector Priyanshu', date: '2026-07-17 11:00 AM' }
    ]
  },
  {
    id: 'doc4',
    title: 'Arrest Warrant - Accused Rahul Yadav',
    category: 'Arrest Warrant',
    fileName: 'arrest_warrant_rahul.pdf',
    fileSize: '1.5 MB',
    created_at: '2026-07-17 02:20 PM',
    uploader: 'Inspector Priyanshu',
    signedBy: 'Magistrate Court No. 4',
    signedAt: '2026-07-17 02:20 PM',
    caseNumber: 'CASE-2026-0812',
    version: 1,
    hash: 'efc212a9bcde81a2f9b8c7d6e5a4098fbacde823',
    versions: [
      { version: 1, hash: 'efc212a9bcde81a2f9b8c7d6e5a4098fbacde823', actor: 'Inspector Priyanshu', date: '2026-07-17 02:20 PM' }
    ]
  },
  {
    id: 'doc5',
    title: 'Draft BNS Chargesheet - Section 304',
    category: 'Chargesheet',
    fileName: 'chargesheet_draft_sec304.pdf',
    fileSize: '4.5 MB',
    created_at: '2026-07-18 10:10 AM',
    uploader: 'Inspector Priyanshu',
    caseNumber: 'CASE-2026-0812',
    version: 1,
    hash: 'a5c7f8e1d2c3b4a5908f9210c8eacbd20a81fe20',
    versions: [
      { version: 1, hash: 'a5c7f8e1d2c3b4a5908f9210c8eacbd20a81fe20', actor: 'Inspector Priyanshu', date: '2026-07-18 10:10 AM' }
    ]
  }
]

export const DocumentCenterPage: React.FC = () => {
  const { addToast } = useToast()
  const [docList, setDocList] = useState<DocFile[]>(mockDocFiles)
  const [selectedDoc, setSelectedDoc] = useState<DocFile | null>(mockDocFiles[0])

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('All')

  // Signing dialog state
  const [isSignOpen, setIsSignOpen] = useState(false)
  const [passcode, setPasscode] = useState('')

  const handleDownload = (doc: DocFile) => {
    addToast(`Initiated secure encrypted download: ${doc.fileName}`, 'success')
  }

  const handleSignDoc = () => {
    if (!selectedDoc) return
    if (!passcode.trim()) {
      addToast('Please enter your digital signature PIN.', 'error')
      return
    }

    setDocList(prev => prev.map(item => {
      if (item.id === selectedDoc.id) {
        const updated: DocFile = {
          ...item,
          signedBy: 'Inspector Priyanshu (Digitally Signed)',
          signedAt: new Date().toISOString().substring(0, 16).replace('T', ' ')
        }
        setSelectedDoc(updated)
        return updated
      }
      return item
    }))
    
    setIsSignOpen(false)
    setPasscode('')
    addToast(`Document digitally signed successfully.`, 'success')
  }

  const filteredDocs = docList.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          doc.caseNumber.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          doc.fileName.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCat = categoryFilter === 'All' || doc.category === categoryFilter
    return matchesSearch && matchesCat
  })

  return (
    <PageTransition className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Document Management Center</h1>
          <p className={styles.subtitle}>Secure Official Case Document Vault & Cryptographic Verification Registry</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24 }}>
        
        {/* Filters and search bar */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: 260 }}>
            <Input 
              id="docSearch"
              placeholder="Search by case code, document subject, filename..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ marginBottom: 0 }}
            />
          </div>
          <div style={{ minWidth: 180 }}>
            <Select 
              id="docCat"
              options={[
                { value: 'All', label: 'All Document Categories' },
                { value: 'FIR', label: 'First Information Reports' },
                { value: 'Search Warrant', label: 'Search Warrants' },
                { value: 'Arrest Warrant', label: 'Arrest Warrants' },
                { value: 'Medical Report', label: 'Medical Certificates' },
                { value: 'Lab Report', label: 'Forensic Lab Reports' },
                { value: 'Chargesheet', label: 'BNS Chargesheets' }
              ]}
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            />
          </div>
        </div>

        {/* Double column layout */}
        <div className={styles.splitLayout}>
          
          {/* Document list panel */}
          <div className={styles.listPanel}>
            <Card title="Document File Repositories">
              {filteredDocs.length === 0 ? (
                <EmptyState description="No official case files match your active filters." />
              ) : (
                <div className={styles.listGrid}>
                  {filteredDocs.map(doc => (
                    <div 
                      key={doc.id}
                      className={`${styles.listItem} ${selectedDoc?.id === doc.id ? styles.listItemSelected : ''}`}
                      onClick={() => setSelectedDoc(doc)}
                    >
                      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                        <div className={styles.itemIcon}><FileText size={18} /></div>
                        <div>
                          <span className={styles.itemTitle}>{doc.title}</span>
                          <div className={styles.itemMeta}>Case: {doc.caseNumber} | Size: {doc.fileSize}</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                        <Badge status={doc.signedBy ? 'success' : 'warning'}>
                          {doc.signedBy ? 'SIGNED' : 'DRAFT'}
                        </Badge>
                        <span style={{ fontSize: 9, color: 'var(--muted-foreground)' }}>V{doc.version}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Details & inspection tab panel */}
          <div className={styles.detailsPanel}>
            {selectedDoc ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                
                {/* Visual Digital Signature Banner */}
                <div style={{ 
                  padding: '12px 16px', 
                  borderRadius: '12px', 
                  border: `1px solid ${selectedDoc.signedBy ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
                  background: selectedDoc.signedBy ? 'rgba(16, 185, 129, 0.05)' : 'rgba(245, 158, 11, 0.05)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: 12
                }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <ShieldCheck size={20} color={selectedDoc.signedBy ? '#10b981' : '#f59e0b'} />
                    <div>
                      <strong>Digital Cryptographic Verification</strong>
                      <span style={{ display: 'block', color: 'var(--muted-foreground)', marginTop: 2 }}>
                        {selectedDoc.signedBy ? `Verified: ${selectedDoc.signedBy} on ${selectedDoc.signedAt}` : 'Requires verification signature to be admissible in court.'}
                      </span>
                    </div>
                  </div>
                  {!selectedDoc.signedBy && (
                    <Button onClick={() => setIsSignOpen(true)} style={{ padding: '6px 12px', fontSize: 11 }}>
                      <FileSignature size={12} style={{ marginRight: 6 }} /> Sign Document
                    </Button>
                  )}
                </div>

                {/* Metadata details inspector */}
                <Card title="Document Metadata Inspector">
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, fontSize: 'var(--text-sm)' }}>
                    <div>
                      <span style={{ color: 'var(--muted-foreground)', display: 'block', fontSize: 10 }}>Document Category</span>
                      <strong>{selectedDoc.category}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--muted-foreground)', display: 'block', fontSize: 10 }}>File Format Name</span>
                      <strong>{selectedDoc.fileName}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--muted-foreground)', display: 'block', fontSize: 10 }}>Associated Case Code</span>
                      <strong>{selectedDoc.caseNumber}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--muted-foreground)', display: 'block', fontSize: 10 }}>Uploaded By</span>
                      <strong>{selectedDoc.uploader}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--muted-foreground)', display: 'block', fontSize: 10 }}>Uploader Timestamp</span>
                      <strong>{selectedDoc.created_at}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--muted-foreground)', display: 'block', fontSize: 10 }}>Cryptographic Hash (SHA-256)</span>
                      <code style={{ fontSize: 9, wordBreak: 'break-all', backgroundColor: 'var(--muted)', padding: '2px 4px', borderRadius: 4 }}>{selectedDoc.hash}</code>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 12, marginTop: 20, borderTop: '1px dashed var(--card-border)', paddingTop: 16 }}>
                    <Button variant="secondary" onClick={() => handleDownload(selectedDoc)} style={{ flex: 1 }}>
                      <Download size={14} style={{ marginRight: 6 }} /> Secure Download File
                    </Button>
                  </div>
                </Card>

                {/* Document Version ledger */}
                <Card title="Document Version History">
                  <Timeline>
                    {selectedDoc.versions.map((v, idx) => (
                      <TimelineItem 
                        key={idx}
                        title={`Version ${v.version}`}
                        time={v.date}
                        description={`Modified by: ${v.actor} | SHA-256: ${v.hash.substring(0, 16)}…`}
                      />
                    ))}
                  </Timeline>
                </Card>

              </div>
            ) : (
              <EmptyState description="Select a document file from the vault to inspect details." />
            )}
          </div>

        </div>

      </div>

      {/* Digital Signature Dialog */}
      <Dialog
        isOpen={isSignOpen}
        onClose={() => setIsSignOpen(false)}
        title="Apply Digital Signature Key"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsSignOpen(false)}>Cancel Signature</Button>
            <Button onClick={handleSignDoc}>Verify & Sign</Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>
            This applies your secure digital token verification key under the IT Act 2000 and BNSS Section 531 guidelines.
          </p>
          <Input 
            id="passcode"
            type="password"
            label="Officer Cryptographic PIN Passcode"
            placeholder="Enter digital verification PIN"
            value={passcode}
            onChange={(e) => setPasscode(e.target.value)}
          />
        </div>
      </Dialog>
    </PageTransition>
  )
}
export default DocumentCenterPage
