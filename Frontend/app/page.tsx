'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  ArrowUpRight,
  Bell,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleDot,
  Copy,
  FileText,
  Filter,
  FolderOpen,
  Gauge,
  HelpCircle,
  Inbox,
  LayoutDashboard,
  Link2,
  Menu,
  MoreHorizontal,
  PanelRight,
  Plus,
  RefreshCw,
  Search,
  Settings2,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
  X,
  ZoomIn,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/status-badge'
import { UploadZone } from '@/components/upload-zone'
import { useFacts } from '@/hooks/use-facts'
import { useUpload } from '@/hooks/use-upload'
import { factMatchesSearch, getFactDetailSources } from '@/lib/normalize'
import { statusToTone } from '@/lib/status'
import type { Fact, FactFilter, FactStatus, FactsSummary } from '@/lib/types'
import { STATUS_META } from '@/lib/types'

function Sidebar({
  activeStatus,
  setActiveStatus,
  mobileOpen,
  setMobileOpen,
  statusCounts,
}: {
  activeStatus: FactStatus
  setActiveStatus: (status: FactStatus) => void
  mobileOpen: boolean
  setMobileOpen: (open: boolean) => void
  statusCounts: Record<FactStatus, number>
}) {
  return (
    <aside
      className={`fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-border bg-sidebar px-4 py-5 transition-transform lg:static lg:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
    >
      <div className="flex items-center justify-between px-2 pb-7">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <CircleDot className="size-4" />
          </div>
          <span className="text-[17px] font-bold tracking-tight">FactLayer</span>
        </div>
        <button
          aria-label="Close navigation"
          onClick={() => setMobileOpen(false)}
          className="rounded-md p-1 text-muted-foreground hover:bg-accent lg:hidden"
        >
          <X className="size-4" />
        </button>
      </div>
      <div className="mb-6 px-2">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Workspace
        </p>
        <button className="flex w-full items-center justify-between rounded-md border border-border bg-background px-3 py-2 text-left text-sm">
          <span className="flex items-center gap-2">
            <span className="flex size-5 items-center justify-center rounded bg-primary text-[9px] font-bold text-primary-foreground">
              AC
            </span>
            Acme Corp
          </span>
          <ChevronDown className="size-3.5 text-muted-foreground" />
        </button>
      </div>
      <nav className="flex flex-col gap-1" aria-label="Main navigation">
        {(
          [
            ['Overview', LayoutDashboard],
            ['Documents', FolderOpen],
            ['Facts', Sparkles],
            ['Relationships', Link2],
          ] as const
        ).map(([label, Icon]) => (
          <button
            key={label}
            className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm ${label === 'Overview' ? 'bg-sidebar-accent font-medium text-sidebar-accent-foreground' : 'text-muted-foreground hover:bg-sidebar-accent hover:text-foreground'}`}
          >
            <Icon className="size-4" />
            {label}
          </button>
        ))}
      </nav>
      <div className="mt-8">
        <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Relationship cases
        </p>
        <div className="flex flex-col gap-1">
          {(Object.keys(STATUS_META) as FactStatus[]).map((key) => {
            const item = STATUS_META[key]
            const Icon = item.icon
            return (
              <button
                key={key}
                onClick={() => {
                  setActiveStatus(key)
                  setMobileOpen(false)
                }}
                className={`flex items-center gap-3 rounded-md px-3 py-2 text-left text-xs ${activeStatus === key ? 'bg-sidebar-accent font-medium text-foreground' : 'text-muted-foreground hover:bg-sidebar-accent hover:text-foreground'}`}
              >
                <Icon className="size-3.5" />
                <span className="truncate">{item.label}</span>
                <span className="ml-auto text-[10px] text-muted-foreground">{statusCounts[key]}</span>
              </button>
            )
          })}
        </div>
      </div>
      <div className="mt-auto border-t border-sidebar-border pt-4">
        <button className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-sidebar-accent hover:text-foreground">
          <Settings2 className="size-4" />
          Workspace settings
        </button>
        <div className="mt-3 flex items-center gap-2.5 px-3">
          <div className="flex size-8 items-center justify-center rounded-full bg-accent text-xs font-semibold">
            JD
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs font-medium">Jordan Davis</p>
            <p className="truncate text-[11px] text-muted-foreground">Engineering</p>
          </div>
          <MoreHorizontal className="ml-auto size-4 text-muted-foreground" />
        </div>
      </div>
    </aside>
  )
}

