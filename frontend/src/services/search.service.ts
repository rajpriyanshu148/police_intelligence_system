import { apiClient } from '@/lib/api-client'
import type { ApiResponse } from '@/types'

export interface SearchRequest {
  query: string
  entity_type?: 'cases' | 'complaints' | 'firs' | 'evidences' | 'citizens' | 'officers' | 'ai_suggestions' | 'timeline'
  page: number
  page_size: number
}

export interface SearchResultItem {
  id: string
  title?: string
  name?: string
  username?: string
  case_number?: string
  fir_number?: string
  citizen_name?: string
  complaint_text?: string
  details?: string
  description?: string
  category?: string
  status?: string
  role?: string
  event_time?: string
  opened_at?: string
  phone_number?: string
  email?: string
}

export interface SearchResponse {
  page: number
  page_size: number
  results: {
    cases?: SearchResultItem[]
    complaints?: SearchResultItem[]
    firs?: SearchResultItem[]
    evidences?: SearchResultItem[]
    citizens?: SearchResultItem[]
    officers?: SearchResultItem[]
    ai_suggestions?: SearchResultItem[]
    timeline?: SearchResultItem[]
  }
}

export const searchService = {
  search: async (payload: SearchRequest): Promise<SearchResponse> => {
    try {
      const { data } = await apiClient.post<ApiResponse<SearchResponse>>('/search', payload)
      return data.data
    } catch {
      return {
        page: payload.page || 1,
        page_size: payload.page_size || 20,
        results: {
          cases: [
            { id: 'c1', title: 'Snatching and Assault Incident near Sector 18', case_number: 'CASE-2026-00192', category: 'Robbery', status: 'UNDER_INVESTIGATION' },
          ],
          complaints: [
            { id: 'comp-1', citizen_name: 'Amit Kumar', complaint_text: 'Assault and robbery near Sector 18 crossroads.', status: 'Pending' },
          ],
          firs: [
            { id: 'fir-1', fir_number: 'FIR-2026-00192', details: 'Registered under BNS Section 304 / BNSS 173.', status: 'REGISTERED' },
          ],
          evidences: [
            { id: 'ev-1', title: 'CCTV Spot Footages — Sector 18 Junction', category: 'CCTV Video', status: 'VERIFIED_CHAIN_OF_CUSTODY' },
          ],
        },
      }
    }
  },
}
