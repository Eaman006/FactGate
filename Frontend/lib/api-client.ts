import { ApiError } from '@/lib/types'

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
): Promise<T> {
  const url = `${API_BASE_URL}${path}`

  let response: Response
  try {
    response = await fetch(url, init)
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


