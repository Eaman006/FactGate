'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { getFacts } from '@/lib/api'
import { MOCK_FACTS_FIXTURE } from '@/lib/mock-data'
import { ApiError, type FactsResponse } from '@/lib/types'

const USE_MOCK_FALLBACK = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true'

interface UseFactsResult {
  data: FactsResponse | null
  loading: boolean
  isRefetching: boolean
  error: string | null
  usingMockFallback: boolean
  refetch: () => Promise<FactsResponse | null>
}

export function useFacts(userUid?: string | null): UseFactsResult {
  const [data, setData] = useState<FactsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [isRefetching, setIsRefetching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [usingMockFallback, setUsingMockFallback] = useState(false)
  const hasLoadedRef = useRef(false)

  const refetch = useCallback(async (): Promise<FactsResponse | null> => {
    const isInitialLoad = !hasLoadedRef.current
    if (isInitialLoad) {
      setLoading(true)
    } else {
      setIsRefetching(true)
    }

    setError(null)
    setUsingMockFallback(false)

    try {
      const response = await getFacts(userUid)
      hasLoadedRef.current = true
      setData(response)
      return response
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Failed to load facts from the backend.'

      if (USE_MOCK_FALLBACK) {
        hasLoadedRef.current = true
        setData(MOCK_FACTS_FIXTURE)
        setUsingMockFallback(true)
        setError(`${message} Showing demo fixture because NEXT_PUBLIC_USE_MOCK_DATA=true.`)
        return MOCK_FACTS_FIXTURE
      }

      setError(message)
      return null
    } finally {
      setLoading(false)
      setIsRefetching(false)
    }
  }, [userUid])

  useEffect(() => {
    void refetch()
  }, [refetch])

  return {
    data,
    loading,
    isRefetching,
    error,
    usingMockFallback,
    refetch,
  }
}
