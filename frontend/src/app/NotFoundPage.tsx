import React from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertCircle } from 'lucide-react'
import { PageTransition, Button } from '@/design-system'

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate()

  return (
    <PageTransition>
      <div
        className="flex-center"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          backgroundColor: 'var(--background)',
          color: 'var(--foreground)',
          padding: '24px',
          textAlign: 'center',
        }}
      >
        <AlertCircle size={64} color="var(--danger)" style={{ marginBottom: '24px' }} />
        <h1 style={{ fontSize: 'var(--text-4xl)', fontWeight: 'var(--weight-bold)', marginBottom: '12px' }}>
          404 — Registry Resource Not Found
        </h1>
        <p style={{ color: 'var(--muted-foreground)', maxWidth: '480px', marginBottom: '32px', fontSize: 'var(--text-base)' }}>
          The requested system path or investigation record does not exist or has been archived from AIPAS servers.
        </p>
        <Button onClick={() => navigate('/dashboard')}>
          Go to Command Center
        </Button>
      </div>
    </PageTransition>
  )
}
export default NotFoundPage
