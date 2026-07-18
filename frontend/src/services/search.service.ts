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
    const { data } = await apiClient.post<ApiResponse<SearchResponse>>('/search', payload)
    return data.data
  },
}