function Kpi({
  label,
  value,
  caption,
  icon: Icon,
  accent,
}: {
  label: string
  value: string
  caption: string
  icon: React.ElementType
  accent?: string
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
        </div>
        <div className={`rounded-md p-2 ${accent ?? 'bg-muted text-muted-foreground'}`}>
          <Icon className="size-4" />
        </div>
      </div>
      <p className="mt-3 text-[11px] text-muted-foreground">{caption}</p>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-7">
      <div className="h-24 rounded-lg bg-muted" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-28 rounded-lg bg-muted" />
        ))}
      </div>
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(340px,.65fr)]">
        <div className="h-72 rounded-lg bg-muted" />
        <div className="h-72 rounded-lg bg-muted" />
      </div>
      <div className="h-[560px] rounded-lg bg-muted" />
    </div>
  )
}

function EmptyFactsState({ onScrollToUpload }: { onScrollToUpload: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card px-8 py-20 text-center">
      <Inbox className="size-8 text-muted-foreground" />
      <p className="mt-4 text-base font-semibold">No facts yet</p>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        Upload one or more PDF documents to extract facts, link evidence, and compare
        relationships across sources.
      </p>
      <Button className="mt-6 gap-2" onClick={onScrollToUpload}>
        <Plus className="size-4" />
        Upload PDFs
      </Button>
    </div>
  )
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-rose-200 bg-rose-50 px-8 py-16 text-center">
      <AlertCircle className="size-8 text-rose-700" />
      <p className="mt-4 text-base font-semibold text-rose-900">Unable to load facts</p>
      <p className="mt-2 max-w-lg text-sm text-rose-800">{message}</p>
      <Button className="mt-6 gap-2" variant="outline" onClick={onRetry}>
        <RefreshCw className="size-4" />
        Retry
      </Button>
    </div>
  )
}

function confidenceBarWidth(status: FactStatus, confidenceNumeric: number | null): string {
  if (confidenceNumeric !== null) {
    const pct = Math.round(confidenceNumeric * 100)
    return `${Math.max(8, Math.min(100, pct))}%`
  }

  if (status === 'contradicted') return '60%'
  if (status === 'review') return '38%'
  return '94%'
}

function buildPipelineSteps(summary: FactsSummary) {
  const totalFacts = summary.totalFacts
  const reviewCount = summary.needsReviewCount

  return [
    ['Extract facts', totalFacts > 0, `${totalFacts} candidate${totalFacts === 1 ? '' : 's'}`],
    [
      'Link source evidence',
      totalFacts > 0,
      totalFacts ? `${totalFacts} / ${totalFacts} grounded` : 'Waiting for documents',
    ],
    [
      'Compare relationships',
      summary.relationshipsFound > 0,
      `${summary.relationshipsFound} relationship${summary.relationshipsFound === 1 ? '' : 's'}`,
    ],
    [
      'Review exceptions',
      reviewCount === 0,
      reviewCount ? `${reviewCount} need attention` : 'No exceptions',
    ],
  ] as const
}

function getRepresentativeFact(facts: Fact[], status: FactStatus): Fact | null {
  return facts.find((fact) => fact.status === status) ?? null
}

