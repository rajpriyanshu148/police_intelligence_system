import React, { useState, useRef, useEffect } from 'react'
import { Key, Scan, CheckCircle, ShieldAlert, Monitor, Smartphone, Trash2, Check, X } from 'lucide-react'
import { PageTransition, Card, Input, Button, Badge } from '@/design-system'
import { useAuth } from '@/hooks/useAuth'
import { authService } from '@/services/auth.service'
import { useToast } from '@/hooks/useToast'
import styles from './ProfilePage.module.css'

interface DeviceSession {
  id: string
  device: string
  browser: string
  ipAddress: string
  location: string
  lastActive: string
  isCurrent: boolean
}

const mockSessions: DeviceSession[] = [
  { id: 'sess-1', device: 'Precinct Desktop Terminal', browser: 'Chrome 125, Windows 11', ipAddress: '10.12.184.22', location: 'PS Sector 18 (Delhi)', lastActive: 'Active Now', isCurrent: true },
  { id: 'sess-2', device: 'Officer Mobile App', browser: 'AIPAS App, iOS 17.4', ipAddress: '192.168.1.104', location: 'Okhla Division (Delhi)', lastActive: '2 hours ago', isCurrent: false },
  { id: 'sess-3', device: 'Command Center Laptop', browser: 'Safari 17, macOS Sonoma', ipAddress: '10.12.185.1', location: 'Delhi Police HQ', lastActive: '1 day ago', isCurrent: false }
]

