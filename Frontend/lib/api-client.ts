import { ApiError } from '@/lib/types'
import { auth } from '@/lib/firebase'

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '') ?? 'http://localhost:5000'

/** Form field name for multipart PDF uploads — change here if backend differs. */
export const UPLOAD_FIELD_NAME = 'files'

async function parseJsonSafe(response: Response): Promise<unknown> {
  const text = await response.text()
  if (!text.trim()) {
    return null
  }

  try {
    return JSON.parse(text) as unknown
  } catch {
    throw new ApiError('The server returned malformed JSON.', {
      status: response.status,
      code: 'MALFORMED_JSON',
      details: text.slice(0, 500),
    })
  }
}

export async function apiRequest<T>(
  path: string,
  init?: RequestInit,
  userUid?: string | null,
): Promise<T> {
  const url = `${API_BASE_URL}${path}`

  // 1. Asynchronously fetch the current user's token or fallback to UID
  let token = userUid
  if (!token && auth?.currentUser) {
    try {
      token = await auth.currentUser.getIdToken()
    } catch {
      token = auth.currentUser.uid
    }
  }
  if (!token && auth?.currentUser?.uid) {
    token = auth.currentUser.uid
  }

  const headers = new Headers(init?.headers || {})

  // 2. FormData Compatibility: Do NOT override Content-Type header if body is FormData
  // (allows browser to set multipart/form-data with boundary)
  if (init?.body instanceof FormData) {
    headers.delete('Content-Type')
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const requestOptions: RequestInit = {
    ...init,
    headers,
  }

  let response: Response
  try {
    response = await fetch(url, requestOptions)
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Unable to reach the FactLayer backend.'
    throw new ApiError(
      `Network error: ${message}. Is the Flask server running at ${API_BASE_URL}?`,
      { code: 'NETWORK_ERROR', details: error },
    )
  }

  const payload = await parseJsonSafe(response)

  if (!response.ok) {
    const message =
      extractErrorMessage(payload) ??
      `Request failed with status ${response.status}.`
    throw new ApiError(message, {
      status: response.status,
      code: 'HTTP_ERROR',
      details: payload,
    })
  }

  return payload as T
}

function extractErrorMessage(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') {
    return null
  }

  const record = payload as Record<string, unknown>

  if (Array.isArray(record.details) && record.details.length > 0) {
    const detailsStr = record.details.filter(Boolean).join('; ')
    if (detailsStr) {
      return record.error ? `${record.error}: ${detailsStr}` : detailsStr
    }
  }

  for (const key of ['message', 'error', 'detail', 'details']) {
    const value = record[key]
    if (typeof value === 'string' && value.trim()) {
      return value
    }
  }

  return null
}

export async function deleteDocument(
  filename: string,
): Promise<{ message: string; filename: string }> {
  return apiRequest<{ message: string; filename: string }>(
    `/documents/${encodeURIComponent(filename)}`,
    { method: 'DELETE' },
  )
}

export async function checkHealth(): Promise<{ status: string; service?: string }> {
  return apiRequest<{ status: string; service?: string }>('/health')
}
