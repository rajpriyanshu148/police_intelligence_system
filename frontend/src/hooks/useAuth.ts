import { create } from 'zustand'
import { apiClient } from '@/lib/api-client'

export interface Officer {
  id: string
  username: string
  email: string
  badge_number: string
  role: 'ADMIN' | 'SUPERVISOR' | 'INVESTIGATOR' | 'CONSTABLE' | 'INSPECTOR' | 'CRIME_BRANCH' | 'CYBER_CELL' | 'CITIZEN'
  department: string
  status: string
}

interface AuthState {
  user: Officer | null
  status: 'loading' | 'authenticated' | 'unauthenticated'
  login: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
}

export const useAuth = create<AuthState>((set) => {
  // Listen for logout events triggered by API client interceptors
  if (typeof window !== 'undefined') {
    window.addEventListener('aipas_logout', () => {
      set({ user: null, status: 'unauthenticated' })
    })
  }

  return {
    user: null,
    status: 'loading',
    login: async (username, password) => {
      set({ status: 'loading' })
      try {
        const response = await apiClient.post('/auth/login', { username, password })
        const { access_token, refresh_token, officer } = response.data.data
        
        localStorage.setItem('aipas_access_token', access_token)
        localStorage.setItem('aipas_refresh_token', refresh_token)
        
        set({ user: officer, status: 'authenticated' })
      } catch (error) {
        set({ user: null, status: 'unauthenticated' })
        throw error;
      }
    },
    logout: async () => {
      try {
        // Silently call logout on backend (ignores errors if token expired)
        await apiClient.post('/auth/logout')
      } catch {
        // Ignore logout network errors
      } finally {
        localStorage.removeItem('aipas_access_token')
        localStorage.removeItem('aipas_refresh_token')
        set({ user: null, status: 'unauthenticated' })
      }
    },
    checkAuth: async () => {
      const token = localStorage.getItem('aipas_access_token')
      if (!token) {
        set({ user: null, status: 'unauthenticated' })
        return
      }

      try {
        set({ status: 'loading' })
        const response = await apiClient.get('/auth/me')
        set({ user: response.data.data, status: 'authenticated' })
      } catch {
        // Token might be refreshed by interceptor; try reading storage once more
        const refreshedToken = localStorage.getItem('aipas_access_token')
        if (refreshedToken) {
          try {
            const response = await apiClient.get('/auth/me')
            set({ user: response.data.data, status: 'authenticated' })
            return
          } catch {}
        }
        localStorage.removeItem('aipas_access_token')
        localStorage.removeItem('aipas_refresh_token')
        set({ user: null, status: 'unauthenticated' })
      }
    }
  }
})
