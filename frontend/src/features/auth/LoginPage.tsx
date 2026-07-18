import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Shield, Lock, User, AlertCircle, FileText, MapPin,
  Radio, Fingerprint, Eye, EyeOff, Scan, Siren, 
  Search, HelpCircle, Wifi
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { apiClient } from '@/lib/api-client'
import { LoadingSpinner } from '@/design-system/motion/motion-primitives'
import { Button, Badge } from '@/design-system'
import styles from './LoginPage.module.css'

type PortalMode = 'citizen' | 'officer'
type CitizenView = 'home' | 'track' | 'sos' | 'complaint' | 'cyber' | 'missing' | 'stations' | 'faq'

// Citizen service entries
const citizenServices = [
  { id: 'complaint', icon: FileText, label: 'Register Complaint', desc: 'File a new incident report', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
  { id: 'track', icon: Search, label: 'Track Complaint', desc: 'Check your complaint status', color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
  { id: 'cyber', icon: Wifi, label: 'Cyber Crime', desc: 'Report online fraud or threat', color: '#06b6d4', bg: 'rgba(6,182,212,0.1)' },
  { id: 'missing', icon: Radio, label: 'Missing Person', desc: 'Report a missing individual', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  { id: 'stations', icon: MapPin, label: 'Police Stations', desc: 'Find your nearest station', color: '#22c55e', bg: 'rgba(34,197,94,0.1)' },
  { id: 'faq', icon: HelpCircle, label: 'Legal Info & FAQ', desc: 'Get guidance on your rights', color: '#64748b', bg: 'rgba(100,116,139,0.1)' },
]

export const LoginPage: React.FC = () => {
  const navigate = useNavigate()
  const { checkAuth } = useAuth()

  const [portal, setPortal] = useState<PortalMode>('officer')
  const [loginStep, setLoginStep] = useState<'credentials' | 'mfa_choice' | 'face_scan' | 'otp_verify'>('credentials')
  const [tempAuthData, setTempAuthData] = useState<any>(null)
  
  // Camera references
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const [citizenView, setCitizenView] = useState<CitizenView>('home')

  // Badge login state
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Face scan state
  const [scanPhase, setScanPhase] = useState<'idle' | 'scanning' | 'done'>('idle')
  const [isCameraActive, setIsCameraActive] = useState(false)

  // MFA state
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', ''])
  const otpRefs = useRef<Array<HTMLInputElement | null>>([])

  // SOS state
  const [sosActive, setSosActive] = useState(false)
  const [sosStep, setSosStep] = useState(0)
  const sosSteps = [
    'Locating your GPS position…',
    'Connecting to nearest dispatch centre…',
    'Officer dispatched — ETA 4 minutes',
    'Stay calm. Help is on the way.',
  ]

  // Tracking state
  const [trackId, setTrackId] = useState('')
  const [trackResult, setTrackResult] = useState<string | null>(null)

  // Citizen Complaint Wizard States
  const [complaintStage, setComplaintStage] = useState(1)
  const [citizenName, setCitizenName] = useState('')
  const [citizenContact, setCitizenContact] = useState('')
  const [citizenIdType, setCitizenIdType] = useState('Aadhaar')
  const [citizenIdNum, setCitizenIdNum] = useState('')
  const [incidentCategory, setIncidentCategory] = useState('Robbery')
  const [incidentDate, setIncidentDate] = useState('')
  const [incidentLoc, setIncidentLoc] = useState('')
  const [incidentNarrative, setIncidentNarrative] = useState('')
  const [suspectName, setSuspectName] = useState('')
  const [witnessName, setWitnessName] = useState('')
  const [evidenceFile, setEvidenceFile] = useState('')
  const [complaintReference, setComplaintReference] = useState<string | null>(null)

  // Cyber Crime States
  const [cyberUrl, setCyberUrl] = useState('')
  const [cyberLoss, setCyberLoss] = useState('')
  const [cyberNarrative, setCyberNarrative] = useState('')
  const [cyberReference, setCyberReference] = useState<string | null>(null)

  // Missing Person States
  const [missingName, setMissingName] = useState('')
  const [missingAge, setMissingAge] = useState('')
  const [missingClothing, setMissingClothing] = useState('')
  const [missingLoc, setMissingLoc] = useState('')
  const [missingReference, setMissingReference] = useState<string | null>(null)

  // FAQ & AI Legal Chatbot States
  const [faqQuery, setFaqQuery] = useState('')
  const [faqChat, setFaqChat] = useState<Array<{ role: 'user' | 'assistant', text: string }>>([
    { role: 'assistant', text: 'Welcome to the AIPAS Legal Advisor. I can help you find relevant BNS/IPC sections or clarify filing procedures. Ask me anything, e.g., "What is BNS 304?"' }
  ])

  const handleComplaintSubmit = () => {
    if (!citizenName.trim() || !citizenContact.trim()) return
    const ref = `COMP-2026-${Math.floor(10000 + Math.random() * 90000)}`
    
    const newComplaint = {
      id: `local-${ref}`,
      citizen_name: citizenName,
      citizen_contact: citizenContact,
      complaint_text: incidentNarrative || 'Assault and robbery near Sector 18 crossroads.',
      source: 'Online Portal',
      status: 'Pending',
      created_at: new Date().toISOString()
    }
    
    const existing = localStorage.getItem('aipas_citizen_complaints')
    const list = existing ? JSON.parse(existing) : []
    list.unshift(newComplaint)
    localStorage.setItem('aipas_citizen_complaints', JSON.stringify(list))

    setComplaintReference(ref)
  }

  const handleCyberSubmit = () => {
    if (!cyberNarrative.trim() || !cyberLoss.trim()) return
    const ref = `CYB-2026-${Math.floor(10000 + Math.random() * 90000)}`
    
    const newComplaint = {
      id: `local-${ref}`,
      citizen_name: 'Anonymous Cyber Complainant',
      citizen_contact: 'Online System',
      complaint_text: `Cyber Financial Fraud. Loss: ₹${cyberLoss}. Source link: ${cyberUrl || 'N/A'}. Incident details: ${cyberNarrative}`,
      source: 'Cyber Cell Portal',
      status: 'Pending',
      created_at: new Date().toISOString()
    }
    
    const existing = localStorage.getItem('aipas_citizen_complaints')
    const list = existing ? JSON.parse(existing) : []
    list.unshift(newComplaint)
    localStorage.setItem('aipas_citizen_complaints', JSON.stringify(list))

    setCyberReference(ref)
  }

  const handleMissingSubmit = () => {
    if (!missingName.trim() || !missingLoc.trim()) return
    const ref = `MIS-2026-${Math.floor(10000 + Math.random() * 90000)}`
    
    const newComplaint = {
      id: `local-${ref}`,
      citizen_name: `Reporter for ${missingName}`,
      citizen_contact: 'Online System',
      complaint_text: `Missing Person bulletin: ${missingName}, Age: ${missingAge || 'Unknown'}. Last seen location: ${missingLoc}. Identifiers: ${missingClothing || 'None'}`,
      source: 'Missing Person Portal',
      status: 'Pending',
      created_at: new Date().toISOString()
    }
    
    const existing = localStorage.getItem('aipas_citizen_complaints')
    const list = existing ? JSON.parse(existing) : []
    list.unshift(newComplaint)
    localStorage.setItem('aipas_citizen_complaints', JSON.stringify(list))

    setMissingReference(ref)
  }

  const sendQueryDirect = (queryText: string) => {
    if (!queryText.trim()) return
    setFaqChat(prev => [...prev, { role: 'user', text: queryText }])
    setFaqQuery('')

    setTimeout(() => {
      const lowerQuery = queryText.toLowerCase()
      let reply = ''

      // ── CONSTITUTION OF INDIA ──────────────────────────────
      if (lowerQuery.includes('constitution') || lowerQuery.includes('preamble') || lowerQuery.includes('republic') || lowerQuery.includes('article 12') || lowerQuery.includes('article 35') || lowerQuery.includes('fundamental rights') || lowerQuery.includes('fundamental right')) {
        reply = '● **The Constitution of India** is the supreme law of the land. It guarantees citizens basic rights and lists their fundamental duties:\n' +
                '• **Part III (Articles 12-35)**: Guarantees **Fundamental Rights**.\n' +
                '• **Part IV (Articles 36-51)**: Outlines Directive Principles of State Policy.\n' +
                '• **Part IV-A (Article 51A)**: Details **Fundamental Duties** (11 duties for all citizens).\n' +
                '• **Articles 32 & 226**: Empowerment of Supreme Court and High Courts to issue Writs to protect these freedoms.'
      } else if (lowerQuery.includes('equality') || lowerQuery.includes('discrimination') || lowerQuery.includes('article 14') || lowerQuery.includes('article 15') || lowerQuery.includes('article 16') || lowerQuery.includes('article 17') || lowerQuery.includes('article 18')) {
        reply = '● **Right to Equality (Articles 14 - 18)**:\n' +
                '• **Article 14**: Guarantees equality before the law and equal protection of the laws to all persons.\n' +
                '• **Article 15**: Prohibits discrimination by the State on grounds of religion, race, caste, sex, or place of birth.\n' +
                '• **Article 16**: Equal opportunity in public employment.\n' +
                '• **Article 17**: Abolishes "Untouchability" and penalizes its practice.\n' +
                '• **Article 18**: Abolishes titles (except military and academic).'
      } else if (lowerQuery.includes('freedom') || lowerQuery.includes('speech') || lowerQuery.includes('assembly') || lowerQuery.includes('expression') || lowerQuery.includes('article 19')) {
        reply = '● **Right to Freedom (Article 19)** guarantees 6 democratic freedoms to Indian citizens:\n' +
                '1. Freedom of speech and expression.\n' +
                '2. Right to assemble peacefully without arms.\n' +
                '3. Right to form associations, unions, or co-operative societies.\n' +
                '4. Right to move freely throughout the territory of India.\n' +
                '5. Right to reside and settle in any part of India.\n' +
                '6. Right to practice any profession, trade, or business.'
      } else if (lowerQuery.includes('life') || lowerQuery.includes('liberty') || lowerQuery.includes('privacy') || lowerQuery.includes('education') || lowerQuery.includes('article 21') || lowerQuery.includes('article 20') || lowerQuery.includes('article 22')) {
        reply = '● **Protection of Life & Personal Liberty (Article 21)**:\n' +
                '• **Article 21**: "No person shall be deprived of his life or personal liberty except according to procedure established by law." Interpreted by courts to include the right to privacy, livelihood, clean environment, health, shelter, and speedy trial.\n' +
                '• **Article 21A**: Guarantees free and compulsory education for all children aged 6 to 14 years.\n' +
                '• **Article 22**: Outlines protections against arbitrary arrest and detention, including the right to be informed of grounds of arrest and consult a lawyer within 24 hours.'
      } else if (lowerQuery.includes('writ') || lowerQuery.includes('petition') || lowerQuery.includes('article 32') || lowerQuery.includes('article 226') || lowerQuery.includes('habeas') || lowerQuery.includes('mandamus') || lowerQuery.includes('certiorari')) {
        reply = '● **Writ Jurisdictions (Articles 32 & 226)**:\n' +
                'Enables citizens to approach courts directly for rights violations:\n' +
                '• **Habeas Corpus**: "To produce the body." Releases a person illegally detained by police or private entities.\n' +
                '• **Mandamus**: Commands a public authority to perform its legal duty.\n' +
                '• **Prohibition**: Prevents a lower court from exceeding its jurisdiction.\n' +
                '• **Certiorari**: Quashes an illegal order passed by a lower court or tribunal.\n' +
                '• **Quo Warranto**: Checks the authority of a person holding a public office.'
      } else if (lowerQuery.includes('duty') || lowerQuery.includes('duties') || lowerQuery.includes('article 51a') || lowerQuery.includes('51a')) {
        reply = '● **Fundamental Duties (Part IV-A, Article 51A)**:\n' +
                'Introduced by the 42nd Amendment (1976), it outlines 11 duties for citizens, including:\n' +
                '• Abiding by the Constitution, National Flag, and National Anthem.\n' +
                '• Cherishing noble ideals of the freedom struggle.\n' +
                '• Protecting the sovereignty, unity, and integrity of India.\n' +
                '• Promoting harmony and spirit of common brotherhood.\n' +
                '• Safeguarding public property and abjuring violence.'

      // ── TRAFFIC LAWS & MOTOR VEHICLE ACT ──────────────────
      } else if (lowerQuery.includes('traffic') || lowerQuery.includes('challan') || lowerQuery.includes('mv act') || lowerQuery.includes('fine') || lowerQuery.includes('penalty') || lowerQuery.includes('road')) {
        reply = '● **Motor Vehicles (Amendment) Act Key Traffic Fines**:\n' +
                '• **Drunk Driving (Sec 185)**: Fine up to ₹10,000 and/or 6 months imprisonment.\n' +
                '• **No Driving License (Sec 181)**: ₹5,000 fine.\n' +
                '• **Speeding / Over-speeding (Sec 183)**: Light vehicles: ₹1,000 - ₹2,000 fine.\n' +
                '• **No Helmet / Seatbelt (Sec 194D/B)**: ₹1,000 fine. No helmet also results in a 3-month license suspension.\n' +
                '• **Blocking Emergency Vehicles (Sec 194E)**: ₹10,000 fine and/or 6 months imprisonment.\n' +
                '• **Driving without insurance (Sec 196)**: ₹2,000 fine and/or 3 months jail.\n' +
                '• **No PUC Certificate**: Fine up to ₹10,000 and/or 3-month license suspension.'
      } else if (lowerQuery.includes('drunk') || lowerQuery.includes('drink') || lowerQuery.includes('alcohol') || lowerQuery.includes('sober') || lowerQuery.includes('drinking')) {
        reply = '● **Drunk Driving Offenses (Motor Vehicles Act Sec 185)**:\n' +
                'If blood alcohol content exceeds 30mg per 100ml of blood (as tested by breathalyzer):\n' +
                '• **First Offense**: Punishable with a fine of **₹10,000** and/or up to 6 months imprisonment.\n' +
                '• **Second/Subsequent Offense**: Punishable with a fine of **₹15,000** and/or up to 2 years imprisonment. License is suspended immediately.'
      } else if (lowerQuery.includes('ambulance') || lowerQuery.includes('emergency vehicle') || lowerQuery.includes('fire engine')) {
        reply = '● **Blocking Emergency Vehicles (Sec 194E)**:\n' +
                'Blocking or refusing to give side space to an Ambulance, Fire Engine, or emergency rescue vehicle is a serious road safety offence, carrying a mandatory **fine of ₹10,000** and/or up to 6 months in prison.'
      } else if (lowerQuery.includes('helmet') || lowerQuery.includes('seatbelt') || lowerQuery.includes('seat belt') || lowerQuery.includes('pillion')) {
        reply = '● **Safety Fines under Motor Vehicles Act**:\n' +
                '• **No Helmet (Sec 194D)**: Fine of **₹1,000** for both rider and pillion rider. The rider\'s license will also be suspended/disqualified for 3 months.\n' +
                '• **No Seatbelt (Sec 194B)**: Fine of **₹1,000** for the driver and co-passengers.'
      } else if (lowerQuery.includes('license') || lowerQuery.includes('licence') || lowerQuery.includes('expired license') || lowerQuery.includes('driving license')) {
        reply = '● **Licensing Offenses (Motor Vehicles Act)**:\n' +
                '• **Driving without a license (Sec 181)**: Fine of **₹5,000**.\n' +
                '• **Driving after license disqualification (Sec 182)**: Fine of **₹10,000** and/or up to 3 months imprisonment.'

      // ── CRIMINAL LAWS (BNS, BNSS, BSA) ─────────────────────
      } else if (lowerQuery.includes('murder') || lowerQuery.includes('kill') || lowerQuery.includes('homicide') || lowerQuery.includes('death') || lowerQuery.includes('attempt to murder') || lowerQuery.includes('103') || lowerQuery.includes('109')) {
        reply = '● **Severe Offenses Against Life (BNS)**:\n' +
                '• **BNS Section 103 (previously IPC 302 - Murder)**: Carrying death penalty or life imprisonment, plus a fine.\n' +
                '• **BNS Section 109 (previously IPC 307 - Attempt to Murder)**: Carrying up to 10 years imprisonment, or life imprisonment if hurt is caused.\n' +
                '• **BNS Section 105 (previously IPC 304 - Culpable Homicide)**: Carrying up to life or 10 years imprisonment.'
      } else if (lowerQuery.includes('theft') || lowerQuery.includes('robbery') || lowerQuery.includes('snatch') || lowerQuery.includes('dacoity') || lowerQuery.includes('303') || lowerQuery.includes('304')) {
        reply = '● **Theft and Property Offenses (BNS)**:\n' +
                '• **BNS Section 303 (Theft)**: Punishment is up to 3 years imprisonment or fine.\n' +
                '• **BNS Section 304 (Snatching)**: Specifically covers sudden force/speed theft, carrying up to 3 years imprisonment.\n' +
                '• **BNS Section 309 (Robbery)**: Punishment is up to 10 years rigorous imprisonment.\n' +
                '• **BNS Section 310 (Dacoity)**: Robbery committed by 5 or more persons, carrying up to life or 10 years rigorous imprisonment.'
      } else if (lowerQuery.includes('cyber') || lowerQuery.includes('phishing') || lowerQuery.includes('scam') || lowerQuery.includes('online') || lowerQuery.includes('cheat') || lowerQuery.includes('318') || lowerQuery.includes('66d')) {
        reply = '● **Cyber Fraud & IT Act Regulations**:\n' +
                '• **BNS Section 318 (Cheating)**: Punishment is up to 7 years in prison plus fine.\n' +
                '• **IT Act Section 66C (Identity Theft)**: Up to 3 years imprisonment and ₹1 Lakh fine.\n' +
                '• **IT Act Section 66D (Cheating by Impersonation online)**: Up to 3 years imprisonment and ₹1 Lakh fine.\n' +
                '• **IT Act Section 43/66 (Hacking/Data theft)**: Penalties and compensation up to ₹5 crore.'
      } else if (lowerQuery.includes('fir') || lowerQuery.includes('report') || lowerQuery.includes('register') || lowerQuery.includes('file') || lowerQuery.includes('173')) {
        reply = '● **Filing an FIR (BNSS Section 173)**:\n' +
                'Every citizen has a right to register a First Information Report (FIR) for cognizable offenses. If an officer refuses:\n' +
                '• You can send the complaint in writing to the Superintendent of Police (SP) under BNSS Section 173(4).\n' +
                '• You can approach the Judicial Magistrate under BNSS Section 175(3) to order an investigation.'
      } else if (lowerQuery.includes('bail') || lowerQuery.includes('arrest') || lowerQuery.includes('warrant') || lowerQuery.includes('rights on arrest')) {
        reply = '● **Arrest Protections (BNSS)**:\n' +
                '• **Bail (Sec 480 BNSS)**: For bailable offenses, bail is a right. Police must release you upon offering security.\n' +
                '• **Right to know grounds**: Must be informed of the offense and bail rights immediately.\n' +
                '• **Magistrate Present**: Must be produced before a Magistrate within 24 hours of arrest (excluding travel time).'
      } else if (lowerQuery.includes('fees') || lowerQuery.includes('cost') || lowerQuery.includes('charge') || lowerQuery.includes('payment') || lowerQuery.includes('bribe')) {
        reply = '● **Transparency Guidelines**:\n' +
                'All filings, registration of FIRs, evidence logs, and tracking reports on AIPAS are **100% free of charge**. Soliciting fees or bribes is illegal; report cases immediately to the Vigilance Cell or SP Office.'
      } else if (lowerQuery.includes('harass') || lowerQuery.includes('threat') || lowerQuery.includes('abuse') || lowerQuery.includes('stalk') || lowerQuery.includes('women')) {
        reply = '● **Protective BNS Provisions for Women & Dignity**:\n' +
                '• **BNS Sections 74 - 79**: Covers stalking, harassment, sexual harassment, and insult to modesty. Carrying up to 3 to 5 years imprisonment.\n' +
                '• **Zero FIR**: A woman or citizen can file an FIR at *any* police station regardless of jurisdiction, and it will be forwarded to the correct precinct (BNSS Section 173).'
      } else if (lowerQuery.includes('court') || lowerQuery.includes('hearing') || lowerQuery.includes('judge') || lowerQuery.includes('trial') || lowerQuery.includes('531')) {
        reply = '● **Court Digitization under BNSS**:\n' +
                'The Bharatiya Nagarik Suraksha Sanhita (BNSS) mandates absolute digitisation:\n' +
                '• **BNSS Section 531**: Electronic records, digital signatures, and video hearings are fully legally binding in trials.\n' +
                '• Forensics reports and electronic evidence are directly shared with the Magistrate.'
      } else {
        const words = lowerQuery.split(' ').filter(w => w.length > 4)
        const subject = words.length > 0 ? words[0] : 'your query'
        reply = `Regarding **"${subject}"**: Under Indian laws (Constitution, BNS, or Motor Vehicles Act), remedies are well-defined. Please try asking specific keywords like "Fundamental Rights", "drunk driving fine", "writ petition", "Section 103", or "blocking ambulance".`
      }

      setFaqChat(prev => [...prev, { role: 'assistant', text: reply }])
    }, 600)
  }

  const handleFaqSend = () => {
    sendQueryDirect(faqQuery)
  }

  const formatMsgText = (text: string) => {
    return text.split('\n').map((line, lIdx) => {
      const parts = line.split('**')
      const parsedLine = parts.map((part, pIdx) => {
        if (pIdx % 2 === 1) {
          return <strong key={pIdx}>{part}</strong>
        }
        return part
      })
      return <div key={lIdx} style={{ margin: '3px 0' }}>{parsedLine}</div>
    })
  }

  const handleDownloadComplaintCopy = (reportType: string, referenceId: string, details: Record<string, string>) => {
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

    const todayDate = new Date().toLocaleString()
    const filteredDetails = Object.entries(details).filter(([key]) => !key.toLowerCase().includes('narrative') && !key.toLowerCase().includes('detail'))
    const narrativeEntry = Object.entries(details).find(([key]) => key.toLowerCase().includes('narrative') || key.toLowerCase().includes('detail'))
    const narrativeText = narrativeEntry ? narrativeEntry[1] : ''

    doc.open()
    doc.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Complaint_${referenceId}</title>
        <style>
          body {
            font-family: 'Times New Roman', Times, serif;
            color: #000000;
            background: #ffffff;
            margin: 45px;
            padding: 0;
            line-height: 1.6;
            font-size: 13.5px;
          }
          .header {
            text-align: center;
            margin-bottom: 25px;
            border-bottom: 2px double #000000;
            padding-bottom: 12px;
          }
          .logo {
            width: 65px;
            height: auto;
            margin-bottom: 6px;
          }
          .gov-title {
            font-size: 16.5px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            margin: 3px 0;
          }
          .dept-title {
            font-size: 12.5px;
            font-weight: bold;
            margin: 3px 0;
          }
          .doc-title {
            font-size: 17.5px;
            font-weight: bold;
            text-decoration: underline;
            margin-top: 12px;
            letter-spacing: 0.5px;
          }
          .info-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
            margin-top: 15px;
          }
          .info-table th, .info-table td {
            border: 1px solid #000000;
            padding: 7px 10px;
            text-align: left;
            vertical-align: top;
            font-size: 12.5px;
          }
          .info-table th {
            background-color: #f2f2f2;
            font-weight: bold;
            width: 32%;
          }
          .narrative-box {
            border: 1px solid #000000;
            padding: 12px;
            min-height: 150px;
            white-space: pre-wrap;
            font-family: 'Courier New', Courier, monospace;
            font-size: 12.5px;
            background-color: #fafafa;
            margin-bottom: 25px;
            line-height: 1.6;
          }
          .footer-stamp {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: 50px;
          }
          .signature-line {
            border-top: 1px dashed #000000;
            width: 200px;
            text-align: center;
            padding-top: 4px;
            font-size: 11px;
          }
          .stamp-box {
            border: 2px solid #2563eb;
            color: #2563eb;
            border-radius: 6px;
            padding: 4px 10px;
            font-weight: bold;
            text-transform: uppercase;
            font-size: 9.5px;
            text-align: center;
            letter-spacing: 0.5px;
            transform: rotate(-1.5deg);
          }
          .watermark {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-45deg);
            font-size: 65px;
            font-weight: bold;
            color: rgba(0, 0, 0, 0.02);
            white-space: nowrap;
            pointer-events: none;
            z-index: -1;
          }
        </style>
      </head>
      <body>
        <div class="watermark">AIPAS CITIZEN PORTAL</div>
        <div class="header">
          <img class="logo" src="https://upload.wikimedia.org/wikipedia/commons/5/55/Emblem_of_India.svg" alt="Emblem of India" />
          <div class="gov-title">Government of India</div>
          <div class="dept-title">Ministry of Home Affairs &bull; Delhi Police Department</div>
          <div class="doc-title">${reportType.toUpperCase()} COPY</div>
          <div style="font-size: 11px; margin-top: 4px; font-style: italic;">
            Submitted online via AI Police Assistance System (AIPAS)
          </div>
        </div>

        <table class="info-table">
          <tr>
            <th>Complaint Reference ID</th>
            <td><strong>${referenceId.toUpperCase()}</strong></td>
          </tr>
          <tr>
            <th>Date & Time of Submission</th>
            <td>${todayDate}</td>
          </tr>
          ${filteredDetails.map(([key, val]) => `
            <tr>
              <th>${key}</th>
              <td>${val || 'Not provided'}</td>
            </tr>
          `).join('')}
        </table>

        ${narrativeText ? `
          <div style="font-weight: bold; margin-bottom: 6px; font-size: 13px;">Incident Statement / Narrative Details:</div>
          <div class="narrative-box">${narrativeText}</div>
        ` : ''}

        <div style="font-size: 11px; color: #555555; border-top: 1px solid #cccccc; padding-top: 10px;">
          * Note: This is an official acknowledgment copy generated from the AIPAS portal database. Please quote the Reference ID for all future tracking and verification inquiries.
        </div>

        <div class="footer-stamp">
          <div class="signature-line">
            Citizen Signature / Digital Verification
          </div>
          <div class="stamp-box">
            AIPAS Portal Registry<br/>
            E-Submission Received
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

  const startCamera = async (): Promise<boolean> => {
    setError(null)
    setIsCameraActive(false)
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API not supported in this browser context')
      }
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        try {
          await videoRef.current.play()
        } catch (playErr) {
          console.warn("Autoplay was blocked by browser policies:", playErr)
        }
      }
      setIsCameraActive(true)
      return true
    } catch (err: any) {
      console.error('Camera access failed:', err)
      setError('Webcam access failed. Please verify browser camera permissions.')
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

  useEffect(() => {
    if (loginStep === 'face_scan') {
      startCamera()
    } else {
      stopCamera()
    }
    return () => {
      stopCamera()
    }
  }, [loginStep])

  const handleBadgeLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim() || !password.trim()) {
      setError('Please enter your username and password.')
      return
    }
    setError(null)
    setIsLoading(true)
    try {
      const response = await apiClient.post('/auth/login', {
        username: username.trim(),
        password: password
      })
      setTempAuthData(response.data.data)
      setLoginStep('mfa_choice')
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? 'Invalid credentials. Please try again.'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  const startFaceScan = () => {
    setScanPhase('scanning')
    setError(null)
    setTimeout(async () => {
      stopCamera()
      setScanPhase('done')
      await handleFaceVerificationComplete()
    }, 4000)
  }

  const handleFaceVerificationComplete = async () => {
    if (!tempAuthData) return
    setIsLoading(true)
    setError(null)
    try {
      localStorage.setItem('aipas_access_token', tempAuthData.access_token)
      localStorage.setItem('aipas_refresh_token', tempAuthData.refresh_token)
      await checkAuth()
      navigate('/dashboard', { replace: true })
    } catch {
      setError('Biometric verification failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleMfaVerify = async () => {
    if (!tempAuthData) return
    setIsLoading(true)
    setError(null)
    try {
      localStorage.setItem('aipas_access_token', tempAuthData.access_token)
      localStorage.setItem('aipas_refresh_token', tempAuthData.refresh_token)
      await checkAuth()
      navigate('/dashboard', { replace: true })
    } catch {
      setError('Invalid MFA OTP code.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleEmergencyVerify = async () => {
    if (!tempAuthData) return
    setIsLoading(true)
    setError(null)
    try {
      localStorage.setItem('aipas_access_token', tempAuthData.access_token)
      localStorage.setItem('aipas_refresh_token', tempAuthData.refresh_token)
      await checkAuth()
      navigate('/dashboard', { replace: true })
    } catch {
      setError('Emergency access credentials rejected.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleOtpChange = (idx: number, val: string) => {
    if (!/^\d?$/.test(val)) return
    const next = [...otpDigits]
    next[idx] = val
    setOtpDigits(next)
    if (val && idx < 5) otpRefs.current[idx + 1]?.focus()
  }

  const handleSOS = () => {
    setSosActive(true)
    setSosStep(0)
    const tick = setInterval(() => {
      setSosStep(prev => {
        if (prev >= sosSteps.length - 1) { clearInterval(tick); return prev }
        return prev + 1
      })
    }, 1800)
  }

  const handleTrack = () => {
    if (!trackId.trim()) return
    setTrackResult(
      trackId.toUpperCase().startsWith('COMP')
        ? `Complaint ${trackId.toUpperCase()} — Status: Under Investigation. Assigned Officer: Inspector Priyanshu. Last update: 2 hours ago.`
        : 'No complaint found with that reference number. Please check and try again.'
    )
  }

  return (
    <div className={styles.page}>
      {/* ── Top Nav Bar ── */}
      <nav className={styles.navBar}>
        <div className={styles.navBrand}>
          <div className={styles.navLogoIcon}>
            <Shield size={20} color="#ffffff" />
          </div>
          <div>
            <div className={styles.navBrandText}>AIPAS</div>
            <div className={styles.navBrandSub}>AI Police Assistance System</div>
          </div>
        </div>
        <div className={styles.navMeta}>
          <span className={`${styles.navChip} ${styles.navChipGov}`}>Government of India</span>
          <span className={`${styles.navChip} ${styles.navChipSecure}`}>🔒 Secure Portal</span>
        </div>
      </nav>

      {/* ── Hero Banner ── */}
      <div className={styles.hero}>
        <h1 className={styles.heroTitle}>
          Digital Policing <span className={styles.heroGradientText}>Intelligence Platform</span>
        </h1>
        <p className={styles.heroSubtitle}>
          Enterprise AI-powered investigation management, evidence intelligence, and citizen services — built for modern law enforcement.
        </p>
        <div className={styles.heroStats}>
          <div className={styles.heroStat}>
            <div className={styles.heroStatNum}>2,400+</div>
            <div className={styles.heroStatLabel}>Active Cases</div>
          </div>
          <div className={styles.heroStat}>
            <div className={styles.heroStatNum}>98.2%</div>
            <div className={styles.heroStatLabel}>AI Accuracy</div>
          </div>
          <div className={styles.heroStat}>
            <div className={styles.heroStatNum}>340+</div>
            <div className={styles.heroStatLabel}>Officers Online</div>
          </div>
          <div className={styles.heroStat}>
            <div className={styles.heroStatNum}>14s</div>
            <div className={styles.heroStatLabel}>Avg Response</div>
          </div>
        </div>
      </div>

      {/* ── Portal Toggle ── */}
      <div className={styles.portalToggle}>
        <button
          className={`${styles.toggleBtn} ${styles.toggleBtnLeft} ${portal === 'citizen' ? styles.toggleBtnActive : ''}`}
          onClick={() => setPortal('citizen')}
        >
          <User size={15} /> Citizen Services
        </button>
        <button
          className={`${styles.toggleBtn} ${styles.toggleBtnRight} ${portal === 'officer' ? styles.toggleBtnActive : ''}`}
          onClick={() => setPortal('officer')}
        >
          <Shield size={15} /> Officer Portal
        </button>
      </div>

      {/* ── Main Content ── */}
      <div className={styles.mainContent}>
        <AnimatePresence mode="wait">
          {portal === 'citizen' ? (
            <motion.div
              key="citizen"
              className={styles.citizenPanel}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              style={{ gridColumn: '1 / -1' }}
            >
              <p className={styles.panelTitle}>Citizen Services Portal</p>

              {citizenView === 'home' && (
                <>
                  {/* Emergency SOS — full-width red card */}
                  <div
                    className={`${styles.serviceCard} ${styles.serviceCardSOS}`}
                    onClick={() => setCitizenView('sos')}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <div className={styles.serviceCardIcon} style={{ background: 'rgba(220,38,38,0.15)', width: 48, height: 48 }}>
                        <Siren size={22} color="#ef4444" />
                      </div>
                      <div>
                        <div className={styles.serviceCardTitle} style={{ color: '#ef4444', fontSize: 16 }}>Emergency SOS</div>
                        <div className={styles.serviceCardDesc}>Activate emergency dispatch. Your GPS will be shared automatically.</div>
                      </div>
                    </div>
                  </div>

                  {/* Service Grid */}
                  <div className={styles.serviceGrid}>
                    {citizenServices.map(svc => {
                      const Icon = svc.icon
                      return (
                        <div
                          key={svc.id}
                          className={styles.serviceCard}
                          onClick={() => setCitizenView(svc.id as CitizenView)}
                        >
                          <div className={styles.serviceCardIcon} style={{ background: svc.bg }}>
                            <Icon size={18} color={svc.color} />
                          </div>
                          <div className={styles.serviceCardTitle}>{svc.label}</div>
                          <div className={styles.serviceCardDesc}>{svc.desc}</div>
                        </div>
                      )
                    })}
                  </div>
                </>
              )}

              {citizenView === 'track' && (
                <motion.div
                  className={styles.trackForm}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <button onClick={() => { setCitizenView('home'); setTrackResult(null) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', fontSize: 13, fontWeight: 600 }}>← Back</button>
                    <span style={{ fontWeight: 700, fontSize: 15 }}>Track Your Complaint</span>
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>Enter your complaint reference number (e.g. COMP-2026-0192) to check status.</p>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      className={styles.trackInput}
                      placeholder="COMP-2026-XXXX"
                      value={trackId}
                      onChange={e => setTrackId(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleTrack()}
                    />
                    <button className={styles.loginSubmitBtn} style={{ width: 'auto', padding: '10px 18px' }} onClick={handleTrack}>
                      <Search size={14} /> Track
                    </button>
                  </div>
                  {trackResult && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      style={{ padding: '12px 16px', borderRadius: 10, background: 'var(--muted)', border: '1px solid var(--card-border)', fontSize: 13, lineHeight: 1.6 }}
                    >
                      {trackResult}
                    </motion.div>
                  )}
                </motion.div>
              )}

              {citizenView === 'sos' && (
                <motion.div
                  className={styles.trackForm}
                  style={{ borderColor: 'rgba(220,38,38,0.4)', background: 'rgba(220,38,38,0.04)' }}
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <button onClick={() => { setCitizenView('home'); setSosActive(false) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', fontSize: 13, fontWeight: 600 }}>← Back</button>
                    <span style={{ fontWeight: 700, fontSize: 15, color: '#ef4444' }}>Emergency SOS</span>
                  </div>

                  {!sosActive ? (
                    <div style={{ textAlign: 'center', padding: 24 }}>
                      <div
                        onClick={handleSOS}
                        style={{
                          width: 100, height: 100, borderRadius: '50%',
                          background: 'radial-gradient(circle, #ef4444, #b91c1c)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          margin: '0 auto 16px', cursor: 'pointer',
                          boxShadow: '0 0 0 0 rgba(239,68,68,0.5)',
                          animation: 'sosPulse 2s infinite',
                          fontSize: 32, fontWeight: 800, color: '#fff',
                          alignSelf: 'center',
                          justifySelf: 'center'
                        }}
                      >
                        SOS
                      </div>
                      <p style={{ fontSize: 13, color: 'var(--muted-foreground)' }}>Tap the button above to alert emergency dispatch and share your GPS location.</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {sosSteps.map((step, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, x: -12 }}
                          animate={{ opacity: idx <= sosStep ? 1 : 0.25, x: 0 }}
                          transition={{ delay: idx * 0.1 }}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 10,
                            padding: '10px 14px', borderRadius: 10,
                            background: idx === sosStep ? 'rgba(239,68,68,0.1)' : 'var(--muted)',
                            border: `1px solid ${idx === sosStep ? 'rgba(239,68,68,0.3)' : 'var(--card-border)'}`,
                            fontSize: 13
                          }}
                        >
                          {idx <= sosStep ? <span style={{ color: '#22c55e', fontSize: 16 }}>✓</span> : <span style={{ color: 'var(--muted-foreground)', fontSize: 16 }}>○</span>}
                          {step}
                        </motion.div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {citizenView === 'complaint' && (
                <motion.div
                  className={styles.trackForm}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <button onClick={() => { setCitizenView('home'); setComplaintReference(null); setComplaintStage(1) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', fontSize: 13, fontWeight: 600 }}>← Back to Services</button>
                    <span style={{ fontWeight: 700, fontSize: 15 }}>Register Complaint Wizard</span>
                  </div>

                  {complaintReference ? (
                    <div style={{ textAlign: 'center', padding: '16px 0' }}>
                      <div style={{ width: 48, height: 48, borderRadius: '50%', backgroundColor: 'rgba(34, 197, 94, 0.1)', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center', color: '#22c55e', marginBottom: 12 }}>✓</div>
                      <h4 style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>Complaint Registered Successfully</h4>
                      <p style={{ fontSize: 13, color: 'var(--muted-foreground)', marginBottom: 16 }}>
                        Reference ID: <strong style={{ color: 'var(--foreground)' }}>{complaintReference}</strong>
                      </p>
                      <div style={{ padding: 12, backgroundColor: 'var(--muted)', borderRadius: 10, border: '1px solid var(--card-border)', fontSize: 12, textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
                        <div><strong>Assigned Precinct:</strong> PS Sector 18 District South Delhi</div>
                        <div><strong>AI Assigned Priority:</strong> <Badge status="danger">HIGH</Badge></div>
                        <div><strong>Suggested Squad:</strong> Robbery & Assault Squad</div>
                      </div>
                      <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                        <Button variant="secondary" onClick={() => handleDownloadComplaintCopy('Standard Incident Complaint', complaintReference, {
                          'Complainant Name': citizenName,
                          'Contact Details': citizenContact,
                          'ID Reference': `${citizenIdType}: ${citizenIdNum}`,
                          'Crime Category': incidentCategory,
                          'Incident Date': incidentDate,
                          'Occurrence Location': incidentLoc,
                          'Incident Narrative': incidentNarrative
                        })}>
                          Download Complaint Copy
                        </Button>
                        <Button onClick={() => { setComplaintReference(null); setComplaintStage(1); setCitizenName(''); setCitizenContact(''); setCitizenIdNum(''); setIncidentLoc(''); setIncidentNarrative('') }}>Register New</Button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--muted-foreground)' }}>
                        <span>Stage {complaintStage} of 5: {complaintStage === 1 ? 'Complainant Profile' : complaintStage === 2 ? 'Incident Details' : complaintStage === 3 ? 'Witnesses & Suspects' : complaintStage === 4 ? 'Evidence Attachments' : 'AI Safety Preview'}</span>
                        <span>{complaintStage * 20}%</span>
                      </div>
                      <div style={{ height: 6, backgroundColor: 'var(--muted)', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ width: `${complaintStage * 20}%`, height: '100%', backgroundColor: 'var(--primary)' }} />
                      </div>

                      {complaintStage === 1 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                          <div>
                            <label className={styles.loginLabel}>Complainant Full Name</label>
                            <input type="text" placeholder="e.g. Amit Kumar" value={citizenName} onChange={e => setCitizenName(e.target.value)} />
                          </div>
                          <div>
                            <label className={styles.loginLabel}>Contact Phone / Email</label>
                            <input type="text" placeholder="e.g. +91 98888 77777" value={citizenContact} onChange={e => setCitizenContact(e.target.value)} />
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                            <div>
                              <label className={styles.loginLabel}>ID Document Type</label>
                              <select className={styles.trackInput} value={citizenIdType} onChange={e => setCitizenIdType(e.target.value)}>
                                <option value="Aadhaar">Aadhaar Card</option>
                                <option value="Passport">Passport ID</option>
                                <option value="DL">Driving License</option>
                              </select>
                            </div>
                            <div>
                              <label className={styles.loginLabel}>ID Number</label>
                              <input type="text" placeholder="e.g. 5432-1082-9812" value={citizenIdNum} onChange={e => setCitizenIdNum(e.target.value)} />
                            </div>
                          </div>
                        </div>
                      )}

                      {complaintStage === 2 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                            <div>
                              <label className={styles.loginLabel}>Crime Category</label>
                              <select className={styles.trackInput} value={incidentCategory} onChange={e => setIncidentCategory(e.target.value)}>
                                <option value="Robbery">Robbery / Snatching</option>
                                <option value="Assault">Physical Assault</option>
                                <option value="Cyber">Cyber Financial Fraud</option>
                                <option value="Burglary">Home Burglary</option>
                                <option value="Other">Other Crime Incident</option>
                              </select>
                            </div>
                            <div>
                              <label className={styles.loginLabel}>Incident Date / Time</label>
                              <input type="datetime-local" value={incidentDate} onChange={e => setIncidentDate(e.target.value)} />
                            </div>
                          </div>
                          <div>
                            <label className={styles.loginLabel}>Location Address & Coordinates</label>
                            <input type="text" placeholder="e.g. Near Sector 18 Crossroads (GPS: 28.562, 77.209)" value={incidentLoc} onChange={e => setIncidentLoc(e.target.value)} />
                          </div>
                          <div>
                            <label className={styles.loginLabel}>Describe Narrative fully</label>
                            <textarea className={styles.trackInput} style={{ minHeight: 80, boxSizing: 'border-box' }} placeholder="Explain exactly what occurred..." value={incidentNarrative} onChange={e => setIncidentNarrative(e.target.value)} />
                          </div>
                        </div>
                      )}

                      {complaintStage === 3 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                          <div>
                            <label className={styles.loginLabel}>Suspect Dossier details (if known)</label>
                            <input type="text" placeholder="e.g. Height 5'10'', driving white SUV" value={suspectName} onChange={e => setSuspectName(e.target.value)} />
                          </div>
                          <div>
                            <label className={styles.loginLabel}>Witness Names / Contact</label>
                            <input type="text" placeholder="e.g. Shopkeeper Sanjay Dutt" value={witnessName} onChange={e => setWitnessName(e.target.value)} />
                          </div>
                        </div>
                      )}

                      {complaintStage === 4 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                          <div>
                            <label className={styles.loginLabel}>Digital Evidence File name (mock)</label>
                            <input type="text" placeholder="e.g. cctv_spot_clip.mp4" value={evidenceFile} onChange={e => setEvidenceFile(e.target.value)} />
                          </div>
                          <p style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>File integrity checks: cryptographic SHA-256 hashes will be automatically calculated upon upload queue.</p>
                        </div>
                      )}

                      {complaintStage === 5 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 12, backgroundColor: 'var(--muted)', borderRadius: 10, border: '1px solid var(--card-border)', fontSize: 12 }}>
                          <div style={{ fontWeight: 'bold', fontSize: 13, borderBottom: '1px dashed var(--card-border)', paddingBottom: 6, marginBottom: 6 }}>AI Verification Preview Summary:</div>
                          <div><strong>Complainant:</strong> {citizenName} ({citizenIdType}: {citizenIdNum})</div>
                          <div><strong>Incident Location:</strong> {incidentLoc}</div>
                          <div><strong>BNS Classification:</strong> Section 304 Snatching & Assault</div>
                          <div><strong>AI Priority Index:</strong> <Badge status="danger">CRITICAL</Badge></div>
                          <div><strong>Suggested Squad:</strong> Robbery Squad PS Sector 18</div>
                          <div style={{ color: 'var(--success)', fontWeight: 'bold', marginTop: 4 }}>✓ Integrity verified: all required fields compiled.</div>
                        </div>
                      )}

                      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
                        {complaintStage > 1 && (
                          <Button variant="secondary" onClick={() => setComplaintStage(s => s - 1)}>Back</Button>
                        )}
                        {complaintStage < 5 ? (
                          <Button onClick={() => {
                            if (complaintStage === 1 && (!citizenName.trim() || !citizenContact.trim())) return
                            setComplaintStage(s => s + 1)
                          }}>Next Stage</Button>
                        ) : (
                          <Button onClick={handleComplaintSubmit}>Submit Verified Complaint</Button>
                        )}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {citizenView === 'cyber' && (
                <motion.div
                  className={styles.trackForm}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <button onClick={() => { setCitizenView('home'); setCyberReference(null); setCyberUrl(''); setCyberLoss('') }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', fontSize: 13, fontWeight: 600 }}>← Back to Services</button>
                    <span style={{ fontWeight: 700, fontSize: 15 }}>Cyber Crime Reporting</span>
                  </div>

                  {cyberReference ? (
                    <div style={{ textAlign: 'center', padding: '16px 0' }}>
                      <div style={{ width: 48, height: 48, borderRadius: '50%', backgroundColor: 'rgba(34, 197, 94, 0.1)', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center', color: '#22c55e', marginBottom: 12 }}>✓</div>
                      <h4 style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>Cyber Complaint Filed</h4>
                      <p style={{ fontSize: 13, color: 'var(--muted-foreground)', marginBottom: 16 }}>
                        Reference ID: <strong style={{ color: 'var(--foreground)' }}>{cyberReference}</strong>
                      </p>
                      <div style={{ padding: 12, backgroundColor: 'var(--muted)', borderRadius: 10, border: '1px solid var(--card-border)', fontSize: 11, textAlign: 'left', marginBottom: 16 }}>
                        Routed to **Cyber Intelligence Unit**. The unit will track fraud accounts and coordinate with payment gateways.
                      </div>
                      <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                        <Button variant="secondary" onClick={() => handleDownloadComplaintCopy('Cyber Crime Report', cyberReference, {
                          'Fraud Source URL': cyberUrl,
                          'Financial Loss Incurred': `₹${cyberLoss}`,
                          'Fraud Incident Details': cyberNarrative
                        })}>
                          Download Complaint Copy
                        </Button>
                        <Button onClick={() => { setCyberReference(null); setCyberUrl(''); setCyberLoss(''); setCyberNarrative('') }}>Register New</Button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <div>
                        <label className={styles.loginLabel}>Fraud Source Link / Phishing URL</label>
                        <input type="text" placeholder="e.g. banking-kyc-verify.co" value={cyberUrl} onChange={e => setCyberUrl(e.target.value)} />
                      </div>
                      <div>
                        <label className={styles.loginLabel}>Estimated Financial Loss (INR)</label>
                        <input type="number" placeholder="e.g. 45000" value={cyberLoss} onChange={e => setCyberLoss(e.target.value)} />
                      </div>
                      <div>
                        <label className={styles.loginLabel}>Fraud Incident Details</label>
                        <textarea className={styles.trackInput} style={{ minHeight: 80, boxSizing: 'border-box' }} placeholder="Detail the phishing message or spoof transaction details..." value={cyberNarrative} onChange={e => setCyberNarrative(e.target.value)} />
                      </div>
                      <Button onClick={handleCyberSubmit} disabled={!cyberNarrative.trim() || !cyberLoss.trim()}>Submit Cyber Report</Button>
                    </div>
                  )}
                </motion.div>
              )}

              {citizenView === 'missing' && (
                <motion.div
                  className={styles.trackForm}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <button onClick={() => { setCitizenView('home'); setMissingReference(null); setMissingName('') }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', fontSize: 13, fontWeight: 600 }}>← Back to Services</button>
                    <span style={{ fontWeight: 700, fontSize: 15 }}>Missing Person Registry</span>
                  </div>

                  {missingReference ? (
                    <div style={{ textAlign: 'center', padding: '16px 0' }}>
                      <div style={{ width: 48, height: 48, borderRadius: '50%', backgroundColor: 'rgba(34, 197, 94, 0.1)', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center', color: '#22c55e', marginBottom: 12 }}>✓</div>
                      <h4 style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>Missing Person Bulletin Created</h4>
                      <p style={{ fontSize: 13, color: 'var(--muted-foreground)', marginBottom: 16 }}>
                        Reference ID: <strong style={{ color: 'var(--foreground)' }}>{missingReference}</strong>
                      </p>
                      <div style={{ padding: 12, backgroundColor: 'var(--muted)', borderRadius: 10, border: '1px solid var(--card-border)', fontSize: 11, textAlign: 'left', marginBottom: 16 }}>
                        Bulletin has been propagated to South Delhi station databases. Automated CCTV facial recognition comparisons have been queued.
                      </div>
                      <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                        <Button variant="secondary" onClick={() => handleDownloadComplaintCopy('Missing Person Bulletin Report', missingReference, {
                          'Missing Person Name': missingName,
                          'Age': missingAge,
                          'Last Known Location': missingLoc,
                          'Clothing & Identifiers': missingClothing
                        })}>
                          Download Complaint Copy
                        </Button>
                        <Button onClick={() => { setMissingReference(null); setMissingName(''); setMissingAge(''); setMissingLoc(''); setMissingClothing('') }}>Register New</Button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <div>
                        <label className={styles.loginLabel}>Missing Individual Full Name</label>
                        <input type="text" placeholder="e.g. Ramesh Kumar" value={missingName} onChange={e => setMissingName(e.target.value)} />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                        <div>
                          <label className={styles.loginLabel}>Age</label>
                          <input type="number" placeholder="e.g. 28" value={missingAge} onChange={e => setMissingAge(e.target.value)} />
                        </div>
                        <div>
                          <label className={styles.loginLabel}>Last Seen Location</label>
                          <input type="text" placeholder="e.g. Sector 18 Crossroads" value={missingLoc} onChange={e => setMissingLoc(e.target.value)} />
                        </div>
                      </div>
                      <div>
                        <label className={styles.loginLabel}>Clothing last worn & identifiers</label>
                        <input type="text" placeholder="e.g. Blue shirt, black jeans" value={missingClothing} onChange={e => setMissingClothing(e.target.value)} />
                      </div>
                      <Button onClick={handleMissingSubmit} disabled={!missingName.trim() || !missingLoc.trim()}>Publish Missing Bulletin</Button>
                    </div>
                  )}
                </motion.div>
              )}

              {citizenView === 'stations' && (
                <motion.div
                  className={styles.trackForm}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <button onClick={() => setCitizenView('home')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', fontSize: 13, fontWeight: 600 }}>← Back to Services</button>
                    <span style={{ fontWeight: 700, fontSize: 15 }}>South Delhi Precinct Locator</span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ padding: 12, border: '1px solid var(--card-border)', borderRadius: 10, background: 'var(--card-bg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <strong style={{ fontSize: 13 }}>PS Sector 18 Precinct</strong>
                        <div style={{ fontSize: 11, color: 'var(--muted-foreground)', marginTop: 2 }}>Contact: 011-23012903 | Distance: 1.2 km</div>
                      </div>
                      <Badge status="success">ACTIVE</Badge>
                    </div>
                    <div style={{ padding: 12, border: '1px solid var(--card-border)', borderRadius: 10, background: 'var(--card-bg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <strong style={{ fontSize: 13 }}>PS Badarpur Precinct</strong>
                        <div style={{ fontSize: 11, color: 'var(--muted-foreground)', marginTop: 2 }}>Contact: 011-23012911 | Distance: 4.5 km</div>
                      </div>
                      <Badge status="success">ACTIVE</Badge>
                    </div>
                    <div style={{ padding: 12, border: '1px solid var(--card-border)', borderRadius: 10, background: 'var(--card-bg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <strong style={{ fontSize: 13 }}>PS Okhla Precinct</strong>
                        <div style={{ fontSize: 11, color: 'var(--muted-foreground)', marginTop: 2 }}>Contact: 011-23012944 | Distance: 6.2 km</div>
                      </div>
                      <Badge status="success">ACTIVE</Badge>
                    </div>
                  </div>
                </motion.div>
              )}

              {citizenView === 'faq' && (
                <motion.div
                  className={styles.trackForm}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <button onClick={() => setCitizenView('home')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', fontSize: 13, fontWeight: 600 }}>← Back to Services</button>
                    <span style={{ fontWeight: 700, fontSize: 15 }}>AI Legal Chat Advisor</span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', height: '240px', overflowY: 'auto', gap: 8, padding: 8, backgroundColor: 'var(--background)', borderRadius: 10, border: '1px solid var(--card-border)', marginBottom: 8 }}>
                    {faqChat.map((msg, idx) => (
                      <div 
                        key={idx}
                        style={{
                          alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                          backgroundColor: msg.role === 'user' ? 'var(--primary)' : 'var(--muted)',
                          color: msg.role === 'user' ? '#ffffff' : 'var(--foreground)',
                          padding: '8px 12px',
                          borderRadius: '12px',
                          maxWidth: '85%',
                          fontSize: '11px',
                          lineHeight: 1.5
                        }}
                      >
                        {formatMsgText(msg.text)}
                      </div>
                    ))}
                  </div>

                  {/* Suggestion Chips */}
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                    {[
                      'Fundamental Rights',
                      'Traffic Challan MV Act Fines',
                      'BNS Criminal Offenses',
                      'Cyber Crime IT Act Laws',
                      'Ambulance Blocking Penalty',
                      'Writ Petitions (Art 32/226)'
                    ].map(chip => (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => sendQueryDirect(chip)}
                        style={{
                          padding: '4px 10px',
                          fontSize: '10px',
                          fontWeight: 600,
                          borderRadius: '20px',
                          backgroundColor: 'rgba(37,99,235,0.08)',
                          color: 'var(--primary)',
                          border: '1px solid rgba(37,99,235,0.15)',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {chip}
                      </button>
                    ))}
                  </div>

                  <div style={{ display: 'flex', gap: 8 }}>
                    <input 
                      className={styles.trackInput}
                      placeholder="Ask constitution, criminal or traffic laws..."
                      value={faqQuery}
                      onChange={e => setFaqQuery(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleFaqSend()}
                    />
                    <Button onClick={handleFaqSend}>Send</Button>
                  </div>
                </motion.div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="officer"
              className={styles.officerPanel}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              style={{ gridColumn: '1 / -1', maxWidth: 560, margin: '0 auto', width: '100%' }}
            >
              <p className={styles.panelTitle}>Officer Portal — Secure Access Control</p>

              {/* Step 1: Username & Password Credentials */}
              {loginStep === 'credentials' && (
                <motion.form
                  className={styles.loginFormCard}
                  onSubmit={handleBadgeLogin}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <h3 style={{ fontWeight: 700, fontSize: 18 }}>Badge Authorization</h3>
                    <p style={{ fontSize: 13, color: 'var(--muted-foreground)' }}>Please enter your department badge keys to initiate secondary checks.</p>
                  </div>

                  <div>
                    <label className={styles.loginLabel} htmlFor="username">Username / Badge Number</label>
                    <input
                      id="username"
                      type="text"
                      placeholder="e.g. inspector_priyanshu"
                      value={username}
                      onChange={e => setUsername(e.target.value)}
                      autoComplete="username"
                      disabled={isLoading}
                    />
                  </div>
                  <div>
                    <label className={styles.loginLabel} htmlFor="password">Password</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        id="password"
                        type={showPwd ? 'text' : 'password'}
                        placeholder="Enter your password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        autoComplete="current-password"
                        disabled={isLoading}
                        style={{ paddingRight: 40 }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPwd(p => !p)}
                        style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted-foreground)', padding: 0 }}
                      >
                        {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <motion.div
                      className={styles.errorBanner}
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      role="alert"
                    >
                      <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
                      <span>{error}</span>
                    </motion.div>
                  )}

                  <button type="submit" className={styles.loginSubmitBtn} disabled={isLoading}>
                    {isLoading ? <><LoadingSpinner size={16} /> Verifying Credentials…</> : <><User size={15} /> Authenticate Badge</>}
                  </button>
                  <p style={{ fontSize: 11, color: 'var(--muted-foreground)', textAlign: 'center' }}>
                    Authorised access only. All sessions are monitored and logged.
                  </p>
                </motion.form>
              )}

              {/* Step 2: MFA Choice Menu */}
              {loginStep === 'mfa_choice' && (
                <motion.div
                  className={styles.loginFormCard}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, textAlign: 'center' }}>
                    <div style={{ width: 44, height: 44, borderRadius: '50%', backgroundColor: 'rgba(34, 197, 94, 0.1)', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center', color: '#22c55e', marginBottom: 6 }}>✓</div>
                    <h3 style={{ fontWeight: 700, fontSize: 18 }}>Badge Verified</h3>
                    <p style={{ fontSize: 13, color: 'var(--muted-foreground)' }}>Choose a verification method to complete authentication for <strong>Officer Priyanshu</strong>.</p>
                  </div>

                  <div className={styles.serviceGrid}>
                    <div 
                      className={styles.serviceCard}
                      onClick={() => { setLoginStep('face_scan'); setScanPhase('idle'); setError(null) }}
                    >
                      <div className={styles.serviceCardIcon} style={{ background: 'rgba(59,130,246,0.1)' }}>
                        <Scan size={18} color="#3b82f6" />
                      </div>
                      <div className={styles.serviceCardTitle}>Facial Verification</div>
                      <div className={styles.serviceCardDesc}>Scan your face via webcam to verify matching biometric records.</div>
                    </div>

                    <div 
                      className={styles.serviceCard}
                      onClick={() => { setLoginStep('otp_verify'); setError(null) }}
                    >
                      <div className={styles.serviceCardIcon} style={{ background: 'rgba(139,92,246,0.1)' }}>
                        <Lock size={18} color="#8b5cf6" />
                      </div>
                      <div className={styles.serviceCardTitle}>Authenticator OTP</div>
                      <div className={styles.serviceCardDesc}>Enter the 6-digit verification code from your token.</div>
                    </div>
                  </div>

                  <div 
                    className={`${styles.serviceCard} ${styles.serviceCardSOS}`}
                    style={{ borderColor: 'rgba(245,158,11,0.25)', background: 'rgba(245,158,11,0.03)' }}
                    onClick={handleEmergencyVerify}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <div className={styles.serviceCardIcon} style={{ background: 'rgba(245,158,11,0.15)', width: 44, height: 44 }}>
                        <Siren size={18} color="#f59e0b" />
                      </div>
                      <div>
                        <div className={styles.serviceCardTitle} style={{ color: '#f59e0b', fontSize: 14 }}>Emergency Command Bypass</div>
                        <div className={styles.serviceCardDesc}>Bypass secondary locks in urgent command operations. All events are logged.</div>
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={() => { setLoginStep('credentials'); setTempAuthData(null); setError(null) }} 
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted-foreground)', fontSize: 13, fontWeight: 600, textAlign: 'center', width: '100%', marginTop: 8 }}
                  >
                    ← Back to Badge Login
                  </button>
                </motion.div>
              )}

              {/* Step 3a: Live Camera Facial Verification */}
              {loginStep === 'face_scan' && (
                <motion.div
                  className={styles.faceScanner}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  <div style={{ width: '100%' }}>
                    <button 
                      onClick={() => { stopCamera(); setLoginStep('mfa_choice'); setScanPhase('idle'); setError(null) }} 
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', fontSize: 13, fontWeight: 600, marginBottom: 12 }}
                    >
                      ← Back
                    </button>
                    <h3 style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>Biometric Face Scan</h3>
                    <p style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>Position your face inside the frame. Camera access is required.</p>
                  </div>

                  <div className={styles.faceScanBox}>
                    {/* Live webcam video stream */}
                    <video 
                      ref={videoRef} 
                      className={styles.webcamStream} 
                      playsInline 
                      autoPlay
                      muted 
                      style={{ display: (scanPhase !== 'done' && isCameraActive) ? 'block' : 'none' }}
                    />
                    
                    {/* Futuristic Fallback Simulated Face Mesh (displays when webcam is offline, failed, or authenticated) */}
                    {(!isCameraActive || scanPhase === 'done') && (
                      <div className={styles.simulatedFaceContainer}>
                        {scanPhase === 'done' ? (
                          <svg className={styles.simulatedFaceSvg} viewBox="0 0 100 100" fill="none">
                            <circle cx="50" cy="50" r="40" stroke="#16a34a" strokeWidth="2" strokeDasharray="6, 6" className={styles.spinSlow} />
                            <path d="M50 30 C40 30, 32 38, 32 48 C32 60, 50 74, 50 74 C50 74, 68 60, 68 48 C68 38, 60 30, 50 30 Z" fill="rgba(22, 163, 74, 0.15)" stroke="#16a34a" strokeWidth="2" />
                            <path d="M42 50 L48 56 L58 44" stroke="#16a34a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        ) : (
                          <svg className={styles.simulatedFaceSvg} viewBox="0 0 100 100" fill="none">
                            <circle cx="50" cy="50" r="42" stroke="rgba(37,99,235,0.2)" strokeWidth="1" />
                            <circle cx="50" cy="50" r="28" stroke="rgba(37,99,235,0.4)" strokeWidth="1.5" strokeDasharray="8 8" className={styles.spinSlow} />
                            <path d="M50 25 C42 25, 34 32, 34 45 C34 60, 50 75, 50 75 C50 75, 66 60, 66 45 C66 32, 58 25, 50 25 Z" stroke="#3b82f6" strokeWidth="1.5" className={styles.pulseSlow} />
                            <line x1="50" y1="20" x2="50" y2="80" stroke="rgba(59,130,246,0.15)" strokeWidth="1" />
                            <line x1="20" y1="50" x2="80" y2="50" stroke="rgba(59,130,246,0.15)" strokeWidth="1" />
                            <circle cx="50" cy="35" r="2" fill="#06b6d4" />
                            <circle cx="40" cy="45" r="2" fill="#06b6d4" />
                            <circle cx="60" cy="45" r="2" fill="#06b6d4" />
                            <circle cx="50" cy="55" r="2" fill="#06b6d4" />
                            <circle cx="50" cy="70" r="2" fill="#06b6d4" />
                            <polygon points="50,35 40,45 50,55 60,45" stroke="rgba(6,182,212,0.3)" strokeWidth="1" />
                            <polygon points="40,45 50,55 50,70" stroke="rgba(6,182,212,0.3)" strokeWidth="1" />
                            <polygon points="60,45 50,55 50,70" stroke="rgba(6,182,212,0.3)" strokeWidth="1" />
                          </svg>
                        )}
                      </div>
                    )}
                    
                    <div className={styles.faceScanTarget}>
                      {scanPhase === 'scanning' && <div className={styles.faceScanLine} />}
                    </div>
                    <div className={`${styles.faceScanCorner} ${styles.faceScanCornerTL}`} />
                    <div className={`${styles.faceScanCorner} ${styles.faceScanCornerTR}`} />
                    <div className={`${styles.faceScanCorner} ${styles.faceScanCornerBL}`} />
                    <div className={`${styles.faceScanCorner} ${styles.faceScanCornerBR}`} />
                  </div>

                  <div className={styles.faceScanStatus}>
                    {scanPhase === 'idle' && 'Position your face in the frame. Click below to begin scan.'}
                    {scanPhase === 'scanning' && '⟳ Scanning live biometric features…'}
                    {scanPhase === 'done' && '✓ Biometrics verified for Officer Priyanshu'}
                  </div>

                  {error && (
                    <motion.div
                      className={styles.errorBanner}
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      role="alert"
                      style={{ width: '100%' }}
                    >
                      <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
                      <span>{error}</span>
                    </motion.div>
                  )}

                  {scanPhase === 'idle' && (
                    <button className={styles.loginSubmitBtn} style={{ width: 'auto', padding: '10px 28px' }} onClick={startFaceScan}>
                      <Fingerprint size={15} /> Begin Face Scan
                    </button>
                  )}
                  {scanPhase === 'done' && (
                    <button className={styles.loginSubmitBtn} style={{ width: 'auto', padding: '10px 28px' }} onClick={handleFaceVerificationComplete}>
                      Proceed to Dashboard →
                    </button>
                  )}
                </motion.div>
              )}

              {/* Step 3b: Authenticator OTP */}
              {loginStep === 'otp_verify' && (
                <motion.div
                  className={styles.loginFormCard}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  <div>
                    <button 
                      onClick={() => { setLoginStep('mfa_choice'); setError(null) }} 
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', fontSize: 13, fontWeight: 600, marginBottom: 12 }}
                    >
                      ← Back
                    </button>
                    <h3 style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>Two-Factor Security Code</h3>
                    <p style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>Enter the 6-digit code from your authenticator app or badge card.</p>
                  </div>

                  <div className={styles.otpContainer}>
                    {otpDigits.map((d, i) => (
                      <input
                        key={i}
                        ref={el => { otpRefs.current[i] = el }}
                        className={styles.otpInput}
                        maxLength={1}
                        value={d}
                        onChange={e => handleOtpChange(i, e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Backspace' && !d && i > 0) otpRefs.current[i - 1]?.focus()
                        }}
                      />
                    ))}
                  </div>

                  {error && (
                    <motion.div
                      className={styles.errorBanner}
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      role="alert"
                    >
                      <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
                      <span>{error}</span>
                    </motion.div>
                  )}

                  <button
                    className={styles.loginSubmitBtn}
                    disabled={otpDigits.some(d => d === '')}
                    onClick={handleMfaVerify}
                  >
                    <Lock size={15} /> Verify & Sign In
                  </button>
                  <p style={{ fontSize: 11, color: 'var(--muted-foreground)', textAlign: 'center' }}>
                    Code expires in 30 seconds. <span style={{ color: 'var(--primary)', cursor: 'pointer' }}>Resend code</span>
                  </p>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Site Footer ── */}
      <footer className={styles.siteFooter}>
        <span>AI Police Assistance System (AIPAS) v3.0 — Ministry of Home Affairs, Government of India</span>
        <span>Unauthorised access is a criminal offence under IT Act 2000</span>
      </footer>
    </div>
  )
}
