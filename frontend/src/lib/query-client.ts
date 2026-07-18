import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data stays fresh for 5 minutes before being considered stale
      staleTime: 5 * 60 * 1000,
      // Keep unused data in cache for 10 minutes
      gcTime: 10 * 60 * 1000,
      // Don't refetch when window regains focus — police data should be explicit
      refetchOnWindowFocus: false,
      // Single retry on failure to avoid hammering a degraded backend
      retry: 1,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    },
    mutations: {
      // Don't retry mutations automatically — they may have side effects
      retry: 0,
    },
  },
})
