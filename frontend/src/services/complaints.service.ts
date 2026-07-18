import { apiClient } from '@/lib/api-client'
import type { ApiResponse, Complaint, PaginatedResponse } from '@/types'

export interface CreateComplaintParams {
  citizen_name: string
  citizen_contact: string
  complaint_text: string
  source: string
  citizen_id?: string
}

export interface UpdateComplaintParams {
  complaint_text: string
}

export const complaintsService = {
  list: async (params: { status?: string; q?: string; citizen_id?: string; page?: number; page_size?: number } = {}): Promise<PaginatedResponse<Complaint>> => {
    let backendItems: Complaint[] = []
    let total = 0
    let totalPages = 1

    try {
      const { data } = await apiClient.get<ApiResponse<Complaint[]>>('/complaints', { params })
      const responseData = data as any
      backendItems = responseData.data || []
      total = responseData.pagination?.total || backendItems.length
      totalPages = responseData.pagination?.total_pages || 1
    } catch (err) {
      console.warn('Backend offline, using fallback list', err)
    }

    // Retrieve local citizen complaints
    const localStr = localStorage.getItem('aipas_citizen_complaints')
    let localList: any[] = localStr ? JSON.parse(localStr) : []

    // Apply status and query filters to local items
    if (params.status) {
      localList = localList.filter(item => item.status === params.status)
    }
    if (params.q) {
      const query = params.q.toLowerCase()
      localList = localList.filter(item => 
        item.citizen_name.toLowerCase().includes(query) || 
        item.complaint_text.toLowerCase().includes(query)
      )
    }

    // Merge lists (local first so officers see new e-filings immediately)
    const combinedItems = [...localList, ...backendItems]

    return {
      items: combinedItems,
      total: total + localList.length,
      page: params.page || 1,
      page_size: params.page_size || 20,
      total_pages: Math.max(totalPages, Math.ceil(combinedItems.length / (params.page_size || 20))),
    }
  },

  get: async (id: string): Promise<Complaint> => {
    if (id.startsWith('local-')) {
      const localStr = localStorage.getItem('aipas_citizen_complaints')
      const localList: any[] = localStr ? JSON.parse(localStr) : []
      const match = localList.find(item => item.id === id)
      if (match) {
        return {
          id: match.id,
          citizen_name: match.citizen_name,
          citizen_contact: match.citizen_contact,
          complaint_text: match.complaint_text,
          source: match.source,
          status: match.status,
          created_at: match.created_at,
        }
      }
      throw new Error('Local complaint not found')
    }

    const { data } = await apiClient.get<ApiResponse<Complaint>>(`/complaints/${id}`)
    return data.data
  },

  create: async (payload: CreateComplaintParams): Promise<Complaint> => {
    const { data } = await apiClient.post<ApiResponse<Complaint>>('/complaints', payload)
    return data.data
  },

  update: async (id: string, payload: UpdateComplaintParams): Promise<Complaint> => {
    if (id.startsWith('local-')) {
      const localStr = localStorage.getItem('aipas_citizen_complaints')
      let localList: any[] = localStr ? JSON.parse(localStr) : []
      localList = localList.map(item => 
        item.id === id ? { ...item, complaint_text: payload.complaint_text } : item
      )
      localStorage.setItem('aipas_citizen_complaints', JSON.stringify(localList))
      return complaintsService.get(id)
    }

    const { data } = await apiClient.patch<ApiResponse<Complaint>>(`/complaints/${id}`, payload)
    return data.data
  },

  assign: async (id: string, officerId: string): Promise<Complaint> => {
    if (id.startsWith('local-')) {
      const localStr = localStorage.getItem('aipas_citizen_complaints')
      let localList: any[] = localStr ? JSON.parse(localStr) : []
      localList = localList.map(item => 
        item.id === id ? { ...item, assigned_officer_id: officerId, status: 'Reviewing' } : item
      )
      localStorage.setItem('aipas_citizen_complaints', JSON.stringify(localList))
      return complaintsService.get(id)
    }

    const { data } = await apiClient.post<ApiResponse<Complaint>>(`/complaints/${id}/assign`, { officer_id: officerId })
    return data.data
  },

  transitionStatus: async (id: string, status: string): Promise<Complaint> => {
    if (id.startsWith('local-')) {
      const localStr = localStorage.getItem('aipas_citizen_complaints')
      let localList: any[] = localStr ? JSON.parse(localStr) : []
      localList = localList.map(item => 
        item.id === id ? { ...item, status } : item
      )
      localStorage.setItem('aipas_citizen_complaints', JSON.stringify(localList))
      return complaintsService.get(id)
    }

    const { data } = await apiClient.post<ApiResponse<Complaint>>(`/complaints/${id}/status`, { status })
    return data.data
  },

  delete: async (id: string): Promise<void> => {
    if (id.startsWith('local-')) {
      const localStr = localStorage.getItem('aipas_citizen_complaints')
      let localList: any[] = localStr ? JSON.parse(localStr) : []
      localList = localList.filter(item => item.id !== id)
      localStorage.setItem('aipas_citizen_complaints', JSON.stringify(localList))
      return
    }

    await apiClient.delete(`/complaints/${id}`)
  },
}
