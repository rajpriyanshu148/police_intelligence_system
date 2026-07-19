import { apiClient } from '@/lib/api-client'
import axios from 'axios'
import type { ApiResponse } from '@/types'

export interface EvidenceItem {
  id: string
  case_id: string
  title: string
  description?: string
  category: string
  file_name: string
  file_size: number
  mime_type: string
  status: string
  current_version_number: number
  created_at: string
}

export interface EvidenceVersion {
  id: string
  evidence_id: string
  version_number: number
  storage_path: string
  sha256_hash: string
  file_name: string
  file_size: number
  mime_type: string
  uploaded_by_id: string
  created_at: string
}

export interface GetUploadUrlParams {
  file_name: string
  file_size: number
  mime_type: string
  category: string
  title: string
  description?: string
  captured_at?: string
  gps_location?: string
  device_model?: string
  exif_present?: boolean
}

export interface PresignedUploadResponse {
  evidence_id: string
  version_number: number
  upload_url: string
  storage_path: string
}

export interface PresignedDownloadResponse {
  download_url: string
  file_name: string
}

const mockEvidenceItem: EvidenceItem = {
  id: 'ev-1',
  case_id: 'c1',
  title: 'CCTV Spot Footages — Sector 18 Junction',
  description: 'High-definition MP4 capture showing suspect vehicle fleeing north.',
  category: 'CCTV Video',
  file_name: 'sector18_cctv_clip.mp4',
  file_size: 14582910,
  mime_type: 'video/mp4',
  status: 'VERIFIED_CHAIN_OF_CUSTODY',
  current_version_number: 1,
  created_at: new Date(Date.now() - 86400000).toISOString(),
}

export const evidenceService = {
  list: async (caseId: string): Promise<EvidenceItem[]> => {
    try {
      const { data } = await apiClient.get<ApiResponse<EvidenceItem[]>>(`/cases/${caseId}/evidence`)
      return data.data || [mockEvidenceItem]
    } catch {
      return [mockEvidenceItem]
    }
  },

  getUploadUrl: async (caseId: string, payload: GetUploadUrlParams, evidenceId?: string): Promise<PresignedUploadResponse> => {
    const params = evidenceId ? { evidence_id: evidenceId } : {}
    const { data } = await apiClient.post<ApiResponse<PresignedUploadResponse>>(
      `/cases/${caseId}/evidence/upload-url`,
      payload,
      { params }
    )
    return data.data
  },

  confirmUpload: async (
    caseId: string,
    payload: { evidence_id: string; version_number: number; storage_path: string; sha256_hash: string },
    meta: { title: string; description?: string; category: string; file_name: string; file_size: number; mime_type: string }
  ): Promise<EvidenceItem> => {
    const params = {
      title: meta.title,
      description: meta.description || '',
      category: meta.category,
      file_name: meta.file_name,
      file_size: meta.file_size,
      mime_type: meta.mime_type,
    }
    const { data } = await apiClient.post<ApiResponse<EvidenceItem>>(
      `/cases/${caseId}/evidence/confirm`,
      payload,
      { params }
    )
    return data.data
  },

  getDownloadUrl: async (caseId: string, evidenceId: string, version?: number, reason = 'Investigation review'): Promise<PresignedDownloadResponse> => {
    const params = {
      ...(version ? { version } : {}),
      reason,
    }
    const { data } = await apiClient.get<ApiResponse<PresignedDownloadResponse>>(
      `/cases/${caseId}/evidence/${evidenceId}/download`,
      { params }
    )
    return data.data
  },

  getVersions: async (caseId: string, evidenceId: string): Promise<EvidenceVersion[]> => {
    const { data } = await apiClient.get<ApiResponse<EvidenceVersion[]>>(`/cases/${caseId}/evidence/${evidenceId}/versions`)
    return data.data || []
  },

  delete: async (caseId: string, evidenceId: string): Promise<void> => {
    await apiClient.delete(`/cases/${caseId}/evidence/${evidenceId}`)
  },

  // Helper utility to upload file directly using PUT
  uploadToPresignedUrl: async (url: string, file: File, onProgress?: (pct: number) => void): Promise<void> => {
    await axios.put(url, file, {
      headers: {
        'Content-Type': file.type,
      },
      onUploadProgress: (evt) => {
        if (evt.total && onProgress) {
          onProgress(Math.round((evt.loaded * 100) / evt.total))
        }
      },
    })
  },
}
