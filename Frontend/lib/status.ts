import type { FactStatus, Tone } from '@/lib/types'
import { STATUS_META } from '@/lib/types'

const STATUS_ALIASES: Record<string, FactStatus> = {
  corroborated: 'corroborated',
  corroborate: 'corroborated',
  confirmed: 'corroborated',
  confirm: 'corroborated',
  supporting: 'corroborated',
  support: 'corroborated',
  agree: 'corroborated',
  agreement: 'corroborated',
  matched: 'corroborated',

  contradicted: 'contradicted',
  contradict: 'contradicted',
  contradiction: 'contradicted',
  conflicting: 'contradicted',
  conflict: 'contradicted',
  disagree: 'contradicted',
  disagreement: 'contradicted',
  opposed: 'contradicted',

  resolved: 'resolved',
  context_resolved: 'resolved',
  contextually_resolved: 'resolved',
  reconciled: 'resolved',
  reconcile: 'resolved',
  explained: 'resolved',

  review: 'review',
  needs_review: 'review',
  'needs review': 'review',
  needsreview: 'review',
  error: 'review',
  failed: 'review',
  failure: 'review',
  uncertain: 'review',
  low_confidence: 'review',
  ambiguous: 'review',
  extraction_error: 'review',
  reasoning_failure: 'review',
}

export function normalizeRelationshipStatus(
  value: unknown,
  options: { needsReview?: boolean; hasError?: boolean } = {},
): FactStatus {
  if (options.needsReview || options.hasError) {
    return 'review'
  }

  if (typeof value !== 'string' || !value.trim()) {
    return 'review'
  }

  const key = value.trim().toLowerCase().replace(/[\s-]+/g, '_')
  const direct = STATUS_ALIASES[key]
  if (direct) {
    return direct
  }

  if (key.includes('corrobor')) return 'corroborated'
  if (key.includes('contradict') || key.includes('conflict')) return 'contradicted'
  if (key.includes('context') || key.includes('reconcil') || key.includes('resolv')) {
    return 'resolved'
  }
  if (key.includes('review') || key.includes('error') || key.includes('fail') || key.includes('uncertain')) {
    return 'review'
  }

  return 'review'
}

export function statusToTone(status: FactStatus): Tone {
  return STATUS_META[status].tone
}

export function formatConfidence(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === '') {
    return '—'
  }

  if (typeof value === 'number') {
    if (value <= 1) {
      return `${Math.round(value * 100)}%`
    }
    return `${Math.round(value)}%`
  }

  const trimmed = value.trim()
  if (trimmed.endsWith('%')) {
    return trimmed
  }

  const parsed = Number.parseFloat(trimmed)
  if (!Number.isNaN(parsed)) {
    return parsed <= 1 ? `${Math.round(parsed * 100)}%` : `${Math.round(parsed)}%`
  }

  return trimmed
}

export function parseConfidenceNumeric(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined || value === '') {
    return null
  }

  if (typeof value === 'number') {
    return value <= 1 ? value : value / 100
  }

  const trimmed = value.trim().replace('%', '')
  const parsed = Number.parseFloat(trimmed)
  if (Number.isNaN(parsed)) {
    return null
  }

  return parsed <= 1 ? parsed : parsed / 100
}

export function formatPage(page: number | string | null | undefined): string | null {
  if (page === null || page === undefined || page === '') {
    return null
  }

  if (typeof page === 'number') {
    return `p. ${page}`
  }

  const trimmed = page.trim()
  if (!trimmed) {
    return null
  }

  if (/^p\.?\s*\d+/i.test(trimmed)) {
    return trimmed.replace(/^p\.?\s*/i, 'p. ')
  }

  return `p. ${trimmed}`
}
