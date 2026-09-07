import type { LucideIcon } from 'lucide-react'
import {
  AlertCircle,
  CheckCircle2,
  Link2,
  TriangleAlert,
} from 'lucide-react'

/** Canonical relationship statuses used by the UI. */
export type FactStatus = 'corroborated' | 'contradicted' | 'resolved' | 'review'

export type Tone = 'success' | 'danger' | 'info' | 'warning'

export type FactFilter = 'All' | FactStatus

export interface SourceEvidence {
  documentName: string
  page: string | null
  quote: string
  context?: string[]
}

export interface RelatedFact {
  id: string
  name: string
  value: string
  source: string
  snippet: string
  status: FactStatus
  confidence: string
}

export interface Fact {
  id: string
  name: string
  normalizedValue: string
  originalValue?: string
  primarySource: string
  snippet: string
  status: FactStatus
  confidence: string
  confidenceNumeric: number | null
  reasoning: string
  context: string[]
  sources: SourceEvidence[]
  relatedFacts: RelatedFact[]
  errorMessage?: string
  reviewNotes?: string
}

export interface DocumentMeta {
  name: string
  status: 'Complete' | 'Processing' | 'Error'
  date: string
  facts: number
  issues: number
  relationships: number
}

export interface FactsSummary {
  totalFacts: number
  totalDocuments: number
  completeDocuments: number
  processingDocuments: number
  relationshipsFound: number
  corroboratedCount: number
  resolvedCount: number
  contradictedCount: number
  needsReviewCount: number
  groundednessScore: number | null
}

export interface FactsResponse {
  facts: Fact[]
  documents: DocumentMeta[]
  summary: FactsSummary
  raw?: unknown
}

export interface UploadResponse {
  message: string
  uploadedFiles: string[]
  documentsProcessed?: number
  factsExtracted?: number
  jobId?: string
  raw?: unknown
}

export class ApiError extends Error {
  readonly status: number | null
  readonly code: string
  readonly details?: unknown

  constructor(
    message: string,
    options: { status?: number | null; code?: string; details?: unknown } = {},
  ) {
    super(message)
    this.name = 'ApiError'
    this.status = options.status ?? null
    this.code = options.code ?? 'API_ERROR'
    this.details = options.details
  }
}

export interface StatusMeta {
  label: string
  short: string
  icon: LucideIcon
  tone: Tone
}

export const STATUS_META: Record<FactStatus, StatusMeta> = {
  corroborated: {
    label: 'Corroborated',
    short: 'Same fact, different wording',
    icon: CheckCircle2,
    tone: 'success',
  },
  contradicted: {
    label: 'Contradicted',
    short: 'Material disagreement detected',
    icon: TriangleAlert,
    tone: 'danger',
  },
  resolved: {
    label: 'Context resolved',
    short: 'Different periods, compatible values',
    icon: Link2,
    tone: 'info',
  },
  review: {
    label: 'Needs review',
    short: 'Extraction confidence is low',
    icon: AlertCircle,
    tone: 'warning',
  },
}

/** Loose backend shapes — normalized before reaching UI components. */
export interface BackendSource {
  document?: string
  document_name?: string
  filename?: string
  name?: string
  page?: number | string | null
  page_number?: number | string | null
  quote?: string
  snippet?: string
  evidence?: string
  text?: string
  context?: Record<string, string> | string[] | null
}

export interface BackendFact {
  id?: string
  fact_id?: string
  name?: string
  fact?: string
  entity?: string
  topic?: string
  value?: string
  normalized_value?: string
  extracted_value?: string
  original_value?: string
  source?: string | BackendSource
  sources?: BackendSource[]
  evidence?: BackendSource[] | string
  snippet?: string
  quote?: string
  page?: number | string | null
  confidence?: number | string | null
  relationship?: string
  relationship_type?: string
  status?: string
  reasoning?: string
  explanation?: string
  context?: Record<string, string> | string[] | null
  related_facts?: BackendFact[]
  error?: string
  error_message?: string
  needs_review?: boolean
  review_notes?: string
}

export interface BackendDocument {
  name?: string
  filename?: string
  status?: string
  uploaded_at?: string
  date?: string
  facts?: number
  facts_count?: number
  issues?: number
  review_count?: number
  relationships?: number
  relationship_count?: number
}

export interface BackendSummary {
  total_facts?: number
  total_documents?: number
  complete_documents?: number
  processing_documents?: number
  relationships_found?: number
  corroborated?: number
  resolved?: number
  contradicted?: number
  needs_review?: number
  groundedness_score?: number
}

export type BackendFactsPayload =
  | BackendFact[]
  | {
      facts?: BackendFact[]
      documents?: BackendDocument[]
      summary?: BackendSummary
      data?: BackendFact[]
      results?: BackendFact[]
    }

export interface BackendUploadPayload {
  message?: string
  detail?: string
  uploaded?: string[]
  uploaded_files?: string[]
  files?: string[]
  documents_processed?: number
  facts_extracted?: number
  job_id?: string
}
