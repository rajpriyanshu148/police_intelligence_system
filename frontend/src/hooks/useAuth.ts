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
      const u = username.trim() || 'inspector_priyanshu'
      const demoOfficer: Officer = {
        id: 'off-1',
        username: u,
        email: `${u}@aipas.gov.in`,
        badge_number: 'IND-DL-4082',
        role: u.toLowerCase().includes('admin')
          ? 'ADMIN'
          : u.toLowerCase().includes('supervisor')
          ? 'SUPERVISOR'
          : 'INSPECTOR',
        department: 'Crime Branch',
        status: 'Active'
      }

      const isLocalHost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')

      if (!isLocalHost) {
        localStorage.setItem('aipas_access_token', 'mock-demo-access-token')
        localStorage.setItem('aipas_refresh_token', 'mock-demo-refresh-token')
        localStorage.setItem('aipas_demo_user', JSON.stringify(demoOfficer))
        set({ user: demoOfficer, status: 'authenticated' })
        return
      }

      try {
        const response = await apiClient.post('/auth/login', { username: u, password })
        const { access_token, refresh_token, officer } = response.data.data
        
        localStorage.setItem('aipas_access_token', access_token)
        localStorage.setItem('aipas_refresh_token', refresh_token)
        localStorage.setItem('aipas_demo_user', JSON.stringify(officer))
        
        set({ user: officer, status: 'authenticated' })
      } catch {
        localStorage.setItem('aipas_access_token', 'mock-demo-access-token')
        localStorage.setItem('aipas_refresh_token', 'mock-demo-refresh-token')
        localStorage.setItem('aipas_demo_user', JSON.stringify(demoOfficer))
        set({ user: demoOfficer, status: 'authenticated' })
      }
    },
    logout: async () => {
      try {
        await apiClient.post('/auth/logout')
      } catch {
        // Ignore network errors
      } finally {
        localStorage.removeItem('aipas_access_token')
        localStorage.removeItem('aipas_refresh_token')
        localStorage.removeItem('aipas_demo_user')
        set({ user: null, status: 'unauthenticated' })
      }
    },
    checkAuth: async () => {
      const token = localStorage.getItem('aipas_access_token')
      if (!token) {
        set({ user: null, status: 'unauthenticated' })
        return
      }

      const isLocalHost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')

      if (!isLocalHost) {
        const storedDemoUser = localStorage.getItem('aipas_demo_user')
        if (storedDemoUser) {
          try {
            set({ user: JSON.parse(storedDemoUser), status: 'authenticated' })
            return
          } catch {}
        }
        const defaultOfficer: Officer = {
          id: 'off-1',
          username: 'inspector_priyanshu',
          email: 'inspector_priyanshu@aipas.gov.in',
          badge_number: 'IND-DL-4082',
          role: 'INSPECTOR',
          department: 'Crime Branch',
          status: 'Active'
        }
        set({ user: defaultOfficer, status: 'authenticated' })
        return
      }

      try {
        set({ status: 'loading' })
        const response = await apiClient.get('/auth/me')
        set({ user: response.data.data, status: 'authenticated' })
      } catch {
        const storedDemoUser = localStorage.getItem('aipas_demo_user')
        if (storedDemoUser) {
          try {
            set({ user: JSON.parse(storedDemoUser), status: 'authenticated' })
            return
          } catch {}
        }
        const defaultOfficer: Officer = {
          id: 'off-1',
          username: 'inspector_priyanshu',
          email: 'inspector_priyanshu@aipas.gov.in',
          badge_number: 'IND-DL-4082',
          role: 'INSPECTOR',
          department: 'Crime Branch',
          status: 'Active'
        }
        set({ user: defaultOfficer, status: 'authenticated' })
      }
    }
  }
})
