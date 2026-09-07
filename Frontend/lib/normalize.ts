import type {
  BackendDocument,
  BackendFact,
  BackendFactsPayload,
  BackendSource,
  BackendSummary,
  BackendUploadPayload,
  DocumentMeta,
  Fact,
  FactsResponse,
  FactsSummary,
  RelatedFact,
  SourceEvidence,
  UploadResponse,
} from '@/lib/types'
import {
  formatConfidence,
  formatPage,
  normalizeRelationshipStatus,
  parseConfidenceNumeric,
} from '@/lib/status'

const FALLBACK_SNIPPET = 'Source excerpt unavailable'
const FALLBACK_REASONING = 'No relationship reasoning was provided by the API.'
const FALLBACK_SOURCE = 'Source not provided'

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null
}

function pickString(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) {
      return value.trim()
    }
  }
  return ''
}

function normalizeContext(context: BackendFact['context']): string[] {
  if (!context) {
    return []
  }

  if (Array.isArray(context)) {
    return context
      .map((item) => (typeof item === 'string' ? item.trim() : String(item)))
      .filter(Boolean)
  }

  return Object.entries(context)
    .map(([key, value]) => {
      const label = key.replace(/_/g, ' ')
      return `${label.charAt(0).toUpperCase()}${label.slice(1)}: ${String(value)}`
    })
    .filter(Boolean)
}

function normalizeSourceEvidence(
  input: string | BackendSource | null | undefined,
  fallbackDocument?: string,
): SourceEvidence | null {
  if (!input) {
    return null
  }

  if (typeof input === 'string') {
    const trimmed = input.trim()
    if (!trimmed) {
      return null
    }

    return {
      documentName: fallbackDocument ?? FALLBACK_SOURCE,
      page: null,
      quote: trimmed,
    }
  }

  const documentName = pickString(
    input.document,
    input.document_name,
    input.filename,
    input.name,
    fallbackDocument,
  )

  const quote = pickString(input.quote, input.snippet, input.evidence, input.text)
  if (!documentName && !quote) {
    return null
  }

  return {
    documentName: documentName || FALLBACK_SOURCE,
    page: formatPage(input.page ?? input.page_number),
    quote: quote || FALLBACK_SNIPPET,
    context: normalizeContext(input.context ?? undefined),
  }
}

function collectSources(fact: BackendFact): SourceEvidence[] {
  const sources: SourceEvidence[] = []
  const primaryDocument = pickString(
    typeof fact.source === 'string' ? fact.source : undefined,
    fact.source && typeof fact.source === 'object'
      ? pickString(
          fact.source.document,
          fact.source.document_name,
          fact.source.filename,
          fact.source.name,
        )
      : undefined,
  )

  const pushUnique = (source: SourceEvidence | null) => {
    if (!source) return
    const exists = sources.some(
      (item) =>
        item.documentName === source.documentName &&
        item.page === source.page &&
        item.quote === source.quote,
    )
    if (!exists) {
      sources.push(source)
    }
  }

  if (Array.isArray(fact.sources)) {
    for (const item of fact.sources) {
      pushUnique(normalizeSourceEvidence(item))
    }
  }

  if (Array.isArray(fact.evidence)) {
    for (const item of fact.evidence) {
      pushUnique(normalizeSourceEvidence(item, primaryDocument))
    }
  } else if (typeof fact.evidence === 'string') {
    pushUnique(normalizeSourceEvidence(fact.evidence, primaryDocument))
  }

  if (fact.source && typeof fact.source === 'object') {
    pushUnique(normalizeSourceEvidence(fact.source))
  }

  const inlineQuote = pickString(fact.quote, fact.snippet)
  if (inlineQuote) {
    pushUnique({
      documentName: primaryDocument || FALLBACK_SOURCE,
      page: formatPage(fact.page),
      quote: inlineQuote,
    })
  }

  if (!sources.length) {
    sources.push({
      documentName: primaryDocument || FALLBACK_SOURCE,
      page: formatPage(fact.page),
      quote: FALLBACK_SNIPPET,
    })
  }

  return sources
}

function buildFactId(fact: BackendFact, index: number): string {
  const explicit = pickString(fact.id, fact.fact_id)
  if (explicit) {
    return explicit
  }

  const name = pickString(fact.name, fact.fact, fact.entity, fact.topic, 'fact')
  const value = pickString(fact.normalized_value, fact.value, fact.extracted_value, 'value')
  const source = pickString(
    typeof fact.source === 'string' ? fact.source : undefined,
    fact.sources?.[0]?.document,
    fact.sources?.[0]?.filename,
    'source',
  )

  return `${name}-${value}-${source}-${index}`.toLowerCase().replace(/\s+/g, '-')
}