export default function Page() {
  const { data, loading, isRefetching, error, usingMockFallback, refetch } = useFacts()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [activeStatus, setActiveStatus] = useState<FactStatus>('corroborated')
  const [filter, setFilter] = useState<FactFilter>('All')
  const [query, setQuery] = useState('')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [toast, setToast] = useState('')

  const notify = useCallback((message: string) => {
    setToast(message)
    window.setTimeout(() => setToast(''), 2400)
  }, [])

  const upload = useUpload({
    onSuccess: async (response) => {
      notify(response.message || 'Documents uploaded successfully.')
      await refetch()
    },
  })

  const facts = data?.facts ?? []
  const documents = data?.documents ?? []
  const summary = data?.summary

  const statusCounts = useMemo(() => {
    const counts: Record<FactStatus, number> = {
      corroborated: 0,
      contradicted: 0,
      resolved: 0,
      review: 0,
    }
    for (const fact of facts) {
      counts[fact.status] += 1
    }
    return counts
  }, [facts])

  const filteredFacts = useMemo(
    () =>
      facts.filter(
        (fact) =>
          (filter === 'All' || fact.status === filter) && factMatchesSearch(fact, query),
      ),
    [facts, filter, query],
  )

  useEffect(() => {
    if (!facts.length) {
      setSelectedId(null)
      return
    }

    const stillVisible = selectedId && filteredFacts.some((fact) => fact.id === selectedId)
    if (stillVisible) {
      return
    }

    const selectedStillExists = selectedId && facts.some((fact) => fact.id === selectedId)
    if (selectedStillExists && filteredFacts.length) {
      return
    }

    if (selectedId && facts.some((fact) => fact.id === selectedId)) {
      return
    }

    const fallback =
      filteredFacts[0] ??
      facts.find((fact) => fact.status === activeStatus) ??
      facts[0]

    setSelectedId(fallback?.id ?? null)
  }, [facts, filteredFacts, selectedId, activeStatus])

  const selectedFact =
    facts.find((fact) => fact.id === selectedId) ??
    filteredFacts[0] ??
    facts[0] ??
    null

  const detailSources = selectedFact ? getFactDetailSources(selectedFact) : []
  const primarySource = detailSources[0]

  const scrollToUpload = () => {
    document.getElementById('upload-zone')?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSelectFact = (fact: Fact) => {
    setSelectedId(fact.id)
    setActiveStatus(fact.status)
  }

  const handleSelectStatusCase = (status: FactStatus) => {
    setActiveStatus(status)
    setFilter(status)
    const representative = getRepresentativeFact(facts, status)
    if (representative) {
      setSelectedId(representative.id)
    }
    document.getElementById('fact-explorer')?.scrollIntoView({ behavior: 'smooth' })
  }

  const showEmpty = !loading && !error && facts.length === 0
  const showError = !loading && !!error && !facts.length && !usingMockFallback

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen">
        <Sidebar
          activeStatus={activeStatus}
          setActiveStatus={(status) => {
            setActiveStatus(status)
            handleSelectStatusCase(status)
          }}
          mobileOpen={mobileOpen}
          setMobileOpen={setMobileOpen}
          statusCounts={statusCounts}
        />
        {mobileOpen && (
          <button
            aria-label="Close navigation overlay"
            className="fixed inset-0 z-20 bg-foreground/20 lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}
        <main className="min-w-0 flex-1">
          <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-border bg-background/95 px-5 backdrop-blur md:px-8">
            <div className="flex items-center gap-3">
              <button
                aria-label="Open navigation"
                onClick={() => setMobileOpen(true)}
                className="rounded-md p-2 hover:bg-accent lg:hidden"
              >
                <Menu className="size-5" />
              </button>
              <div>
                <p className="text-[11px] text-muted-foreground">Workspace / Knowledge layer</p>
                <h1 className="text-sm font-semibold">Overview</h1>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden items-center gap-2 rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground sm:flex">
                <Search className="size-3.5" />
                <span>Search anything</span>
                <kbd className="ml-3 rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px]">
                  ⌘ K
                </kbd>
              </div>
              <button
                aria-label="Refresh facts"
                onClick={() => void refetch()}
                className="rounded-md p-2 text-muted-foreground hover:bg-accent"
                disabled={loading || isRefetching}
              >
                <RefreshCw className={`size-4 ${isRefetching ? 'animate-spin' : ''}`} />
              </button>
              <button aria-label="Notifications" className="rounded-md p-2 text-muted-foreground hover:bg-accent">
                <Bell className="size-4" />
              </button>
              <div className="hidden items-center gap-2 border-l border-border pl-3 md:flex">
                <span
                  className={`size-2 rounded-full ${error && !facts.length ? 'bg-amber-500' : 'bg-emerald-500'}`}
                />
                <span className="text-xs text-muted-foreground">
                  {error && !facts.length ? 'Backend unavailable' : 'Pipeline healthy'}
                </span>
              </div>
            </div>
          </header>

          <div className="mx-auto max-w-[1500px] px-5 py-7 md:px-8">
            <section className="mb-7 flex flex-col justify-between gap-4 md:flex-row md:items-end">
              <div>
                <div className="mb-2 flex items-center gap-2 text-xs font-medium text-emerald-700">
                  <ShieldCheck className="size-3.5" />
                  Evidence-grounded intelligence
                </div>
                <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">Good morning, Jordan</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {loading
                    ? 'Loading your knowledge layer…'
                    : facts.length
                      ? 'Your knowledge layer is up to date. Inspect facts and their source evidence below.'
                      : 'Upload PDFs to build your evidence-grounded knowledge layer.'}
                </p>
                {usingMockFallback && (
                  <p className="mt-2 text-xs text-amber-700">
                    Demo fixture active — connect the Flask backend for live data.
                  </p>
                )}
              </div>
              <Button onClick={scrollToUpload} className="gap-2 self-start md:self-auto">
                <Plus className="size-4" />
                Add documents
              </Button>
            </section>

            {loading && !data ? (
              <LoadingSkeleton />
            ) : showError ? (
              <ErrorState message={error ?? 'Unknown error'} onRetry={() => void refetch()} />
            ) : (
              <>
                {summary && (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <Kpi
                      label="Documents"
                      value={String(summary.totalDocuments)}
                      caption={`${summary.completeDocuments} complete · ${summary.processingDocuments} processing`}
                      icon={FileText}
                    />
                    <Kpi
                      label="Facts extracted"
                      value={String(summary.totalFacts)}
                      caption={`Across ${summary.totalDocuments} source document${summary.totalDocuments === 1 ? '' : 's'}`}
                      icon={Sparkles}
                      accent="bg-sky-50 text-sky-700"
                    />
                    <Kpi
                      label="Relationships found"
                      value={String(summary.relationshipsFound)}
                      caption={`${summary.corroboratedCount} corroborated · ${summary.resolvedCount} resolved`}
                      icon={Link2}
                      accent="bg-violet-50 text-violet-700"
                    />
                    <Kpi
                      label="Needs review"
                      value={String(summary.needsReviewCount)}
                      caption="Low confidence or conflicts"
                      icon={TriangleAlert}
                      accent="bg-amber-50 text-amber-700"
                    />
                  </div>
                )}

                <div className="mt-7 grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(340px,.65fr)]">
                  <UploadZone
                    selectedFiles={upload.selectedFiles}
                    stage={upload.stage}
                    progress={upload.progress}
                    stageLabel={upload.stageLabel}
                    detailLabel={upload.detailLabel}
                    error={upload.error}
                    isDragging={upload.isDragging}
                    isBusy={upload.isBusy}
                    recentDocuments={documents}
                    onAddFiles={upload.addFiles}
                    onRemoveFile={upload.removeFile}
                    onUpload={() => void upload.upload()}
                    onRetry={() => void upload.retry()}
                    onDragStateChange={upload.setDragging}
                  />

                  {summary && (
                    <section className="rounded-lg border border-border bg-card p-5">
                      <div className="mb-4 flex items-center justify-between">
                        <div>
                          <h3 className="text-sm font-semibold">Pipeline activity</h3>
                          <p className="mt-1 text-xs text-muted-foreground">Latest ingestion run</p>
                        </div>
                        <Button variant="ghost" size="icon" aria-label="Pipeline details">
                          <ArrowUpRight className="size-4" />
                        </Button>
                      </div>
                      <div className="flex flex-col gap-4">
                        {buildPipelineSteps(summary).map(([label, complete, detail]) => (
                          <div key={label} className="flex items-center gap-3">
                            <div
                              className={`flex size-6 items-center justify-center rounded-full ${complete ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}
                            >
                              {complete ? (
                                <Check className="size-3.5" />
                              ) : (
                                <TriangleAlert className="size-3.5" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex justify-between gap-2">
                                <span className="text-xs font-medium">{label}</span>
                                <span className="text-[11px] text-muted-foreground">{detail}</span>
                              </div>
                              <div className="mt-1 h-1 rounded-full bg-muted">
                                <div
                                  className={`h-full rounded-full ${complete ? 'w-full bg-emerald-500' : 'w-1/3 bg-amber-500'}`}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-5 rounded-md bg-muted/60 p-3">
                        <p className="flex items-center gap-2 text-xs font-medium">
                          <Gauge className="size-3.5 text-muted-foreground" />
                          Groundedness score{' '}
                          <span className="ml-auto font-mono">
                            {summary.groundednessScore ?? '—'}
                            {summary.groundednessScore !== null ? ' / 100' : ''}
                          </span>
                        </p>
                        <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                          Every extracted fact is linked to a source passage. Conflicts remain visible
                          for human review.
                        </p>
                      </div>
                    </section>
                  )}
                </div>

                {showEmpty ? (
                  <div className="mt-7">
                    <EmptyFactsState onScrollToUpload={scrollToUpload} />
                  </div>
                ) : (
                  <>
                    <section id="fact-explorer" className="mt-7">
                      <div className="mb-4 flex flex-col justify-between gap-3 md:flex-row md:items-end">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-semibold">Fact explorer</h3>
                            <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                              {facts.length} facts
                            </span>
                            {isRefetching && (
                              <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                <RefreshCw className="size-3 animate-spin" />
                                Refreshing
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">
                            Search normalized facts, then trace them back to the exact source passage.
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2">
                            <Search className="size-3.5 text-muted-foreground" />
                            <input
                              aria-label="Search facts"
                              value={query}
                              onChange={(event) => setQuery(event.target.value)}
                              placeholder="Search facts, entities, or documents..."
                              className="w-48 bg-transparent text-xs outline-none placeholder:text-muted-foreground"
                            />
                          </div>
                          <Button variant="outline" size="sm" className="gap-2">
                            <Filter className="size-3.5" />
                            Filter
                          </Button>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1 border-b border-border">
                        {(['All', 'corroborated', 'contradicted', 'resolved', 'review'] as const).map(
                          (item) => (
                            <button
                              key={item}
                              onClick={() => setFilter(item === 'All' ? 'All' : item)}
                              className={`border-b-2 px-3 py-2 text-xs font-medium capitalize transition-colors ${filter === item ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                            >
                              {item === 'All' ? 'All facts' : STATUS_META[item].label}
                              <span className="ml-1.5 text-[10px] text-muted-foreground">
                                {item === 'All'
                                  ? facts.length
                                  : facts.filter((row) => row.status === item).length}
                              </span>
                            </button>
                          ),
                        )}
                      </div>
                    </section>

                    <div className="mt-4 grid overflow-hidden rounded-lg border border-border bg-card xl:grid-cols-[minmax(380px,.85fr)_minmax(0,1.15fr)]">
                      <div className="min-h-[560px] border-b border-border xl:border-b-0 xl:border-r">
                        <div className="flex items-center justify-between border-b border-border px-4 py-3">
                          <span className="text-xs font-semibold">Extracted facts</span>
                          <span className="text-[11px] text-muted-foreground">
                            {filteredFacts.length} shown
                          </span>
                        </div>
                        <div className="flex flex-col">
                          {filteredFacts.length ? (
                            filteredFacts.map((fact) => (
                              <button
                                key={fact.id}
                                onClick={() => handleSelectFact(fact)}
                                className={`border-b border-border px-4 py-4 text-left transition-colors hover:bg-muted/50 ${selectedFact?.id === fact.id ? 'bg-muted/60' : ''}`}
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0">
                                    <p className="truncate text-sm font-medium">{fact.name}</p>
                                    <p className="mt-1 font-mono text-base font-semibold tracking-tight">
                                      {fact.normalizedValue}
                                    </p>
                                  </div>
                                  <StatusBadge tone={statusToTone(fact.status)}>
                                    {STATUS_META[fact.status].label}
                                  </StatusBadge>
                                </div>
                                <div className="mt-3 flex items-center justify-between gap-3 text-[11px] text-muted-foreground">
                                  <span className="flex min-w-0 items-center gap-1.5 truncate">
                                    <FileText className="size-3" />
                                    {fact.primarySource}
                                  </span>
                                  <span className="shrink-0 font-mono">{fact.confidence} confidence</span>
                                </div>
                                <p className="mt-2 truncate text-[11px] text-muted-foreground">
                                  “{fact.snippet}”
                                </p>
                              </button>
                            ))
                          ) : (
                            <div className="flex flex-col items-center justify-center px-8 py-20 text-center">
                              <Search className="size-6 text-muted-foreground" />
                              <p className="mt-3 text-sm font-medium">No facts match</p>
                              <p className="mt-1 text-xs text-muted-foreground">
                                Try another search or clear the current filter.
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {selectedFact && primarySource && (
                        <div className="min-w-0 bg-muted/20">
                          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-3">
                            <div className="flex items-center gap-2">
                              <PanelRight className="size-4 text-muted-foreground" />
                              <span className="text-xs font-semibold">Fact inspection</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                className="rounded p-1.5 text-muted-foreground hover:bg-muted"
                                aria-label="Copy fact"
                                onClick={() => notify('Fact copied to clipboard')}
                              >
                                <Copy className="size-3.5" />
                              </button>
                              <button
                                className="rounded p-1.5 text-muted-foreground hover:bg-muted"
                                aria-label="More fact actions"
                              >
                                <MoreHorizontal className="size-4" />
                              </button>
                            </div>
                          </div>
                          <div className="p-5">
                            <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
                              <div>
                                <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                                  Normalized fact
                                </p>
                                <h4 className="mt-1 text-xl font-semibold tracking-tight">
                                  {selectedFact.name}
                                </h4>
                                <p className="mt-1 font-mono text-3xl font-semibold tracking-tight">
                                  {selectedFact.normalizedValue}
                                </p>
                                {selectedFact.originalValue && (
                                  <p className="mt-1 text-xs text-muted-foreground">
                                    Extracted value: {selectedFact.originalValue}
                                  </p>
                                )}
                              </div>
                              <StatusBadge tone={statusToTone(selectedFact.status)}>
                                {STATUS_META[selectedFact.status].label}
                              </StatusBadge>
                            </div>

                            <div className="mt-5 grid gap-3 sm:grid-cols-3">
                              <div className="rounded-md border border-border bg-card p-3">
                                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                                  Confidence
                                </p>
                                <p className="mt-1 text-sm font-semibold">{selectedFact.confidence}</p>
                                <div className="mt-2 h-1 rounded-full bg-muted">
                                  <div
                                    className={`h-full rounded-full ${selectedFact.status === 'contradicted' ? 'bg-rose-500' : selectedFact.status === 'review' ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                    style={{
                                      width: confidenceBarWidth(
                                        selectedFact.status,
                                        selectedFact.confidenceNumeric,
                                      ),
                                    }}
                                  />
                                </div>
                              </div>
                              <div className="rounded-md border border-border bg-card p-3">
                                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                                  Primary source
                                </p>
                                <p className="mt-1 truncate text-xs font-medium">
                                  {primarySource.documentName}
                                </p>
                                <p className="mt-1 text-[11px] text-muted-foreground">
                                  {primarySource.page ?? 'Page not provided'}
                                </p>
                              </div>
                              <div className="rounded-md border border-border bg-card p-3">
                                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                                  Evidence links
                                </p>
                                <p className="mt-1 text-sm font-semibold">{detailSources.length} sources</p>
                                <p className="mt-1 text-[11px] text-muted-foreground">
                                  Direct quote matches
                                </p>
                              </div>
                            </div>

                            <div className="mt-5 grid gap-4 2xl:grid-cols-[minmax(0,1.05fr)_minmax(300px,.95fr)]">
                              <div className="rounded-md border border-border bg-card p-4">
                                <div className="mb-4 flex items-center justify-between">
                                  <div>
                                    <p className="text-xs font-semibold">Source evidence</p>
                                    <p className="mt-1 text-[11px] text-muted-foreground">
                                      {primarySource.documentName} ·{' '}
                                      {primarySource.page ?? 'Page not provided'}
                                    </p>
                                  </div>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => notify('Source viewer opened')}
                                    className="gap-1.5"
                                  >
                                    <BookOpen className="size-3.5" />
                                    Open source
                                  </Button>
                                </div>
                                <div className="relative min-h-[185px] overflow-hidden rounded border border-border bg-[#fbfaf7] p-5 font-serif text-[12px] leading-6 text-slate-700 shadow-inner">
                                  <div className="absolute right-4 top-3 flex items-center gap-1 font-sans text-[10px] text-slate-400">
                                    <ZoomIn className="size-3" />
                                    {primarySource.page ?? 'Page not provided'}
                                  </div>
                                  <p className="mb-3 font-sans text-[9px] font-bold uppercase tracking-[0.18em] text-slate-400">
                                    {primarySource.documentName.replace(/_/g, ' ').replace(/\.pdf$/i, '')}
                                  </p>
                                  <p>
                                    The following passage was returned by the backend as grounded evidence
                                    for this fact.
                                  </p>
                                  <p className="my-1 rounded-sm bg-amber-200/80 px-1 text-slate-900 ring-1 ring-amber-300">
                                    {primarySource.quote}
                                  </p>
                                  {selectedFact.context.length ? (
                                    <p className="text-[11px] text-slate-500">
                                      Context: {selectedFact.context.join(' · ')}
                                    </p>
                                  ) : (
                                    <p className="text-[11px] text-slate-500">
                                      Context not provided by API
                                    </p>
                                  )}
                                </div>
                                <div className="mt-3 flex items-center gap-2 text-[11px] text-muted-foreground">
                                  <span className="size-2 rounded-sm bg-amber-300" />
                                  Highlighted passage is the evidence used for this fact
                                </div>
                              </div>

                              <div className="flex flex-col gap-4">
                                <div className="rounded-md border border-border bg-card p-4">
                                  <div className="flex items-center gap-2">
                                    <Sparkles className="size-4 text-primary" />
                                    <p className="text-xs font-semibold">Why this relationship?</p>
                                  </div>
                                  <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                                    {selectedFact.reasoning}
                                  </p>
                                  {selectedFact.errorMessage && (
                                    <p className="mt-3 rounded border border-amber-200 bg-amber-50 px-2 py-1.5 text-[11px] text-amber-800">
                                      {selectedFact.errorMessage}
                                    </p>
                                  )}
                                  {selectedFact.reviewNotes && (
                                    <p className="mt-2 text-[11px] text-muted-foreground">
                                      Review notes: {selectedFact.reviewNotes}
                                    </p>
                                  )}
                                  <div className="mt-3 flex flex-wrap gap-1.5">
                                    {selectedFact.context.length ? (
                                      selectedFact.context.map((tag) => (
                                        <span
                                          key={tag}
                                          className="rounded border border-border bg-muted px-2 py-1 text-[10px] text-muted-foreground"
                                        >
                                          {tag}
                                        </span>
                                      ))
                                    ) : (
                                      <span className="text-[10px] text-muted-foreground">
                                        Context not provided by API
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <div className="rounded-md border border-border bg-card p-4">
                                  <div className="mb-3 flex items-center justify-between">
                                    <p className="text-xs font-semibold">Related evidence</p>
                                    <span className="text-[11px] text-muted-foreground">
                                      {detailSources.length} documents
                                    </span>
                                  </div>
                                  <div className="flex flex-col gap-3">
                                    {detailSources.map((doc, index) => (
                                      <div key={`${doc.documentName}-${index}`} className="flex gap-2.5">
                                        <div
                                          className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold ${index === 0 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
                                        >
                                          {index + 1}
                                        </div>
                                        <div className="min-w-0">
                                          <p className="truncate text-xs font-medium">
                                            {doc.documentName}{' '}
                                            <span className="font-normal text-muted-foreground">
                                              · {doc.page ?? 'Page not provided'}
                                            </span>
                                          </p>
                                          <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-muted-foreground">
                                            “{doc.quote}”
                                          </p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="mt-4 flex flex-wrap items-center gap-2">
                              <Button size="sm" onClick={() => notify('Comparison queued')}>
                                Compare facts <ArrowUpRight className="ml-1 size-3.5" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => notify('Fact flagged for review')}
                              >
                                Flag for review
                              </Button>
                              {selectedFact.status === 'review' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    notify('Extraction retry queued')
                                    void refetch()
                                  }}
                                  className="gap-1.5"
                                >
                                  <RefreshCw className="size-3.5" />
                                  Retry extraction
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <section className="mt-7">
                      <div className="mb-4 flex items-end justify-between">
                        <div>
                          <h3 className="text-base font-semibold">Relationship cases</h3>
                          <p className="mt-1 text-xs text-muted-foreground">
                            See how FactLayer handles agreement, conflict, context, and uncertainty.
                          </p>
                        </div>
                        <span className="hidden items-center gap-1.5 text-[11px] text-muted-foreground sm:flex">
                          <HelpCircle className="size-3.5" />
                          Driven by live backend relationship states
                        </span>
                      </div>
                      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                        {(Object.keys(STATUS_META) as FactStatus[]).map((key) => {
                          const meta = STATUS_META[key]
                          const representative = getRepresentativeFact(facts, key)
                          const Icon = meta.icon
                          return (
                            <button
                              key={key}
                              onClick={() => handleSelectStatusCase(key)}
                              className={`rounded-lg border p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-sm ${activeStatus === key ? 'border-primary/50 bg-card shadow-sm' : 'border-border bg-card'}`}
                            >
                              <div className="flex items-center justify-between">
                                <span
                                  className={`flex size-8 items-center justify-center rounded-md ${meta.tone === 'success' ? 'bg-emerald-50 text-emerald-700' : meta.tone === 'danger' ? 'bg-rose-50 text-rose-700' : meta.tone === 'info' ? 'bg-sky-50 text-sky-700' : 'bg-amber-50 text-amber-700'}`}
                                >
                                  <Icon className="size-4" />
                                </span>
                                <ChevronRight className="size-4 text-muted-foreground" />
                              </div>
                              <p className="mt-4 text-sm font-semibold">{meta.label}</p>
                              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                                {meta.short}
                              </p>
                              <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                                <span className="font-mono text-xs">
                                  {representative?.name ?? 'No example yet'}
                                </span>
                                <span className="text-[10px] text-muted-foreground">
                                  {statusCounts[key]} fact{statusCounts[key] === 1 ? '' : 's'}
                                </span>
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    </section>

                    {documents.length > 0 && (
                      <section className="mt-7 pb-8">
                        <div className="mb-4 flex items-end justify-between">
                          <div>
                            <h3 className="text-base font-semibold">Recent documents</h3>
                            <p className="mt-1 text-xs text-muted-foreground">
                              Every source remains available for audit and review.
                            </p>
                          </div>
                          <Button variant="ghost" size="sm" className="gap-1.5">
                            View all <ChevronRight className="size-3.5" />
                          </Button>
                        </div>
                        <div className="overflow-x-auto rounded-lg border border-border bg-card">
                          <table className="w-full min-w-[700px] text-left">
                            <thead>
                              <tr className="border-b border-border text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                                <th className="px-4 py-3 font-medium">Document</th>
                                <th className="px-4 py-3 font-medium">Status</th>
                                <th className="px-4 py-3 font-medium">Uploaded</th>
                                <th className="px-4 py-3 font-medium">Facts</th>
                                <th className="px-4 py-3 font-medium">Review</th>
                                <th className="px-4 py-3 font-medium">Relations</th>
                                <th />
                              </tr>
                            </thead>
                            <tbody>
                              {documents.map((doc) => (
                                <tr
                                  key={doc.name}
                                  className="border-b border-border last:border-0 hover:bg-muted/40"
                                >
                                  <td className="px-4 py-3">
                                    <div className="flex items-center gap-2.5">
                                      <div className="rounded bg-muted p-1.5">
                                        <FileText className="size-3.5 text-muted-foreground" />
                                      </div>
                                      <span className="text-xs font-medium">{doc.name}</span>
                                    </div>
                                  </td>
                                  <td className="px-4 py-3">
                                    {doc.status === 'Complete' ? (
                                      <span className="flex items-center gap-1.5 text-xs text-emerald-700">
                                        <CheckCircle2 className="size-3.5" />
                                        Complete
                                      </span>
                                    ) : doc.status === 'Processing' ? (
                                      <span className="flex items-center gap-1.5 text-xs text-sky-700">
                                        <RefreshCw className="size-3.5 animate-spin" />
                                        Processing
                                      </span>
                                    ) : (
                                      <span className="flex items-center gap-1.5 text-xs text-rose-700">
                                        <AlertCircle className="size-3.5" />
                                        Error
                                      </span>
                                    )}
                                  </td>
                                  <td className="px-4 py-3 text-xs text-muted-foreground">{doc.date}</td>
                                  <td className="px-4 py-3 font-mono text-xs">{doc.facts}</td>
                                  <td className="px-4 py-3 font-mono text-xs">
                                    {doc.issues ? (
                                      <span className="text-amber-700">{doc.issues}</span>
                                    ) : (
                                      '—'
                                    )}
                                  </td>
                                  <td className="px-4 py-3 font-mono text-xs">{doc.relationships}</td>
                                  <td className="px-4 py-3 text-right">
                                    <button
                                      aria-label={`Open ${doc.name}`}
                                      className="rounded p-1.5 text-muted-foreground hover:bg-muted"
                                    >
                                      <MoreHorizontal className="size-4" />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </section>
                    )}
                  </>
                )}

                {error && facts.length > 0 && (
                  <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900">
                    Latest refresh failed: {error}. Showing previously loaded data.
                    <button
                      className="ml-2 underline"
                      onClick={() => void refetch()}
                    >
                      Retry
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>
      {toast && (
        <div
          role="status"
          className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-md border border-border bg-card px-4 py-3 text-xs font-medium shadow-lg"
        >
          <CheckCircle2 className="size-4 text-emerald-600" />
          {toast}
        </div>
      )}
    </div>
  )
}
