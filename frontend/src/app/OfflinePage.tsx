import React, { useEffect } from 'react'
import { WifiOff, RefreshCw } from 'lucide-react'
import { PageTransition, Button } from '@/design-system'

export const OfflinePage: React.FC = () => {
  useEffect(() => {
    const handleOnline = () => window.location.reload()
    window.addEventListener('online', handleOnline)
    return () => {
      window.removeEventListener('online', handleOnline)
    }
  }, [])

  const handleRetry = () => {
    if (navigator.onLine) {
      window.location.reload()
    }
  }

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
        <WifiOff size={64} color="var(--muted-foreground)" style={{ marginBottom: '24px' }} />
        <h1 style={{ fontSize: 'var(--text-4xl)', fontWeight: 'var(--weight-bold)', marginBottom: '12px' }}>
          No Network Connection
        </h1>
        <p style={{ color: 'var(--muted-foreground)', maxWidth: '480px', marginBottom: '32px', fontSize: 'var(--text-base)' }}>
          Your terminal is currently offline. Please check your local network or Wi-Fi connections.
        </p>
        <Button onClick={handleRetry} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
          <RefreshCw size={16} /> Reconnect Terminal
        </Button>
      </div>
    </PageTransition>
  )
}
export default OfflinePage