function normalizeRelatedFact(fact: BackendFact, index: number): RelatedFact {
  const sources = collectSources(fact)
  const primary = sources[0]

  return {
    id: buildFactId(fact, index),
    name: pickString(fact.name, fact.fact, fact.entity, fact.topic, 'Unknown fact'),
    value: pickString(
      fact.normalized_value,
      fact.value,
      fact.extracted_value,
      fact.original_value,
      '—',
    ),
    source: primary.documentName,
    snippet: primary.quote,
    status: normalizeRelationshipStatus(
      pickString(fact.relationship, fact.relationship_type, fact.status),
      {
        needsReview: fact.needs_review,
        hasError: Boolean(pickString(fact.error, fact.error_message)),
      },
    ),
    confidence: formatConfidence(fact.confidence),
  }
}

export function normalizeFact(fact: BackendFact, index: number): Fact | null {
  try {
    const sources = collectSources(fact)
    const primary = sources[0]
    const status = normalizeRelationshipStatus(
      pickString(fact.relationship, fact.relationship_type, fact.status),
      {
        needsReview: fact.needs_review,
        hasError: Boolean(pickString(fact.error, fact.error_message)),
      },
    )

    const normalizedValue = pickString(
      fact.normalized_value,
      fact.value,
      fact.extracted_value,
      '—',
    )

    const originalValue = pickString(fact.original_value, fact.extracted_value)
    const reasoning = pickString(fact.reasoning, fact.explanation) || FALLBACK_REASONING
    const context = normalizeContext(fact.context)

    const relatedFacts = Array.isArray(fact.related_facts)
      ? fact.related_facts
          .map((item, relatedIndex) => normalizeRelatedFact(item, relatedIndex))
          .filter(Boolean)
      : []

    return {
      id: buildFactId(fact, index),
      name: pickString(fact.name, fact.fact, fact.entity, fact.topic, 'Unknown fact'),
      normalizedValue,
      originalValue: originalValue && originalValue !== normalizedValue ? originalValue : undefined,
      primarySource: primary.documentName,
      snippet: primary.quote,
      status,
      confidence: formatConfidence(fact.confidence),
      confidenceNumeric: parseConfidenceNumeric(fact.confidence),
      reasoning,
      context,
      sources,
      relatedFacts,
      errorMessage: pickString(fact.error, fact.error_message) || undefined,
      reviewNotes: pickString(fact.review_notes) || undefined,
    }
  } catch {
    return null
  }
}

function normalizeDocument(doc: BackendDocument): DocumentMeta | null {
  const name = pickString(doc.name, doc.filename)
  if (!name) {
    return null
  }

  const statusRaw = pickString(doc.status, 'Complete').toLowerCase()
  let status: DocumentMeta['status'] = 'Complete'
  if (statusRaw.includes('process')) status = 'Processing'
  if (statusRaw.includes('error') || statusRaw.includes('fail')) status = 'Error'

  return {
    name,
    status,
    date: pickString(doc.uploaded_at, doc.date, '—'),
    facts: typeof doc.facts === 'number' ? doc.facts : doc.facts_count ?? 0,
    issues: typeof doc.issues === 'number' ? doc.issues : doc.review_count ?? 0,
    relationships:
      typeof doc.relationships === 'number'
        ? doc.relationships
        : doc.relationship_count ?? 0,
  }
}

function deriveDocumentsFromFacts(facts: Fact[]): DocumentMeta[] {
  const grouped = new Map<string, { facts: number; issues: number; relationships: number }>()

  for (const fact of facts) {
    for (const source of fact.sources) {
      const current = grouped.get(source.documentName) ?? {
        facts: 0,
        issues: 0,
        relationships: 0,
      }
      current.facts += 1
      if (fact.status === 'review' || fact.status === 'contradicted') {
        current.issues += 1
      }
      if (fact.status !== 'review') {
        current.relationships += Math.max(1, fact.relatedFacts.length)
      }
      grouped.set(source.documentName, current)
    }
  }

  return Array.from(grouped.entries()).map(([name, stats]) => ({
    name,
    status: 'Complete' as const,
    date: '—',
    facts: stats.facts,
    issues: stats.issues,
    relationships: stats.relationships,
  }))
}

