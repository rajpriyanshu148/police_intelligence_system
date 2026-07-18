import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Shield, FileText, Search, Activity, Users, Radio, 
  MapPin, Cloud, Bell, KeyRound, Cpu, 
  ShieldAlert, Globe, Calendar, Wifi, TrendingUp,
  BarChart2, CheckSquare
} from 'lucide-react'
import { PageTransition, KPICard, Card, Badge, Skeleton, Button } from '@/design-system'
import { useDashboardSummary } from './hooks/useDashboard'
import { useAuth } from '@/hooks/useAuth'
import styles from './DashboardPage.module.css'

type SimulatedRole = 'CITIZEN' | 'CONSTABLE' | 'INSPECTOR' | 'CYBER_CELL' | 'CRIME_BRANCH' | 'SUPERVISOR' | 'ADMIN' | 'COMMAND_CENTER'

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { isLoading, isError, refetch } = useDashboardSummary()
  
  // Local role override to allow users to demo different policing perspectives
  const [activeRole, setActiveRole] = useState<SimulatedRole>((user?.role as any) || 'COMMAND_CENTER')

  // Map click selector state
  const [selectedSector, setSelectedSector] = useState<string | null>('Sector 18 (Robbery Hotspot)')

  if (isLoading) {
    return (
      <div className={styles.dashboardContainer}>
        <div className={styles.dashboardHeader}>
          <div>
            <Skeleton width="200px" height="32px" />
            <Skeleton width="300px" height="18px" className="mt-2" />
          </div>
        </div>
        <div className={styles.kpiGrid}>
          {Array.from({ length: 4 }).map((_, idx) => (
            <Skeleton key={idx} height="120px" borderRadius="var(--radius-lg)" />
          ))}
        </div>
        <div className={styles.dashboardSection}>
          <Skeleton height="300px" borderRadius="var(--radius-lg)" />
          <Skeleton height="300px" borderRadius="var(--radius-lg)" />
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h2 style={{ color: 'var(--danger)', marginBottom: '16px' }}>Dashboard Connection Error</h2>
        <p style={{ color: 'var(--muted-foreground)', marginBottom: '24px' }}>
          Failed to fetch real-time database summary from API server.
        </p>
        <Button onClick={() => refetch()}>Retry Connection</Button>
      </div>
    )
  }

  // Quick action directories
  const quickActions = [
    { label: 'Register Complaint', icon: <FileText size={18} />, onClick: () => navigate('/complaints') },
    { label: 'Case Registry', icon: <Shield size={18} />, onClick: () => navigate('/cases') },
    { label: 'Evidence Vault', icon: <Globe size={18} />, onClick: () => navigate('/evidence') },
    { label: 'FIR Workspace', icon: <KeyRound size={18} />, onClick: () => navigate('/firs') },
    { label: 'Global Search', icon: <Search size={18} />, onClick: () => navigate('/search') },
    { label: 'System Auditing', icon: <Activity size={18} />, onClick: () => navigate('/telemetry') }
  ]

  return (
    <PageTransition className={styles.dashboardContainer}>
      {/* Dashboard Top Header */}
      <div className={styles.dashboardHeader}>
        <div>
          <h1 className={styles.dashboardTitle}>AIPAS Policing Cockpit</h1>
          <p className={styles.dashboardSubtitle}>
            AI-Powered Operations & Command Workspace · South Delhi Jurisdiction
          </p>
        </div>
        <Badge status="success">ONLINE</Badge>
      </div>

      {/* Role Switcher Demo Panel */}
      <div className={styles.roleSelectorBar}>
        <span className={styles.roleSelectorLabel}>Switch Workspace Perspective:</span>
        {(['COMMAND_CENTER', 'CITIZEN', 'CONSTABLE', 'INSPECTOR', 'CYBER_CELL', 'CRIME_BRANCH', 'SUPERVISOR', 'ADMIN'] as SimulatedRole[]).map(role => (
          <button
            key={role}
            className={`${styles.roleBtn} ${activeRole === role ? styles.roleBtnActive : ''}`}
            onClick={() => setActiveRole(role)}
          >
            {role.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Render selected workspace perspective */}
      
      {/* 1. COMMAND CENTER (OPERATIONAL DASHBOARD) */}
      {activeRole === 'COMMAND_CENTER' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className={styles.kpiGrid}>
            <KPICard label="Live Dispatch Calls" value="4 Active" icon={<Radio size={24} color="var(--danger)" />} subtext="Emergency SOS triggers" />
            <KPICard label="On-Duty Patrols" value="12 Officers" icon={<Users size={24} color="var(--primary)" />} subtext="Active GPS beacons" />
            <KPICard label="Weather Advisory" value="Heavy Rain Warning" icon={<Cloud size={24} color="var(--warning)" />} subtext="Alert priority: High" />
            <KPICard label="AI Crime Prediction" value="Sector 18 snatches" icon={<ShieldAlert size={24} color="var(--accent)" />} subtext="Confidence: 89%" />
          </div>

          <div className={styles.commandCenterGrid}>
            {/* GIS Crime Map SVG */}
            <div className={styles.mapContainer}>
              <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-bold)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MapPin size={16} /> GIS Tactical Crime Map
              </h3>
              
              <svg className={styles.mapSvg} viewBox="0 0 600 350" width="100%">
                {/* Station Boundary lines */}
                <rect x="10" y="10" width="580" height="330" rx="15" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="2" />
                <path d="M 50,50 Q 300,100 550,50 L 500,300 Q 250,250 100,300 Z" fill="rgba(37,99,235,0.03)" stroke="rgba(37,99,235,0.2)" strokeWidth="1.5" />
                
                {/* Sector Divisions */}
                <line x1="250" y1="75" x2="200" y2="270" stroke="rgba(255,255,255,0.1)" strokeDasharray="4" />
                <line x1="100" y1="180" x2="520" y2="180" stroke="rgba(255,255,255,0.1)" strokeDasharray="4" />
                
                {/* Sector Labels */}
                <text x="140" y="100" fill="var(--muted-foreground)" fontSize="10">Sector 12 (Cyber Cell Area)</text>
                <text x="440" y="100" fill="var(--muted-foreground)" fontSize="10">Sector 18 (Crime Hotspot)</text>
                <text x="140" y="270" fill="var(--muted-foreground)" fontSize="10">Sector 24 (Residential)</text>
                <text x="440" y="270" fill="var(--muted-foreground)" fontSize="10">Sector 30 (Commercial)</text>

                {/* Hotspot radar circles */}
                <circle cx="450" cy="120" r="40" fill="rgba(239,68,68,0.05)" stroke="rgba(239,68,68,0.15)" />
                <circle cx="450" cy="120" r="20" fill="rgba(239,68,68,0.05)" stroke="rgba(239,68,68,0.3)" />
                <circle cx="450" cy="120" r="5" fill="#ef4444" style={{ cursor: 'pointer' }} onClick={() => setSelectedSector('Sector 18 (Robbery Hotspot)')} />

                {/* Active Patrol Marks */}
                <circle cx="180" cy="120" r="6" fill="#22c55e" style={{ cursor: 'pointer' }} onClick={() => setSelectedSector('Patrol Beacon: Constable Verma (Sector 12)')} />
                <circle cx="340" cy="220" r="6" fill="#22c55e" style={{ cursor: 'pointer' }} onClick={() => setSelectedSector('Patrol Beacon: Officer Sharma (Sector 30)')} />
                
                {/* Live SOS Call pulse */}
                <circle cx="420" cy="140" r="12" fill="none" stroke="#ef4444" strokeWidth="2">
                  <animate attributeName="r" values="5;15" dur="1.5s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="1;0" dur="1.5s" repeatCount="indefinite" />
                </circle>
                <circle cx="420" cy="140" r="4" fill="#ef4444" style={{ cursor: 'pointer' }} onClick={() => setSelectedSector('Active Emergency SOS: Complainant Amit Kumar (Sector 18)')} />
              </svg>

              {/* Map detail info overlay */}
              <div style={{ padding: '10px 14px', backgroundColor: 'var(--muted)', border: '1px solid var(--card-border)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-xs)' }}>
                <strong>Map Inspection Panel:</strong> {selectedSector || 'Click on any interactive node/marker on the map to audit live status details.'}
              </div>
            </div>

            {/* Right side: Live incident queue */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <Card title="Live Incident Dispatch Queue">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div className={`${styles.liveIncidentRow} ${styles.liveIncidentRowFlashing}`}>
                    <div>
                      <strong>Emergency SOS Call #109</strong>
                      <div style={{ color: 'var(--muted-foreground)', marginTop: '2px' }}>Location: Sector 18 Crossroads · Complainant: Amit Kumar</div>
                    </div>
                    <Badge status="danger">DISPATCHED</Badge>
                  </div>
                  <div className={styles.liveIncidentRow}>
                    <div>
                      <strong>Phishing Attack Logged</strong>
                      <div style={{ color: 'var(--muted-foreground)', marginTop: '2px' }}>Target IP: 192.168.1.44 · Category: Cyber fraud</div>
                    </div>
                    <Badge status="warning">AI SCANNING</Badge>
                  </div>
                  <div className={styles.liveIncidentRow} style={{ borderLeftColor: 'var(--primary)' }}>
                    <div>
                      <strong>Domestic Dispute report</strong>
                      <div style={{ color: 'var(--muted-foreground)', marginTop: '2px' }}>Address: House 280, Sector 24 · Constable Verma routed</div>
                    </div>
                    <Badge status="info">RESOLVED</Badge>
                  </div>
                </div>
              </Card>

              <Card title="Operational Alerts & Actions">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <Button variant="secondary" onClick={() => navigate('/complaints')}>Log Citizen Complaint</Button>
                  <Button variant="secondary" onClick={() => navigate('/search')}>Search Aadhaar Registry</Button>
                </div>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* 2. CITIZEN PORTAL */}
      {activeRole === 'CITIZEN' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className={styles.kpiGrid}>
            <KPICard label="My Active Complaints" value="1 Case" icon={<FileText size={24} color="var(--primary)" />} subtext="Status: Under Investigation" />
            <KPICard label="Assigned Station" value="PS Sector 18" icon={<MapPin size={24} color="var(--success)" />} subtext="Inspector Priyanshu" />
            <KPICard label="Notifications" value="3 Unread" icon={<Bell size={24} color="var(--warning)" />} subtext="New evidence verified" />
            <KPICard label="AI Legal Assistant" value="Ready" icon={<Cpu size={24} color="var(--accent)" />} subtext="Q&A on legal codes" />
          </div>

          <div className={styles.dashboardSection}>
            <Card title="Complaint Progress Tracking">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--muted-foreground)' }}>
                  Your logged complaint (REF: COMP-2026-00192) has been compiled. You can upload additional documents or chat with your investigator below.
                </p>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <Button variant="secondary" onClick={() => navigate('/evidence')}>Upload Additional CCTV/Evidence</Button>
                  <Button variant="secondary" onClick={() => navigate('/profile')}>Verify Identity documents</Button>
                </div>
              </div>
            </Card>

            <Card title="Frequently Asked Legal Questions (FAQ)">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: 'var(--text-xs)' }}>
                <div style={{ padding: '8px 12px', border: '1px solid var(--card-border)', borderRadius: 'var(--radius-sm)' }}>
                  <strong>Q: How long does the forensic test verification take?</strong>
                  <div style={{ color: 'var(--muted-foreground)', marginTop: '4px' }}>A: General toolmarks and fingerprints validation takes approximately 24-48 hours inside the automated lab pipeline.</div>
                </div>
                <div style={{ padding: '8px 12px', border: '1px solid var(--card-border)', borderRadius: 'var(--radius-sm)' }}>
                  <strong>Q: Can I access printable FIR copies?</strong>
                  <div style={{ color: 'var(--muted-foreground)', marginTop: '4px' }}>A: Yes, once registered and signed by the Inspector, copies can be downloaded in the FIR Workspace center.</div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* 3. CONSTABLE DASHBOARD */}
      {activeRole === 'CONSTABLE' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className={styles.kpiGrid}>
            <KPICard label="Today's Assigned Tasks" value="3 Pending" icon={<CheckSquare size={24} color="var(--warning)" />} subtext="High priority: 1" />
            <KPICard label="Shift Duty Schedule" value="14:00 - 22:00" icon={<Calendar size={24} color="var(--primary)" />} subtext="Sector 18 Patrol Area" />
            <KPICard label="Training Certifications" value="2 Active" icon={<Shield size={24} color="var(--success)" />} subtext="SOP Certification v1.4" />
            <KPICard label="AI Usage Stats" value="18 Queries" icon={<Activity size={24} color="var(--accent)" />} subtext="Checklist autocompletes" />
          </div>

          <div className={styles.dashboardSection} style={{ gridTemplateColumns: '1fr' }}>
            <Card title="My Tasks Checklist">
              <div className={styles.activityList}>
                <div className={styles.activityItem}>
                  <div className={styles.activityInfo}>
                    <span className={styles.activityTitle}>Conduct spot verification and sketch map</span>
                    <span className={styles.activityMeta}>Incident: Robbery Amit Kumar</span>
                  </div>
                  <Badge status="success">COMPLETED</Badge>
                </div>
                <div className={styles.activityItem}>
                  <div className={styles.activityInfo}>
                    <span className={styles.activityTitle}>Verify Aadhaar ID details of Complainant</span>
                    <span className={styles.activityMeta}>Task deadline: today 18:00</span>
                  </div>
                  <Badge status="warning">PENDING</Badge>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* 4. INSPECTOR WORKSPACE */}
      {activeRole === 'INSPECTOR' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className={styles.kpiGrid}>
            <KPICard label="Assigned Cases" value="8 Files" icon={<Shield size={24} color="var(--primary)" />} subtext="Assigned lead officer" />
            <KPICard label="Witness Interviews today" value="2 Scheduled" icon={<Users size={24} color="var(--accent)" />} subtext="Sanjay Dutt / Priya Patel" />
            <KPICard label="Pending FIR Sign-offs" value="3 Drafts" icon={<FileText size={24} color="var(--warning)" />} subtext="Awaiting review" />
            <KPICard label="Upcoming Hearings" value="CR-2026-00912" icon={<Calendar size={24} color="var(--success)" />} subtext="Delhi District Court" />
          </div>

          <div className={styles.dashboardSection}>
            <Card title="Inspector Active Case Files">
              <div className={styles.activityList}>
                <div 
                  className={styles.activityItem} 
                  style={{ cursor: 'pointer' }}
                  onClick={() => navigate('/cases/1')}
                >
                  <div className={styles.activityInfo}>
                    <span className={styles.activityTitle}>CASE-001 — Amit Kumar Snatching Case</span>
                    <span className={styles.activityMeta}>Category: Robbery · Last update: 2 hours ago</span>
                  </div>
                  <Badge status="warning">Under Investigation</Badge>
                </div>
              </div>
            </Card>

            <Card title="Quick Search Registry">
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--muted-foreground)', marginBottom: '12px' }}>
                Use global search to lookup Aadhaar registries, vehicle plates, or weapon tags.
              </p>
              <Button onClick={() => navigate('/search')}>Open Registry Search</Button>
            </Card>
          </div>
        </div>
      )}

      {/* 5. CYBER CELL WORKSPACE */}
      {activeRole === 'CYBER_CELL' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className={styles.kpiGrid}>
            <KPICard label="Cyber Fraud Cases" value="14 Active" icon={<Wifi size={24} color="var(--danger)" />} subtext="Phishing & KYC fraud" />
            <KPICard label="Device Audits pending" value="4 Devices" icon={<Cpu size={24} color="var(--primary)" />} subtext="Awaiting data dumps" />
            <KPICard label="AI Fraud Classifier" value="Online" icon={<Activity size={24} color="var(--success)" />} subtext="Circuit Breaker: CLOSED" />
            <KPICard label="IP Address logs" value="482 Logs" icon={<Globe size={24} color="var(--accent)" />} subtext="Telemetry status: Normal" />
          </div>

          <div className={styles.dashboardSection} style={{ gridTemplateColumns: '1fr' }}>
            <Card title="Cyber Incident Telemetries">
              <div className={styles.activityList}>
                <div className={styles.activityItem}>
                  <div className={styles.activityInfo}>
                    <span className={styles.activityTitle}>Financial Phishing Scam (Sunita Devi)</span>
                    <span className={styles.activityMeta}>Phishing URL: banking-kyc-verify.co · Loss: Rs 45,000</span>
                  </div>
                  <Badge status="danger">CRITICAL</Badge>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* 6. CRIME BRANCH DASHBOARD */}
      {activeRole === 'CRIME_BRANCH' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className={styles.kpiGrid}>
            <KPICard label="Average Case Duration" value="4.8 Days" icon={<TrendingUp size={24} color="var(--primary)" />} subtext="Target: 7 Days" />
            <KPICard label="Emerging Categories" value="Snatching (+14%)" icon={<BarChart2 size={24} color="var(--warning)" />} subtext="Past 30 days metrics" />
            <KPICard label="Repeat Offenders Flagged" value="12 matches" icon={<Users size={24} color="var(--accent)" />} subtext="Database comparison matches" />
            <KPICard label="Case Clearance rate" value="84.2%" icon={<Shield size={24} color="var(--success)" />} subtext="South Delhi PS Region" />
          </div>

          <div className={styles.dashboardSection} style={{ gridTemplateColumns: '1fr' }}>
            <Card title="Crime Intelligence Summary">
              <div className={styles.activityList}>
                <div className={styles.activityItem}>
                  <div className={styles.activityInfo}>
                    <span className={styles.activityTitle}>Robbery Hotspot Cluster identified</span>
                    <span className={styles.activityMeta}>Coordinates mapping: Sector 18 junction displays 12 assault events</span>
                  </div>
                  <Badge status="danger">HOTSPOT</Badge>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* 7. SUPERVISOR DASHBOARD */}
      {activeRole === 'SUPERVISOR' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className={styles.kpiGrid}>
            <KPICard label="Active Cases Force" value="48 Total" icon={<Shield size={24} color="var(--primary)" />} subtext="AIPAS active registry" />
            <KPICard label="Pending FIR Approvals" value="3 Drafts" icon={<FileText size={24} color="var(--warning)" />} subtext="Awaiting digital signatures" />
            <KPICard label="Case Clearance rate" value="92.4%" icon={<CheckSquare size={24} color="var(--success)" />} subtext="Target: 90%" />
            <KPICard label="Avg Investigation Duration" value="3.6 Days" icon={<Activity size={24} color="var(--accent)" />} subtext="Metric performance: High" />
          </div>

          <div className={styles.dashboardSection}>
            <Card title="Awaiting Supervisor Sign-off Approval">
              <div className={styles.activityList}>
                <div className={styles.activityItem} style={{ cursor: 'pointer' }} onClick={() => navigate('/firs')}>
                  <div className={styles.activityInfo}>
                    <span className={styles.activityTitle}>FIR No: 2026/00192 (Amit Kumar Assault)</span>
                    <span className={styles.activityMeta}>Lead Officer: Investigator Priyanshu · BNS Section 304</span>
                  </div>
                  <Badge status="warning">Awaiting Signature</Badge>
                </div>
              </div>
            </Card>

            <Card title="Quick actions">
              <div className={styles.quickActionsGrid}>
                {quickActions.slice(0, 4).map(act => (
                  <div key={act.label} className={styles.quickActionCard} onClick={act.onClick}>
                    <div className={styles.quickActionIcon}>{act.icon}</div>
                    <span className={styles.quickActionLabel}>{act.label}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* 8. ADMINISTRATOR SETTINGS */}
      {activeRole === 'ADMIN' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className={styles.kpiGrid}>
            <KPICard label="Active System Logs" value="4,821 Logs" icon={<Activity size={24} color="var(--primary)" />} subtext="Audit trail ledger size" />
            <KPICard label="API Database pool" value="12/20 Conn" icon={<Globe size={24} color="var(--accent)" />} subtext="Uptime 100%" />
            <KPICard label="Database backups" value="Daily Successful" icon={<Cloud size={24} color="var(--success)" />} subtext="Last backup: 8 hrs ago" />
            <KPICard label="Active Feature Flags" value="4 Enabled" icon={<Cpu size={24} color="var(--warning)" />} subtext="MFA, Face Scan enabled" />
          </div>

          <div className={styles.dashboardSection}>
            <Card title="System Variables & Configuration Manager">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: 'var(--text-sm)' }}>
                <div><strong>AI Matcher Similarity Threshold:</strong> 85%</div>
                <div><strong>Vault Storage Endpoints:</strong> AWS S3 Bucket `aipas-evidence-vault` (Delhi region)</div>
                <div><strong>Encryption Mode:</strong> AES-256 GCM (Encrypted at rest)</div>
              </div>
            </Card>

            <Card title="Administrator Controls">
              <div className={styles.quickActionsGrid}>
                {quickActions.map(act => (
                  <div key={act.label} className={styles.quickActionCard} onClick={act.onClick}>
                    <div className={styles.quickActionIcon}>{act.icon}</div>
                    <span className={styles.quickActionLabel}>{act.label}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}
    </PageTransition>
  )
}
export default DashboardPage
