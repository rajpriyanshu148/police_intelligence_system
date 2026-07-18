import React from 'react'
import { Server } from 'lucide-react'
import { PageTransition, Button } from '@/design-system'

export const ServerErrorPage: React.FC = () => {
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
        <Server size={64} color="var(--danger)" style={{ marginBottom: '24px' }} />
        <h1 style={{ fontSize: 'var(--text-4xl)', fontWeight: 'var(--weight-bold)', marginBottom: '12px' }}>
          500 — System Registry Error
        </h1>
        <p style={{ color: 'var(--muted-foreground)', maxWidth: '480px', marginBottom: '32px', fontSize: 'var(--text-base)' }}>
          The FastAPI backend servers are unable to complete your request. Please try again shortly.
        </p>
        <Button onClick={() => window.location.reload()}>
          Reload System Session
        </Button>
      </div>
    </PageTransition>
  )
}
export default ServerErrorPage
