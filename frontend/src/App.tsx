import React, { useEffect } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { AppRoutes } from '@/app/routes'
import { useAuth } from '@/hooks/useAuth'
import { ToastContainer } from '@/design-system/feedback/FeedbackComponents'
import { ErrorBoundary } from '@/app/ErrorBoundary'
import { queryClient } from '@/lib/query-client'

const App: React.FC = () => {
  const { checkAuth } = useAuth()

  useEffect(() => {
    // Perform silent authentication recovery on load
    checkAuth()
  }, [checkAuth])

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AppRoutes />
          <ToastContainer />
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}

export default App
