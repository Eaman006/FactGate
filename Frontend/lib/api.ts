import { apiRequest, UPLOAD_FIELD_NAME } from '@/lib/api-client'
import { normalizeFactsResponse, normalizeUploadResponse } from '@/lib/normalize'
import type {
  BackendFactsPayload,
  BackendUploadPayload,
  FactsResponse,
  UploadResponse,
} from '@/lib/types'

export async function getFacts(userUid?: string | null): Promise<FactsResponse> {
  const payload = await apiRequest<BackendFactsPayload>(
    '/facts',
    {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    },
    userUid,
  )

  return normalizeFactsResponse(payload)
}

export async function uploadPdfs(files: File[], userUid?: string | null): Promise<UploadResponse> {
  const formData = new FormData()

  for (const file of files) {
    formData.append(UPLOAD_FIELD_NAME, file)
  }

  const payload = await apiRequest<BackendUploadPayload>(
    '/upload',
    {
      method: 'POST',
      body: formData,
    },
    userUid,
  )

  return normalizeUploadResponse(payload)
}

export async function deleteDocument(
  filename: string,
  userUid?: string | null,
): Promise<{ message: string; filename: string }> {
  return apiRequest<{ message: string; filename: string }>(
    `/documents/${encodeURIComponent(filename)}`,
    {
      method: 'DELETE',
    },
    userUid,
  )
}

export { API_BASE_URL, UPLOAD_FIELD_NAME } from '@/lib/api-client'
