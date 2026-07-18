import React from 'react'
import { useNavigate } from 'react-router-dom'
import { ShieldAlert } from 'lucide-react'
import { PageTransition, Button } from '@/design-system'

export const AccessDeniedPage: React.FC = () => {
  const navigate = useNavigate()

  return (
    <PageTransition>
      <div
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
        <ShieldAlert size={64} color="var(--warning)" style={{ marginBottom: '24px' }} />
        <h1 style={{ fontSize: 'var(--text-4xl)', fontWeight: 'var(--weight-bold)', marginBottom: '12px' }}>
          403 — Unauthorized Security Access
        </h1>
        <p style={{ color: 'var(--muted-foreground)', maxWidth: '480px', marginBottom: '32px', fontSize: 'var(--text-base)' }}>
          Your account role does not have authorization clearances to inspect this registry workspace.
        </p>
        <div style={{ display: 'flex', gap: '16px' }}>
          <Button variant="secondary" onClick={() => navigate(-1)}>
            Go Back
          </Button>
          <Button onClick={() => navigate('/dashboard')}>
            Go to Command Center
          </Button>
        </div>
      </div>
    </PageTransition>
  )
}
export default AccessDeniedPage