export const ProfilePage: React.FC = () => {
  const { user } = useAuth()
  const { addToast } = useToast()

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isPending, setIsPending] = useState(false)
  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  // Face ID state
  const [faceIdActive, setFaceIdActive] = useState(true) // Default active for demo
  const [showScanner, setShowScanner] = useState(false)
  const [scanPhase, setScanPhase] = useState<'idle' | 'scanning' | 'done'>('idle')
  const [isCameraActive, setIsCameraActive] = useState(false)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // Session state
  const [sessions, setSessions] = useState<DeviceSession[]>(mockSessions)

  const startCamera = async (): Promise<boolean> => {
    setIsCameraActive(false)
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API not supported')
      }
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        try {
          await videoRef.current.play()
        } catch (playErr) {
          console.warn("Autoplay was blocked:", playErr)
        }
      }
      setIsCameraActive(true)
      return true
    } catch (err) {
      console.error('Camera access failed:', err)
      setIsCameraActive(false)
      return false
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    setIsCameraActive(false)
  }

  const startFaceScan = () => {
    setScanPhase('scanning')
    setTimeout(() => {
      stopCamera()
      setScanPhase('done')
      setFaceIdActive(true)
      addToast('Biometric signature successfully mapped and registered to Badge ID!', 'success')
      setTimeout(() => {
        setShowScanner(false)
        setScanPhase('idle')
      }, 1500)
    }, 4000)
  }

  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [])

  const validate = () => {
    const errs: { [key: string]: string } = {}
    if (!currentPassword) errs.currentPassword = 'Current password is required.'
    if (!newPassword) {
      errs.newPassword = 'New password is required.'
    } else if (newPassword.length < 8) {
      errs.newPassword = 'Password must be at least 8 characters long.'
    }
    if (newPassword !== confirmPassword) {
      errs.confirmPassword = 'New passwords do not match.'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setIsPending(true)
    try {
      await authService.changePassword(currentPassword, newPassword)
      addToast('Password updated successfully.', 'success')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setErrors({})
    } catch (err: any) {
      addToast(err?.response?.data?.message || 'Failed to change password.', 'error')
    } finally {
      setIsPending(false)
    }
  }

  const handleRevokeSession = (id: string) => {
    setSessions(prev => prev.filter(s => s.id !== id))
    addToast('Session revoked. Accompanying device will be logged out immediately.', 'warning')
  }

  if (!user) return null

  const initials = user.username.substring(0, 2).toUpperCase()

  // Password Strength Indicators
  const isMinLength = newPassword.length >= 8
  const hasUpperCase = /[A-Z]/.test(newPassword)
  const hasNumber = /[0-9]/.test(newPassword)
  const hasSpecial = /[^A-Za-z0-9]/.test(newPassword)

  return (
    <PageTransition className={styles.container}>
      <div className={styles.profileHeader}>
        <div className={styles.avatar}>{initials}</div>
        <div>
          <h1 className={styles.title}>Officer Registry Profile</h1>
          <span style={{ fontSize: 'var(--text-sm)', color: 'var(--muted-foreground)' }}>
            Badge ID Number: {user.badge_number}
          </span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24 }}>
        
        {/* Profile Card & Biometrics Info */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
          <Card title="Personal Information">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, fontSize: 'var(--text-sm)' }}>
              <div>
                <span style={{ color: 'var(--muted-foreground)', display: 'block', fontSize: 10 }}>Username</span>
                <strong>{user.username}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--muted-foreground)', display: 'block', fontSize: 10 }}>Email Address</span>
                <strong>{user.email}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--muted-foreground)', display: 'block', fontSize: 10 }}>Force Department</span>
                <strong>{user.department || 'General Duties'}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--muted-foreground)', display: 'block', fontSize: 10 }}>Account Role</span>
                <div style={{ marginTop: '4px' }}>
                  <Badge status="info">{user.role}</Badge>
                </div>
              </div>
            </div>
          </Card>

          <Card title="Manage Biometric Face ID">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderRadius: '8px', background: 'var(--muted)', border: '1px solid var(--card-border)' }}>
                {faceIdActive ? (
                  <>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'rgba(22, 163, 74, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16a34a' }}>
                      <CheckCircle size={20} />
                    </div>
                    <div>
                      <strong style={{ display: 'block', fontSize: '13px', color: '#16A34A' }}>Face ID Status: Active</strong>
                      <span style={{ fontSize: '10px', color: 'var(--muted-foreground)' }}>Your biometric signature is registered. You can use Face ID to authenticate at login.</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'rgba(220, 38, 38, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}>
                      <ShieldAlert size={20} />
                    </div>
                    <div>
                      <strong style={{ display: 'block', fontSize: '13px', color: '#ef4444' }}>Face ID Status: Not Registered</strong>
                      <span style={{ fontSize: '10px', color: 'var(--muted-foreground)' }}>Register your Face ID to enable single-tap biometric authentication.</span>
                    </div>
                  </>
                )}
              </div>

              {!showScanner ? (
                <div style={{ display: 'flex', gap: '12px' }}>
                  <Button onClick={() => { setShowScanner(true); startCamera() }}>
                    <Scan size={16} style={{ marginRight: '8px' }} /> {faceIdActive ? 'Re-register Face ID' : 'Register Face ID'}
                  </Button>
                  {faceIdActive && (
                    <Button variant="secondary" onClick={() => { setFaceIdActive(false); addToast('Face ID signature cleared.', 'info') }}>
                      Deactivate Face ID
                    </Button>
                  )}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '16px', background: 'var(--background)', borderRadius: '12px', border: '1px dashed var(--card-border)' }}>
                  <div style={{ width: '220px', height: '220px', position: 'relative', overflow: 'hidden', borderRadius: '24px', border: '2px solid var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <video 
                      ref={videoRef} 
                      style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)', display: (scanPhase !== 'done' && isCameraActive) ? 'block' : 'none' }}
                      playsInline 
                      autoPlay
                      muted 
                    />
                    
                    {(!isCameraActive || scanPhase === 'done') && (
                      <div className={styles.simulatedFaceContainer}>
                        {scanPhase === 'done' ? (
                          <svg style={{ width: '70%', height: '70%' }} viewBox="0 0 100 100" fill="none">
                            <circle cx="50" cy="50" r="40" stroke="#16a34a" strokeWidth="2" strokeDasharray="6, 6" />
                            <path d="M50 30 C40 30, 32 38, 32 48 C32 60, 50 74, 50 74 C50 74, 68 60, 68 48 C68 38, 60 30, 50 30 Z" fill="rgba(22, 163, 74, 0.15)" stroke="#16a34a" strokeWidth="2" />
                            <path d="M42 50 L48 56 L58 44" stroke="#16a34a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        ) : (
                          <svg style={{ width: '70%', height: '70%' }} viewBox="0 0 100 100" fill="none">
                            <circle cx="50" cy="50" r="42" stroke="rgba(37,99,235,0.2)" strokeWidth="1" />
                            <circle cx="50" cy="50" r="28" stroke="rgba(37,99,235,0.4)" strokeWidth="1.5" strokeDasharray="8 8" />
                            <path d="M50 25 C42 25, 34 32, 34 45 C34 60, 50 75, 50 75 C50 75, 66 60, 66 45 C66 32, 58 25, 50 25 Z" stroke="#3b82f6" strokeWidth="1.5" />
                          </svg>
                        )}
                      </div>
                    )}
                    
                    <div className={styles.faceScanTarget}>
                      {scanPhase === 'scanning' && <div className={styles.faceScanLine} />}
                    </div>
                  </div>

                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--foreground)', textAlign: 'center' }}>
                    {scanPhase === 'idle' && 'Webcam online. Position your face in the frame.'}
                    {scanPhase === 'scanning' && '⟳ Mapping facial nodes & structural parameters…'}
                    {scanPhase === 'done' && '✓ Biometric mapping verified and registered!'}
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    {scanPhase === 'idle' && (
                      <Button onClick={startFaceScan}>Begin Scanning</Button>
                    )}
                    <Button variant="secondary" onClick={() => { stopCamera(); setShowScanner(false); setScanPhase('idle') }}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Password Reset & Guidelines */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 24 }}>
          <Card title="Update Account Password">
            <form onSubmit={handlePasswordSubmit} className={styles.formGrid} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Input
                id="currPassword"
                type="password"
                label="Current Password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                error={errors.currentPassword}
              />
              <Input
                id="newPassword"
                type="password"
                label="New Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                error={errors.newPassword}
              />
              <Input
                id="confirmPassword"
                type="password"
                label="Confirm New Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                error={errors.confirmPassword}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                <Button type="submit" loading={isPending}>
                  <Key size={16} style={{ marginRight: '8px' }} /> Update Password
                </Button>
              </div>
            </form>
          </Card>

          {/* Password Policy Guidelines checklist */}
          <Card title="Governance Password Policy">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 12 }}>
              <p style={{ color: 'var(--muted-foreground)', marginBottom: 6 }}>
                Under National Cyber Security guidelines, badge keys must satisfy:
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: isMinLength ? '#16a34a' : 'var(--muted-foreground)' }}>
                {isMinLength ? <Check size={14} /> : <X size={14} />}
                <span>At least 8 characters in length</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: hasUpperCase ? '#16a34a' : 'var(--muted-foreground)' }}>
                {hasUpperCase ? <Check size={14} /> : <X size={14} />}
                <span>Contains uppercase letter (A-Z)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: hasNumber ? '#16a34a' : 'var(--muted-foreground)' }}>
                {hasNumber ? <Check size={14} /> : <X size={14} />}
                <span>Contains digit number (0-9)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: hasSpecial ? '#16a34a' : 'var(--muted-foreground)' }}>
                {hasSpecial ? <Check size={14} /> : <X size={14} />}
                <span>Contains special character (@, #, $)</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Active Logged Sessions */}
        <Card title="Active Device & Authentication Sessions">
          <p style={{ fontSize: 12, color: 'var(--muted-foreground)', marginBottom: 16 }}>
            Security logs of devices authorized to access this badge key. Unrecognized endpoints should be terminated immediately.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {sessions.map(s => (
              <div 
                key={s.id}
                style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  padding: 12, 
                  border: '1px solid var(--card-border)', 
                  borderRadius: 10, 
                  background: 'var(--card-bg)' 
                }}
              >
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  {s.device.toLowerCase().includes('mobile') ? <Smartphone size={20} color="var(--primary)" /> : <Monitor size={20} color="var(--primary)" />}
                  <div>
                    <strong style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                      {s.device} {s.isCurrent && <Badge status="success">CURRENT</Badge>}
                    </strong>
                    <span style={{ display: 'block', fontSize: 11, color: 'var(--muted-foreground)', marginTop: 2 }}>
                      {s.browser} | IP: {s.ipAddress} | Location: {s.location}
                    </span>
                  </div>
                </div>
                {!s.isCurrent && (
                  <Button variant="secondary" onClick={() => handleRevokeSession(s.id)} style={{ padding: 6, color: 'var(--danger)' }}>
                    <Trash2 size={14} />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </Card>

      </div>
    </PageTransition>
  )
}
export default ProfilePage
