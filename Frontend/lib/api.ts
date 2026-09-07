import { apiRequest, UPLOAD_FIELD_NAME } from '@/lib/api-client'
import { normalizeFactsResponse, normalizeUploadResponse } from '@/lib/normalize'
import type {
  BackendFactsPayload,
  BackendUploadPayload,
  FactsResponse,
  UploadResponse,
} from '@/lib/types'

export async function getFacts(): Promise<FactsResponse> {
  const payload = await apiRequest<BackendFactsPayload>('/facts', {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  })

  return normalizeFactsResponse(payload)
}

export async function uploadPdfs(files: File[]): Promise<UploadResponse> {
  const formData = new FormData()

  for (const file of files) {
    formData.append(UPLOAD_FIELD_NAME, file)
  }

  const payload = await apiRequest<BackendUploadPayload>('/upload', {
    method: 'POST',
    body: formData,
  })

  return normalizeUploadResponse(payload)
}

export { API_BASE_URL, UPLOAD_FIELD_NAME } from '@/lib/api-client'