function buildSummary(facts: Fact[], documents: DocumentMeta[], backend?: BackendSummary): FactsSummary {
  const corroboratedCount = facts.filter((f) => f.status === 'corroborated').length
  const resolvedCount = facts.filter((f) => f.status === 'resolved').length
  const contradictedCount = facts.filter((f) => f.status === 'contradicted').length
  const needsReviewCount = facts.filter((f) => f.status === 'review').length
  const relationshipsFound =
    backend?.relationships_found ??
    facts.filter((f) => f.status !== 'review').length

  const completeDocuments =
    backend?.complete_documents ??
    documents.filter((doc) => doc.status === 'Complete').length
  const processingDocuments =
    backend?.processing_documents ??
    documents.filter((doc) => doc.status === 'Processing').length

  const groundednessScore =
    typeof backend?.groundedness_score === 'number'
      ? backend.groundedness_score
      : facts.length
        ? Math.round(
            (facts.filter((f) => f.snippet !== FALLBACK_SNIPPET).length / facts.length) * 100,
          )
        : null

  return {
    totalFacts: backend?.total_facts ?? facts.length,
    totalDocuments: backend?.total_documents ?? documents.length,
    completeDocuments,
    processingDocuments,
    relationshipsFound,
    corroboratedCount: backend?.corroborated ?? corroboratedCount,
    resolvedCount: backend?.resolved ?? resolvedCount,
    contradictedCount: backend?.contradicted ?? contradictedCount,
    needsReviewCount: backend?.needs_review ?? needsReviewCount,
    groundednessScore,
  }
}

export function extractBackendFacts(payload: BackendFactsPayload): BackendFact[] {
  if (Array.isArray(payload)) {
    return payload
  }

  if (payload.facts && Array.isArray(payload.facts)) {
    return payload.facts
  }

  if (payload.data && Array.isArray(payload.data)) {
    return payload.data
  }

  if (payload.results && Array.isArray(payload.results)) {
    return payload.results
  }

  return []
}

export function normalizeFactsResponse(payload: BackendFactsPayload): FactsResponse {
  const backendFacts = extractBackendFacts(payload)
  const facts = backendFacts
    .map((fact, index) => normalizeFact(fact, index))
    .filter((fact): fact is Fact => Boolean(fact))

  const envelope = Array.isArray(payload) ? null : payload
  const backendDocuments = envelope?.documents ?? []
  let resolvedDocuments = backendDocuments
    .map((doc) => normalizeDocument(doc))
    .filter((doc): doc is DocumentMeta => Boolean(doc))

  if (!resolvedDocuments.length) {
    resolvedDocuments = deriveDocumentsFromFacts(facts)
  }
  const summary = buildSummary(facts, resolvedDocuments, envelope?.summary)

  return {
    facts,
    documents: resolvedDocuments,
    summary,
    raw: payload,
  }
}

export function normalizeUploadResponse(payload: BackendUploadPayload): UploadResponse {
  const uploadedFiles =
    payload.uploaded_files ?? payload.uploaded ?? payload.files ?? []

  return {
    message:
      pickString(payload.message, payload.detail) ||
      (uploadedFiles.length
        ? `Uploaded ${uploadedFiles.length} document${uploadedFiles.length === 1 ? '' : 's'}.`
        : 'Upload completed.'),
    uploadedFiles,
    documentsProcessed: payload.documents_processed,
    factsExtracted: payload.facts_extracted,
    jobId: payload.job_id,
    raw: payload,
  }
}

export function factMatchesSearch(fact: Fact, query: string): boolean {
  if (!query.trim()) {
    return true
  }

  const haystack = [
    fact.name,
    fact.normalizedValue,
    fact.originalValue ?? '',
    fact.primarySource,
    fact.snippet,
    fact.reasoning,
    ...fact.context,
    ...fact.sources.flatMap((source) => [
      source.documentName,
      source.quote,
      source.page ?? '',
      ...(source.context ?? []),
    ]),
    ...fact.relatedFacts.flatMap((related) => [
      related.name,
      related.value,
      related.source,
      related.snippet,
    ]),
  ]
    .join(' ')
    .toLowerCase()

  return haystack.includes(query.trim().toLowerCase())
}

export function getFactDetailSources(fact: Fact): SourceEvidence[] {
  if (fact.sources.length > 1) {
    return fact.sources
  }

  if (fact.relatedFacts.length) {
    const relatedSources = fact.relatedFacts.flatMap((related) =>
      related.snippet
        ? [
            {
              documentName: related.source,
              page: null,
              quote: related.snippet,
            } satisfies SourceEvidence,
          ]
        : [],
    )

    return [...fact.sources, ...relatedSources]
  }

  return fact.sources
}

export function isEmptyPayload(payload: unknown): boolean {
  if (payload === null || payload === undefined) {
    return true
  }

  if (Array.isArray(payload)) {
    return payload.length === 0
  }

  const record = asRecord(payload)
  if (!record) {
    return false
  }

  const facts = extractBackendFacts(payload as BackendFactsPayload)
  return facts.length === 0
}
