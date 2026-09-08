'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  AlertCircle,
  ArrowUpRight,
  Bell,
  BookOpen,
  Building2,
  Check,
  CheckCircle2,
  ChevronRight,
  Copy,
  CornerDownLeft,
  Edit2,
  FileText,
  Filter,
  FolderOpen,
  Gauge,
  HelpCircle,
  History,
  Inbox,
  Link2,
  Menu,
  MoreHorizontal,
  PanelRight,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Tag,
  Trash2,
  TriangleAlert,
  X,
  ZoomIn,
} from 'lucide-react'



import { Button } from '@/components/ui/button'
import { Sidebar, type View } from '@/components/sidebar'
import { StatusBadge } from '@/components/status-badge'
import { UploadZone } from '@/components/upload-zone'
import { useFacts } from '@/hooks/use-facts'
import { useSidebar } from '@/hooks/use-sidebar'
import { useUpload } from '@/hooks/use-upload'
import { checkHealth, deleteDocument } from '@/lib/api-client'
import { factMatchesSearch, getFactDetailSources } from '@/lib/normalize'
import { statusToTone } from '@/lib/status'
import type { Fact, FactFilter, FactStatus, FactsSummary } from '@/lib/types'
import { STATUS_META } from '@/lib/types'



const VIEW_LABELS: Record<View, string> = {
  overview: 'Overview',
  documents: 'Documents',
  facts: 'Facts',
  relationships: 'Relationships',
  settings: 'Workspace Management',
}


function Kpi({
  label,
  value,
  caption,
  icon: Icon,
  accent,
  onClick,
}: {
  label: string
  value: string
  caption: string
  icon: React.ElementType
  accent?: string
  onClick?: () => void
}) {
  return (
    <div
      onClick={onClick}
      className={`rounded-lg border border-border bg-card p-4 transition-all ${
        onClick ? 'cursor-pointer select-none hover:shadow-md hover:-translate-y-0.5' : ''
      }`}
    >
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
      <p className="mt-4 text-base font-semibold">No facts extracted yet</p>
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
  const sidebar = useSidebar()
  const [currentView, setCurrentView] = useState<View>('overview')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [filter, setFilter] = useState<FactFilter>('All')
  const [query, setQuery] = useState('')
  const [toast, setToast] = useState('')
  const [showDocUpload, setShowDocUpload] = useState(false)

  const notify = useCallback((message: string) => {
    setToast(message)
    window.setTimeout(() => setToast(''), 2400)
  }, [])

  const handleOpenSource = useCallback(
    (evidence: {
      document_name?: string
      documentName?: string
      page_number?: number | string | null
      page?: number | string | null
    }) => {
      const docName = evidence.document_name || evidence.documentName
      if (!docName) {
        notify('Source document unavailable')
        return
      }

      let pageNum: number | string | null = evidence.page_number ?? null
      if (pageNum === null || pageNum === undefined) {
        if (evidence.page) {
          const match = String(evidence.page).match(/\d+/)
          if (match) {
            pageNum = match[0]
          }
        }
      }

      const baseUrl = `http://localhost:5000/uploads/${docName}`
      const url =
        pageNum !== null && pageNum !== undefined && pageNum !== ''
          ? `${baseUrl}#page=${pageNum}`
          : baseUrl

      window.open(url, '_blank', 'noopener,noreferrer')
      notify(`Opening ${docName}${pageNum ? ` (Page ${pageNum})` : ''}`)
    },
    [notify],
  )

  const headerSearchRef = useRef<HTMLInputElement>(null)
  const searchContainerRef = useRef<HTMLDivElement>(null)
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [selectedIndex, setSelectedIndex] = useState<number>(-1)
  const [healthStatus, setHealthStatus] = useState<'healthy' | 'offline' | 'checking'>('checking')
  const [showHealthTooltip, setShowHealthTooltip] = useState(false)

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('factlayer_recent_searches')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed)) {
          setRecentSearches(parsed.slice(0, 5))
        }
      }
    } catch {
      // Ignore localStorage read error
    }
  }, [])

  const saveRecentSearch = useCallback((term: string) => {
    const trimmed = term.trim()
    if (!trimmed) return
    setRecentSearches((prev) => {
      const next = [
        trimmed,
        ...prev.filter((item) => item.toLowerCase() !== trimmed.toLowerCase()),
      ].slice(0, 5)
      try {
        localStorage.setItem('factlayer_recent_searches', JSON.stringify(next))
      } catch {
        // Ignore localStorage write error
      }
      return next
    })
  }, [])

  const clearRecentSearches = useCallback(() => {
    setRecentSearches([])
    try {
      localStorage.removeItem('factlayer_recent_searches')
    } catch {
      // Ignore localStorage remove error
    }
  }, [])

  const handleSelectSearchTerm = useCallback(
    (term: string) => {
      setQuery(term)
      saveRecentSearch(term)
      setIsSearchFocused(false)
      setSelectedIndex(-1)
      headerSearchRef.current?.blur()
    },
    [saveRecentSearch],
  )

  const [notifications, setNotifications] = useState<
    {
      id: string
      title: string
      description: string
      time: string
      unread: boolean
      type: 'upload' | 'fact' | 'system'
    }[]
  >([
    {
      id: '1',
      title: 'Corpus Initialized',
      description: 'SQLite database & Gemini-3.6-Flash pipeline connected.',
      time: '10m ago',
      unread: true,
      type: 'system',
    },
    {
      id: '2',
      title: 'Documents Ready',
      description: 'Corpus documents indexed and grounded facts available.',
      time: '5m ago',
      unread: true,
      type: 'fact',
    },
    {
      id: '3',
      title: 'Pipeline Health Check Passed',
      description: 'Connected to Flask API on Port 5000.',
      time: 'Just now',
      unread: true,
      type: 'system',
    },
  ])
  const [showNotifications, setShowNotifications] = useState(false)

  const unreadCount = useMemo(
    () => notifications.filter((n) => n.unread).length,
    [notifications],
  )

  const toggleNotifications = () => {
    setShowNotifications((prev) => !prev)
    if (!showNotifications) {
      setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })))
    }
  }

  // Keyboard listener for Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setIsSearchFocused(true)
        headerSearchRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Health ping interval
  useEffect(() => {
    let isMounted = true
    const pingHealth = async () => {
      try {
        const res = await checkHealth()
        if (isMounted) {
          setHealthStatus(res.status === 'ok' ? 'healthy' : 'offline')
        }
      } catch {
        if (isMounted) {
          setHealthStatus('offline')
        }
      }
    }

    pingHealth()
    const interval = setInterval(pingHealth, 15000)
    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [])

  // Click outside to close search dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setIsSearchFocused(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])


  const [deletingDoc, setDeletingDoc] = useState<string | null>(null)

  const handleDeleteDocument = async (filename: string) => {

    if (deletingDoc) return
    setDeletingDoc(filename)
    try {
      const res = await deleteDocument(filename)
      notify(res.message || `Document '${filename}' deleted.`)
      setNotifications((prev) => [
        {
          id: Date.now().toString(),
          title: 'Document Deleted',
          description: `Removed ${filename} from SQLite corpus.`,
          time: 'Just now',
          unread: true,
          type: 'system',
        },
        ...prev,
      ])
      await refetch()
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to delete document.'
      notify(`Delete failed: ${errorMsg}`)
    } finally {
      setDeletingDoc(null)
    }
  }

  interface WorkspaceItem {
    id: string
    name: string
    role: 'Owner' | 'Admin' | 'Member'
    isDefault?: boolean
    createdDate: string
  }

  const [workspacesList, setWorkspacesList] = useState<WorkspaceItem[]>([
    {
      id: 'ws-1',
      name: 'Acme Corp',
      role: 'Owner',
      isDefault: true,
      createdDate: 'Oct 12, 2024',
    },
    {
      id: 'ws-2',
      name: 'Personal Workspace',
      role: 'Admin',
      isDefault: false,
      createdDate: 'Nov 01, 2024',
    },
    {
      id: 'ws-3',
      name: 'Global Enterprise',
      role: 'Member',
      isDefault: false,
      createdDate: 'Dec 15, 2024',
    },
  ])

  const [newWorkspaceName, setNewWorkspaceName] = useState('')
  const [editingWsId, setEditingWsId] = useState<string | null>(null)
  const [editingWsName, setEditingWsName] = useState('')

  const handleCreateWorkspace = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = newWorkspaceName.trim()
    if (!trimmed) {
      notify('Workspace name cannot be empty.')
      return
    }
    const newWs: WorkspaceItem = {
      id: `ws-${Date.now()}`,
      name: trimmed,
      role: 'Owner',
      isDefault: false,
      createdDate: 'Just now',
    }
    setWorkspacesList((prev) => [...prev, newWs])
    setNewWorkspaceName('')
    notify(`Workspace '${trimmed}' created successfully.`)
  }

  const handleStartRenameWs = (ws: WorkspaceItem) => {
    setEditingWsId(ws.id)
    setEditingWsName(ws.name)
  }

  const handleSaveRenameWs = (id: string) => {
    const trimmed = editingWsName.trim()
    if (!trimmed) {
      notify('Workspace name cannot be empty.')
      return
    }
    setWorkspacesList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, name: trimmed } : item)),
    )
    notify(`Workspace renamed to '${trimmed}'.`)
    setEditingWsId(null)
    setEditingWsName('')
  }

  const handleDeleteWorkspace = (id: string, name: string) => {
    if (workspacesList.length <= 1) {
      notify('Cannot delete the only remaining workspace.')
      return
    }
    setWorkspacesList((prev) => prev.filter((item) => item.id !== id))
    notify(`Workspace '${name}' deleted.`)
  }

  const upload = useUpload({
    onSuccess: async (response) => {
      notify(response.message || 'Documents uploaded successfully.')
      setNotifications((prev) => [
        {
          id: Date.now().toString(),
          title: 'Document Ingestion Complete',
          description: response.message || 'Files processed and facts extracted.',
          time: 'Just now',
          unread: true,
          type: 'upload',
        },
        ...prev,
      ])
      await refetch()
    },
  })



  const facts = data?.facts ?? []
  const documents = data?.documents ?? []
  const summary = data?.summary

  // Generate predictive search suggestions from facts and documents
  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []

    const list: {
      id: string
      text: string
      type: 'fact' | 'document' | 'entity'
      subtitle?: string
    }[] = []
    const seen = new Set<string>()

    for (const doc of documents) {
      if (doc.name.toLowerCase().includes(q) && !seen.has(doc.name.toLowerCase())) {
        seen.add(doc.name.toLowerCase())
        list.push({
          id: `doc-${doc.name}`,
          text: doc.name,
          type: 'document',
          subtitle: `${doc.facts || 0} facts extracted`,
        })
      }
    }

    for (const fact of facts) {
      const nameLower = fact.name.toLowerCase()
      if (nameLower.includes(q) && !seen.has(nameLower)) {
        seen.add(nameLower)
        list.push({
          id: `fact-${fact.id}`,
          text: fact.name,
          type: 'fact',
          subtitle: fact.normalizedValue,
        })
      }
      const valLower = fact.normalizedValue.toLowerCase()
      if (valLower.includes(q) && !seen.has(valLower)) {
        seen.add(valLower)
        list.push({
          id: `val-${fact.id}`,
          text: `${fact.name}: ${fact.normalizedValue}`,
          type: 'entity',
          subtitle: `Confidence: ${fact.confidence}`,
        })
      }
    }

    return list.slice(0, 7)
  }, [query, facts, documents])

  // Current navigable items list in command palette dropdown
  const activeNavItems = useMemo(() => {
    if (!query.trim()) {
      return recentSearches.map((term) => ({ text: term, type: 'history' as const, subtitle: undefined }))
    }
    return suggestions.map((s) => ({ text: s.text, type: s.type, subtitle: s.subtitle }))
  }, [query, recentSearches, suggestions])

  // Reset selected highlight index when query or focus changes
  useEffect(() => {
    setSelectedIndex(-1)
  }, [query, isSearchFocused])

  // Keyboard navigation for dropdown menu
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isSearchFocused) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (activeNavItems.length === 0) return
      setSelectedIndex((prev) => (prev < activeNavItems.length - 1 ? prev + 1 : 0))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (activeNavItems.length === 0) return
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : activeNavItems.length - 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (selectedIndex >= 0 && selectedIndex < activeNavItems.length) {
        handleSelectSearchTerm(activeNavItems[selectedIndex].text)
      } else if (query.trim()) {
        handleSelectSearchTerm(query)
      }
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setIsSearchFocused(false)
      setSelectedIndex(-1)
      headerSearchRef.current?.blur()
    }
  }


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
      (filter !== 'All' ? facts.find((fact) => fact.status === filter) : undefined) ??
      facts[0]

    setSelectedId(fallback?.id ?? null)
  }, [facts, filteredFacts, selectedId, filter])

  const selectedFact =
    facts.find((fact) => fact.id === selectedId) ??
    filteredFacts[0] ??
    facts[0] ??
    null

  const detailSources = selectedFact ? getFactDetailSources(selectedFact) : []
  const primarySource = detailSources[0]

  const scrollToUpload = () => {
    if (currentView !== 'overview') {
      setCurrentView('overview')
      setTimeout(() => {
        document.getElementById('upload-zone')?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    } else {
      document.getElementById('upload-zone')?.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const scrollToExplorer = () => {
    document.getElementById('fact-explorer')?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSelectFact = (fact: Fact) => {
    setSelectedId(fact.id)
  }

  const handleFilterChange = (next: FactFilter) => {
    setFilter(next)
    if (next !== 'All') {
      const representative = getRepresentativeFact(facts, next)
      if (representative) {
        setSelectedId(representative.id)
      }
    }
    if (currentView === 'overview') {
      scrollToExplorer()
    }
  }

  const handleSelectStatusCase = (status: FactStatus) => {
    handleFilterChange(status)
    setCurrentView('relationships')
  }

  const showEmpty = !loading && !error && facts.length === 0
  const showError = !loading && !!error && !facts.length && !usingMockFallback

  return (
    <div className="flex h-svh overflow-hidden bg-background text-foreground">
      <Sidebar
        currentView={currentView}
        onViewChange={(view) => setCurrentView(view)}
        filter={filter}
        onFilterChange={(nextFilter) => {
          handleFilterChange(nextFilter)
          if (currentView === 'documents') {
            setCurrentView('relationships')
          }
        }}
        collapsed={sidebar.collapsed}
        onToggleCollapsed={sidebar.toggleCollapsed}
        mobileOpen={sidebar.mobileOpen}
        onCloseMobile={sidebar.closeMobile}
        statusCounts={statusCounts}
        totalFacts={facts.length}
        onNotify={notify}
      />
      {sidebar.mobileOpen && (
        <button
          aria-label="Close navigation overlay"
          className="fixed inset-0 z-20 bg-foreground/20 lg:hidden"
          onClick={sidebar.closeMobile}
        />
      )}

      <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        {/* Breadcrumb & Top Bar */}
        <header className="z-10 flex h-16 shrink-0 items-center justify-between border-b border-border bg-background/95 px-5 backdrop-blur md:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Toggle navigation"
              onClick={() => {
                if (window.innerWidth < 1024) {
                  sidebar.openMobile()
                } else {
                  sidebar.toggleCollapsed()
                }
              }}
              className="rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <Menu className="size-5" />
            </button>
            <div>
              <p className="text-[11px] text-muted-foreground">Workspace / Knowledge layer</p>
              <h1 className="text-sm font-semibold">{VIEW_LABELS[currentView]}</h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Global Command Palette Search */}
            <div
              ref={searchContainerRef}
              className="relative hidden items-center rounded-md border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground focus-within:border-primary focus-within:ring-1 focus-within:ring-primary sm:flex"
            >
              <Search className="size-3.5 shrink-0 text-muted-foreground" />
              <input
                ref={headerSearchRef}
                type="text"
                value={query}
                onFocus={() => setIsSearchFocused(true)}
                onKeyDown={handleSearchKeyDown}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search facts, entities, documents..."
                className="w-44 bg-transparent text-xs text-foreground outline-none placeholder:text-muted-foreground md:w-56"
              />
              {query ? (
                <button
                  type="button"
                  onClick={() => {
                    setQuery('')
                    setIsSearchFocused(true)
                    headerSearchRef.current?.focus()
                  }}
                  className="ml-1 rounded p-0.5 text-muted-foreground hover:bg-muted"
                  title="Clear search"
                >
                  <X className="size-3" />
                </button>
              ) : (
                <kbd className="ml-2 rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground select-none">
                  ⌘ K
                </kbd>
              )}

              {/* Command Palette Dropdown Menu */}
              {isSearchFocused && (
                <div className="absolute left-0 top-10 z-50 w-72 md:w-80 rounded-lg border border-border bg-white dark:bg-zinc-950 p-2 shadow-lg animate-in fade-in zoom-in-95">
                  {/* Empty State: Recent Searches */}
                  {!query.trim() && (
                    <div>
                      <div className="flex items-center justify-between px-2 py-1 border-b border-border mb-1">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                          <History className="size-3" /> Recent Searches
                        </span>
                        {recentSearches.length > 0 && (
                          <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={clearRecentSearches}
                            className="text-[10px] text-muted-foreground hover:text-rose-600 font-medium"
                          >
                            Clear history
                          </button>
                        )}
                      </div>
                      {recentSearches.length === 0 ? (
                        <p className="px-2 py-3 text-[11px] text-muted-foreground text-center">
                          No recent searches. Type to search facts & documents.
                        </p>
                      ) : (
                        <div className="flex flex-col gap-0.5">
                          {recentSearches.map((term, index) => (
                            <button
                              key={term}
                              type="button"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => handleSelectSearchTerm(term)}
                              className={`flex items-center gap-2.5 rounded-md px-2.5 py-2 text-xs text-left transition-colors ${
                                selectedIndex === index
                                  ? 'bg-primary/10 text-primary font-medium'
                                  : 'text-foreground hover:bg-muted'
                              }`}
                            >
                              <History className="size-3.5 text-muted-foreground shrink-0" />
                              <span className="truncate flex-1">{term}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Typing State: Predictive Suggestions */}
                  {query.trim() !== '' && (
                    <div>
                      <div className="px-2 py-1 border-b border-border mb-1">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                          <Sparkles className="size-3 text-primary" /> Suggestions ({suggestions.length})
                        </span>
                      </div>
                      {suggestions.length === 0 ? (
                        <p className="px-2 py-3 text-[11px] text-muted-foreground text-center">
                          No matching facts or documents found for “{query}”.
                        </p>
                      ) : (
                        <div className="flex flex-col gap-0.5">
                          {suggestions.map((item, index) => (
                            <button
                              key={item.id}
                              type="button"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => handleSelectSearchTerm(item.text)}
                              className={`flex items-center gap-2.5 rounded-md px-2.5 py-2 text-xs text-left transition-colors ${
                                selectedIndex === index
                                  ? 'bg-primary/10 text-primary font-medium'
                                  : 'text-foreground hover:bg-muted'
                              }`}
                            >
                              <div className="flex size-5 shrink-0 items-center justify-center rounded bg-muted text-muted-foreground">
                                {item.type === 'document' ? (
                                  <FileText className="size-3" />
                                ) : item.type === 'fact' ? (
                                  <Sparkles className="size-3" />
                                ) : (
                                  <Tag className="size-3" />
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="truncate font-medium leading-none">{item.text}</p>
                                {item.subtitle && (
                                  <p className="mt-1 truncate text-[10px] text-muted-foreground leading-none">
                                    {item.subtitle}
                                  </p>
                                )}
                              </div>
                              <CornerDownLeft className="size-3 text-muted-foreground opacity-50 ml-auto shrink-0" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>


            {/* Refresh Button */}
            <button
              type="button"
              aria-label="Refresh facts and documents"
              title="Re-fetch knowledge layer data"
              onClick={async () => {
                await refetch()
                notify('Knowledge layer data refreshed.')
              }}
              disabled={loading || isRefetching}
              className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-50"
            >
              <RefreshCw className={`size-4 ${isRefetching || loading ? 'animate-spin text-primary' : ''}`} />
            </button>

            {/* Notifications Bell Dropdown */}
            <div className="relative">
              <button
                type="button"
                aria-label="Notifications"
                title="Pipeline Activity Notifications"
                onClick={toggleNotifications}
                className="relative rounded-md p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <Bell className="size-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white ring-2 ring-background">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 top-11 z-50 w-80 rounded-lg border border-border bg-card p-4 shadow-xl animate-in fade-in zoom-in-95">
                  <div className="flex items-center justify-between border-b border-border pb-2.5">
                    <div className="flex items-center gap-1.5">
                      <Bell className="size-3.5 text-primary" />
                      <h4 className="text-xs font-semibold">Pipeline Activity Feed</h4>
                    </div>
                    <button
                      onClick={() => setShowNotifications(false)}
                      className="rounded p-1 text-muted-foreground hover:bg-muted"
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>
                  <div className="mt-3 flex flex-col gap-2.5 max-h-72 overflow-y-auto pr-1">
                    {notifications.length === 0 ? (
                      <p className="py-4 text-center text-xs text-muted-foreground">No recent activity.</p>
                    ) : (
                      notifications.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-start gap-2.5 rounded-md p-2 transition-colors hover:bg-muted/50"
                        >
                          <div className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                            {item.type === 'upload' ? (
                              <FileText className="size-3" />
                            ) : item.type === 'fact' ? (
                              <Sparkles className="size-3" />
                            ) : (
                              <Bell className="size-3" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium text-foreground">{item.title}</p>
                            <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
                              {item.description}
                            </p>
                            <p className="mt-1 font-mono text-[9px] text-muted-foreground">{item.time}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Pipeline Status Indicator with Hover Tooltip Popover */}
            <div
              className="relative hidden items-center gap-2 border-l border-border pl-3 md:flex"
              onMouseEnter={() => setShowHealthTooltip(true)}
              onMouseLeave={() => setShowHealthTooltip(false)}
            >
              <span
                className={`size-2.5 rounded-full ${
                  healthStatus === 'healthy'
                    ? 'bg-emerald-500 animate-pulse'
                    : healthStatus === 'offline'
                      ? 'bg-rose-500'
                      : 'bg-amber-500'
                }`}
              />
              <span className="text-xs text-muted-foreground font-medium select-none">
                {healthStatus === 'healthy'
                  ? 'Pipeline healthy'
                  : healthStatus === 'offline'
                    ? 'Backend offline'
                    : 'Checking pipeline...'}
              </span>

              {showHealthTooltip && (
                <div className="absolute right-0 top-9 z-50 whitespace-nowrap rounded-md border border-border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-md animate-in fade-in">
                  <p className="flex items-center gap-1.5 font-medium">
                    <span
                      className={`size-2 rounded-full ${
                        healthStatus === 'healthy' ? 'bg-emerald-500' : 'bg-rose-500'
                      }`}
                    />
                    {healthStatus === 'healthy'
                      ? 'Connected to Flask API (Port 5000)'
                      : 'Disconnected from Flask API (Port 5000)'}
                  </p>
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    {healthStatus === 'healthy'
                      ? 'GET /health endpoint returning 200 OK'
                      : 'Ensure python app.py is running in Backend/'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </header>


        {/* Scrollable View Area */}
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto max-w-[1500px] px-5 py-7 md:px-8">
            {loading && !data ? (
              <LoadingSkeleton />
            ) : showError ? (
              <ErrorState message={error ?? 'Unknown error'} onRetry={() => void refetch()} />
            ) : (
              <>
                {/* VIEW 1: OVERVIEW */}
                {currentView === 'overview' && (
                  <>
                    <section className="mb-7 flex flex-col justify-between gap-4 md:flex-row md:items-end">
                      <div>
                        <div className="mb-2 flex items-center gap-2 text-xs font-medium text-emerald-700">
                          <ShieldCheck className="size-3.5" />
                          Evidence-grounded intelligence
                        </div>
                        <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">Good morning, Eaman</h2>
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
                      <Button type="button" onClick={scrollToUpload} className="gap-2 self-start md:self-auto">
                        <Plus className="size-4" />
                        Add documents
                      </Button>
                    </section>

                    {summary && (
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        <Kpi
                          label="Documents"
                          value={String(summary.totalDocuments)}
                          caption={`${summary.completeDocuments} complete · ${summary.processingDocuments} processing`}
                          icon={FileText}
                          onClick={() => setCurrentView('documents')}
                        />
                        <Kpi
                          label="Facts extracted"
                          value={String(summary.totalFacts)}
                          caption={`Across ${summary.totalDocuments} source document${summary.totalDocuments === 1 ? '' : 's'}`}
                          icon={Sparkles}
                          accent="bg-sky-50 text-sky-700"
                          onClick={() => setCurrentView('facts')}
                        />
                        <Kpi
                          label="Relationships found"
                          value={String(summary.relationshipsFound)}
                          caption={`${summary.corroboratedCount} corroborated · ${summary.resolvedCount} resolved`}
                          icon={Link2}
                          accent="bg-violet-50 text-violet-700"
                          onClick={() => {
                            setFilter('All')
                            setCurrentView('relationships')
                          }}
                        />
                        <Kpi
                          label="Needs review"
                          value={String(summary.needsReviewCount)}
                          caption="Low confidence or conflicts"
                          icon={TriangleAlert}
                          accent="bg-amber-50 text-amber-700"
                          onClick={() => {
                            setFilter('review')
                            setCurrentView('relationships')
                          }}
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
                                <h3 className="text-base font-semibold">Fact explorer preview</h3>
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
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentView('facts')}
                                className="gap-1.5"
                              >
                                Full explorer <ArrowUpRight className="size-3.5" />
                              </Button>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-1 border-b border-border">
                            {(['All', 'corroborated', 'contradicted', 'resolved', 'review'] as const).map(
                              (item) => (
                                <button
                                  key={item}
                                  onClick={() => handleFilterChange(item === 'All' ? 'All' : item)}
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
                                        onClick={() => handleOpenSource(primarySource)}
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
                                  className={`rounded-lg border p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-sm ${filter === key ? 'border-primary/50 bg-card shadow-sm' : 'border-border bg-card'}`}
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
                              <Button
                                variant="ghost"
                                size="sm"
                                className="gap-1.5"
                                onClick={() => setCurrentView('documents')}
                              >
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
                                          onClick={() => {
                                            setQuery(doc.name)
                                            setCurrentView('facts')
                                          }}
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
                  </>
                )}

                {/* VIEW 2: DOCUMENTS */}
                {currentView === 'documents' && (
                  <div>
                    <section className="mb-7 flex flex-col justify-between gap-4 md:flex-row md:items-end">
                      <div>
                        <div className="mb-2 flex items-center gap-2 text-xs font-medium text-emerald-700">
                          <FolderOpen className="size-3.5" />
                          Corpus document management
                        </div>
                        <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">Uploaded Documents</h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Manage ingested PDF files, inspect extraction status, and trigger new ingestion jobs.
                        </p>
                      </div>
                      <Button
                        type="button"
                        onClick={() => setShowDocUpload((prev) => !prev)}
                        className="gap-2 self-start md:self-auto"
                      >
                        <Plus className="size-4" />
                        {showDocUpload ? 'Close upload zone' : 'Add documents'}
                      </Button>
                    </section>

                    {showDocUpload && (
                      <div className="mb-7">
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
                      </div>
                    )}

                    <div className="mb-7 grid gap-3 sm:grid-cols-3">
                      <Kpi
                        label="Total Documents"
                        value={String(summary?.totalDocuments ?? documents.length)}
                        caption="Source PDF files in corpus"
                        icon={FileText}
                        onClick={() => setCurrentView('documents')}
                      />
                      <Kpi
                        label="Extracted Facts"
                        value={String(summary?.totalFacts ?? facts.length)}
                        caption="Total grounded facts extracted"
                        icon={Sparkles}
                        accent="bg-sky-50 text-sky-700"
                        onClick={() => setCurrentView('facts')}
                      />
                      <Kpi
                        label="Cross-Doc Relationships"
                        value={String(summary?.relationshipsFound ?? 0)}
                        caption="Identified relationship pairs"
                        icon={Link2}
                        accent="bg-violet-50 text-violet-700"
                        onClick={() => {
                          setFilter('All')
                          setCurrentView('relationships')
                        }}
                      />
                    </div>


                    <div className="rounded-lg border border-border bg-card">
                      <div className="flex items-center justify-between border-b border-border px-5 py-4">
                        <div>
                          <h3 className="text-sm font-semibold">Document Repository</h3>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {documents.length} document{documents.length === 1 ? '' : 's'} registered in SQLite corpus
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5 text-xs"
                          onClick={() => void refetch()}
                        >
                          <RefreshCw className={`size-3.5 ${isRefetching ? 'animate-spin' : ''}`} />
                          Refresh status
                        </Button>
                      </div>

                      {documents.length === 0 ? (
                        <div className="flex flex-col items-center justify-center px-8 py-16 text-center">
                          <Inbox className="size-8 text-muted-foreground" />
                          <p className="mt-3 text-base font-semibold">No documents uploaded</p>
                          <p className="mt-1 max-w-sm text-xs text-muted-foreground">
                            Click 'Add documents' above to upload PDF source files to FactGate.
                          </p>
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full min-w-[700px] text-left">
                            <thead>
                              <tr className="border-b border-border bg-muted/30 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                                <th className="px-5 py-3.5 font-medium">Document Name</th>
                                <th className="px-5 py-3.5 font-medium">Status</th>
                                <th className="px-5 py-3.5 font-medium">Upload Date</th>
                                <th className="px-5 py-3.5 font-medium">Extracted Facts</th>
                                <th className="px-5 py-3.5 font-medium">Review Exceptions</th>
                                <th className="px-5 py-3.5 font-medium">Relationships</th>
                                <th className="px-5 py-3.5 text-right font-medium">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                              {documents.map((doc) => {
                                const docFactsCount = facts.filter((f) =>
                                  f.sources.some((s) => s.documentName === doc.name),
                                ).length
                                const countToDisplay = doc.facts || docFactsCount

                                return (
                                  <tr key={doc.name} className="hover:bg-muted/40 transition-colors">
                                    <td className="px-5 py-4">
                                      <div className="flex items-center gap-3">
                                        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                          <FileText className="size-4" />
                                        </div>
                                        <div>
                                          <p className="text-sm font-medium">{doc.name}</p>
                                          <p className="text-[11px] text-muted-foreground">PDF Document</p>
                                        </div>
                                      </div>
                                    </td>
                                    <td className="px-5 py-4">
                                      {doc.status === 'Complete' ? (
                                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                                          <CheckCircle2 className="size-3.5" />
                                          Complete
                                        </span>
                                      ) : doc.status === 'Processing' ? (
                                        <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-700 ring-1 ring-inset ring-sky-600/20">
                                          <RefreshCw className="size-3.5 animate-spin" />
                                          Processing
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-700 ring-1 ring-inset ring-rose-600/20">
                                          <AlertCircle className="size-3.5" />
                                          Error
                                        </span>
                                      )}
                                    </td>
                                    <td className="px-5 py-4 text-xs text-muted-foreground">
                                      {doc.date || 'Recently uploaded'}
                                    </td>
                                    <td className="px-5 py-4">
                                      <span className="inline-flex items-center rounded-md bg-muted px-2 py-1 font-mono text-xs font-semibold">
                                        {countToDisplay} facts
                                      </span>
                                    </td>
                                    <td className="px-5 py-4 font-mono text-xs">
                                      {doc.issues ? (
                                        <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-2 py-0.5 font-semibold text-amber-700 ring-1 ring-amber-200">
                                          <TriangleAlert className="size-3" />
                                          {doc.issues}
                                        </span>
                                      ) : (
                                        <span className="text-muted-foreground">—</span>
                                      )}
                                    </td>
                                    <td className="px-5 py-4 font-mono text-xs">{doc.relationships ?? 0}</td>
                                    <td className="px-5 py-4 text-right">
                                      <div className="flex items-center justify-end gap-2">
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="gap-1.5 text-xs"
                                          onClick={() => {
                                            setQuery(doc.name)
                                            setCurrentView('facts')
                                          }}
                                        >
                                          Inspect facts <ArrowUpRight className="size-3.5" />
                                        </Button>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          disabled={deletingDoc === doc.name}
                                          onClick={() => handleDeleteDocument(doc.name)}
                                          className="gap-1.5 text-xs border-rose-200 bg-rose-50/60 text-rose-700 hover:bg-rose-100 hover:text-rose-800"
                                        >
                                          {deletingDoc === doc.name ? (
                                            <>
                                              <RefreshCw className="size-3.5 animate-spin text-rose-700" />
                                              <span>Deleting...</span>
                                            </>
                                          ) : (
                                            <>
                                              <Trash2 className="size-3.5 text-rose-600" />
                                              <span>Delete</span>
                                            </>
                                          )}
                                        </Button>
                                      </div>
                                    </td>

                                  </tr>
                                )
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* VIEW 3: FACTS */}
                {currentView === 'facts' && (
                  <div>
                    <section className="mb-5 flex flex-col justify-between gap-4 md:flex-row md:items-end">
                      <div>
                        <div className="mb-2 flex items-center gap-2 text-xs font-medium text-primary">
                          <Sparkles className="size-3.5" />
                          Evidence-grounded audit
                        </div>
                        <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">Fact Explorer</h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Search normalized facts, inspect relationship classifications, and trace source evidence.
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setQuery('')
                            setFilter('All')
                          }}
                          className="gap-1.5 text-xs"
                        >
                          Reset filters
                        </Button>
                      </div>
                    </section>

                    {/* Search & Filter Bar */}
                    <div className="mb-4 flex flex-col gap-3 rounded-lg border border-border bg-card p-4 md:flex-row md:items-center md:justify-between">
                      <div className="flex flex-1 items-center gap-2 rounded-md border border-border bg-background px-3 py-2">
                        <Search className="size-4 text-muted-foreground" />
                        <input
                          aria-label="Search facts"
                          value={query}
                          onChange={(event) => setQuery(event.target.value)}
                          placeholder="Search fact names, values, or source documents..."
                          className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                        />
                        {query && (
                          <button
                            onClick={() => setQuery('')}
                            className="text-xs text-muted-foreground hover:text-foreground"
                          >
                            Clear
                          </button>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-1">
                        {(['All', 'corroborated', 'contradicted', 'resolved', 'review'] as const).map(
                          (item) => (
                            <button
                              key={item}
                              onClick={() => handleFilterChange(item === 'All' ? 'All' : item)}
                              className={`rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                                filter === item
                                  ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
                                  : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
                              }`}
                            >
                              {item === 'All' ? 'All facts' : STATUS_META[item].label}
                              <span
                                className={`ml-1.5 rounded px-1.5 py-0.5 text-[10px] ${
                                  filter === item
                                    ? 'bg-primary-foreground/20 text-primary-foreground'
                                    : 'bg-background text-muted-foreground'
                                }`}
                              >
                                {item === 'All'
                                  ? facts.length
                                  : facts.filter((row) => row.status === item).length}
                              </span>
                            </button>
                          ),
                        )}
                      </div>
                    </div>

                    {/* Fact Explorer Master-Detail */}
                    <div className="grid overflow-hidden rounded-lg border border-border bg-card xl:grid-cols-[minmax(380px,.85fr)_minmax(0,1.15fr)]">
                      <div className="min-h-[580px] border-b border-border xl:border-b-0 xl:border-r">
                        <div className="flex items-center justify-between border-b border-border px-4 py-3 bg-muted/20">
                          <span className="text-xs font-semibold">Extracted Facts ({filteredFacts.length})</span>
                          <span className="text-[11px] text-muted-foreground">
                            {filter !== 'All' ? `Filtered by ${STATUS_META[filter].label}` : 'Showing all facts'}
                          </span>
                        </div>
                        <div className="flex flex-col divide-y divide-border">
                          {filteredFacts.length ? (
                            filteredFacts.map((fact) => (
                              <button
                                key={fact.id}
                                onClick={() => handleSelectFact(fact)}
                                className={`px-4 py-4 text-left transition-colors hover:bg-muted/50 ${selectedFact?.id === fact.id ? 'bg-muted/60 border-l-4 border-l-primary' : ''}`}
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
                              <p className="mt-3 text-sm font-medium">No facts match query</p>
                              <p className="mt-1 text-xs text-muted-foreground">
                                Try searching for another entity or change the active filter.
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {selectedFact && primarySource && (
                        <div className="min-w-0 bg-muted/20">
                          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-3 bg-background">
                            <div className="flex items-center gap-2">
                              <PanelRight className="size-4 text-primary" />
                              <span className="text-xs font-semibold">Fact Inspection & Evidence Linkage</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="gap-1 text-xs"
                                onClick={() => notify('Fact details copied')}
                              >
                                <Copy className="size-3.5" />
                                Copy Fact
                              </Button>
                            </div>
                          </div>
                          <div className="p-5">
                            <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
                              <div>
                                <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                                  Normalized Fact Claim
                                </p>
                                <h4 className="mt-1 text-xl font-semibold tracking-tight">
                                  {selectedFact.name}
                                </h4>
                                <p className="mt-1 font-mono text-3xl font-semibold tracking-tight">
                                  {selectedFact.normalizedValue}
                                </p>
                                {selectedFact.originalValue && (
                                  <p className="mt-1 text-xs text-muted-foreground">
                                    Source original value: {selectedFact.originalValue}
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
                                  Confidence Score
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
                                  Primary Source
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
                                  Source Evidences
                                </p>
                                <p className="mt-1 text-sm font-semibold">{detailSources.length} sources</p>
                                <p className="mt-1 text-[11px] text-muted-foreground">
                                  Direct verbatim quotes
                                </p>
                              </div>
                            </div>

                            <div className="mt-5 grid gap-4 2xl:grid-cols-[minmax(0,1.05fr)_minmax(300px,.95fr)]">
                              <div className="rounded-md border border-border bg-card p-4">
                                <div className="mb-4 flex items-center justify-between">
                                  <div>
                                    <p className="text-xs font-semibold">Grounded Source Excerpt</p>
                                    <p className="mt-1 text-[11px] text-muted-foreground">
                                      {primarySource.documentName} ·{' '}
                                      {primarySource.page ?? 'Page not provided'}
                                    </p>
                                  </div>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleOpenSource(primarySource)}
                                    className="gap-1.5 text-xs"
                                  >
                                    <BookOpen className="size-3.5" />
                                    Open Document
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
                                  <p className="my-1 rounded-sm bg-amber-200/80 px-1 text-slate-900 ring-1 ring-amber-300">
                                    “{primarySource.quote}”
                                  </p>
                                  {selectedFact.context.length ? (
                                    <p className="mt-3 text-[11px] font-sans text-slate-500">
                                      Context: {selectedFact.context.join(' · ')}
                                    </p>
                                  ) : null}
                                </div>
                              </div>

                              <div className="flex flex-col gap-4">
                                <div className="rounded-md border border-border bg-card p-4">
                                  <div className="flex items-center gap-2">
                                    <Sparkles className="size-4 text-primary" />
                                    <p className="text-xs font-semibold">LLM Relationship Reasoning</p>
                                  </div>
                                  <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                                    {selectedFact.reasoning}
                                  </p>
                                  {selectedFact.errorMessage && (
                                    <p className="mt-3 rounded border border-amber-200 bg-amber-50 px-2 py-1.5 text-[11px] text-amber-800">
                                      {selectedFact.errorMessage}
                                    </p>
                                  )}
                                  <div className="mt-3 flex flex-wrap gap-1.5">
                                    {selectedFact.context.map((tag) => (
                                      <span
                                        key={tag}
                                        className="rounded border border-border bg-muted px-2 py-1 text-[10px] text-muted-foreground"
                                      >
                                        {tag}
                                      </span>
                                    ))}
                                  </div>
                                </div>

                                <div className="rounded-md border border-border bg-card p-4">
                                  <div className="mb-3 flex items-center justify-between">
                                    <p className="text-xs font-semibold">All Linked Evidence Passages</p>
                                    <span className="text-[11px] text-muted-foreground">
                                      {detailSources.length} source{detailSources.length === 1 ? '' : 's'}
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
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* VIEW 4: RELATIONSHIPS */}
                {currentView === 'relationships' && (
                  <div>
                    <section className="mb-5 flex flex-col justify-between gap-4 md:flex-row md:items-end">
                      <div>
                        <div className="mb-2 flex items-center gap-2 text-xs font-medium text-violet-700">
                          <Link2 className="size-3.5" />
                          Cross-document intelligence
                        </div>
                        <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
                          Cross-Document Relationships
                        </h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Analyze fact corroborations, contradictions, contextual resolutions, and extraction review cases.
                        </p>
                      </div>
                    </section>

                    {/* Filter Bar */}
                    <div className="mb-6 flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card p-3">
                      <span className="px-2 text-xs font-semibold text-muted-foreground">Filter Case:</span>
                      {(['All', 'corroborated', 'contradicted', 'resolved', 'review'] as const).map(
                        (item) => {
                          const count =
                            item === 'All'
                              ? facts.length
                              : facts.filter((row) => row.status === item).length

                          return (
                            <button
                              key={item}
                              onClick={() => setFilter(item)}
                              className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                                filter === item
                                  ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
                                  : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
                              }`}
                            >
                              <span>{item === 'All' ? 'All Relationships' : STATUS_META[item].label}</span>
                              <span
                                className={`rounded px-1.5 py-0.5 text-[10px] ${
                                  filter === item
                                    ? 'bg-primary-foreground/20 text-primary-foreground'
                                    : 'bg-background text-muted-foreground'
                                }`}
                              >
                                {count}
                              </span>
                            </button>
                          )
                        },
                      )}
                    </div>

                    {/* Relationship Cards Feed */}
                    <div className="space-y-4">
                      {filteredFacts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card px-8 py-16 text-center">
                          <Inbox className="size-8 text-muted-foreground" />
                          <p className="mt-3 text-base font-semibold">No relationship cases match</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            Try selecting another relationship category filter.
                          </p>
                        </div>
                      ) : (
                        filteredFacts.map((fact) => {
                          const factMeta = STATUS_META[fact.status]
                          const sources = getFactDetailSources(fact)

                          return (
                            <div
                              key={fact.id}
                              className="rounded-lg border border-border bg-card p-5 transition-shadow hover:shadow-sm"
                            >
                              {/* Card Header */}
                              <div className="flex flex-col justify-between gap-3 border-b border-border pb-4 sm:flex-row sm:items-center">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h3 className="text-base font-semibold">{fact.name}</h3>
                                    <span className="font-mono text-xs font-bold text-primary">
                                      [{fact.normalizedValue}]
                                    </span>
                                  </div>
                                  {fact.originalValue && (
                                    <p className="mt-0.5 text-xs text-muted-foreground">
                                      Raw value: {fact.originalValue}
                                    </p>
                                  )}
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className="font-mono text-xs text-muted-foreground">
                                    {fact.confidence} confidence
                                  </span>
                                  <StatusBadge tone={statusToTone(fact.status)}>
                                    {factMeta.label}
                                  </StatusBadge>
                                </div>
                              </div>

                              {/* LLM Reasoning Box */}
                              <div
                                className={`mt-4 rounded-md border p-4 ${
                                  fact.status === 'contradicted'
                                    ? 'border-rose-200 bg-rose-50/60 text-rose-950'
                                    : fact.status === 'review'
                                      ? 'border-amber-200 bg-amber-50/60 text-amber-950'
                                      : fact.status === 'resolved'
                                        ? 'border-sky-200 bg-sky-50/60 text-sky-950'
                                        : 'border-emerald-200 bg-emerald-50/60 text-emerald-950'
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <Sparkles className="size-4 shrink-0" />
                                  <p className="text-xs font-semibold uppercase tracking-wider">
                                    LLM Relationship Explanation
                                  </p>
                                </div>
                                <p className="mt-2 text-xs leading-relaxed font-medium">
                                  {fact.reasoning}
                                </p>
                                {fact.reviewNotes && (
                                  <p className="mt-2 text-[11px] opacity-80">
                                    Note: {fact.reviewNotes}
                                  </p>
                                )}
                                {fact.context.length > 0 && (
                                  <div className="mt-3 flex flex-wrap gap-1.5">
                                    {fact.context.map((ctx) => (
                                      <span
                                        key={ctx}
                                        className="rounded bg-background/80 px-2 py-0.5 text-[10px] font-medium shadow-xs"
                                      >
                                        {ctx}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>

                              {/* Source Passages Comparison */}
                              <div className="mt-4">
                                <p className="mb-2 text-xs font-semibold text-muted-foreground">
                                  Source Passages & Evidence Links ({sources.length}):
                                </p>
                                <div className="grid gap-3 md:grid-cols-2">
                                  {sources.map((src, idx) => (
                                    <div
                                      key={`${src.documentName}-${idx}`}
                                      className="rounded-md border border-border bg-muted/30 p-3 text-xs"
                                    >
                                      <div className="mb-1.5 flex items-center justify-between">
                                        <span className="flex items-center gap-1.5 font-medium">
                                          <FileText className="size-3.5 text-primary" />
                                          {src.documentName}
                                        </span>
                                        <span className="text-[10px] text-muted-foreground">
                                          {src.page ?? 'Page N/A'}
                                        </span>
                                      </div>
                                      <p className="font-serif italic text-muted-foreground leading-relaxed">
                                        “{src.quote}”
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Card Action */}
                              <div className="mt-4 flex justify-end gap-2 border-t border-border pt-3">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="gap-1.5 text-xs"
                                  onClick={() => {
                                    setSelectedId(fact.id)
                                    setCurrentView('facts')
                                  }}
                                >
                                  Inspect in Fact Explorer <ArrowUpRight className="size-3.5" />
                                </Button>
                              </div>
                            </div>
                          )
                        })
                      )}
                    </div>
                  </div>
                )}

                {/* VIEW 5: WORKSPACE SETTINGS */}
                {currentView === 'settings' && (
                  <div>
                    <section className="mb-7 flex flex-col justify-between gap-4 md:flex-row md:items-end">
                      <div>
                        <div className="mb-2 flex items-center gap-2 text-xs font-medium text-primary">
                          <Building2 className="size-3.5" />
                          Workspace Management
                        </div>
                        <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
                          Workspace Settings
                        </h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Create new project workspaces, configure access roles, and manage active environments.
                        </p>
                      </div>
                    </section>

                    {/* Card 1: Create Workspace */}
                    <div className="mb-7 rounded-lg border border-border bg-card p-6 shadow-xs">
                      <div className="mb-4">
                        <h3 className="text-base font-semibold">Create Workspace</h3>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Set up a new isolated project corpus for fact extraction and evidence verification.
                        </p>
                      </div>
                      <form onSubmit={handleCreateWorkspace} className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <div className="relative flex-1">
                          <input
                            type="text"
                            value={newWorkspaceName}
                            onChange={(e) => setNewWorkspaceName(e.target.value)}
                            placeholder="Enter workspace name (e.g. Q4 Audit Project)..."
                            className="w-full rounded-md border border-border bg-background px-3.5 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary placeholder:text-muted-foreground"
                          />
                        </div>
                        <Button type="submit" className="gap-2">
                          <Plus className="size-4" />
                          Create Workspace
                        </Button>
                      </form>
                    </div>

                    {/* Card 2: Workspace List & Management */}
                    <div className="rounded-lg border border-border bg-card">
                      <div className="flex items-center justify-between border-b border-border px-6 py-4">
                        <div>
                          <h3 className="text-base font-semibold">Active Workspaces</h3>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {workspacesList.length} workspace{workspacesList.length === 1 ? '' : 's'} configured
                          </p>
                        </div>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[650px] text-left">
                          <thead>
                            <tr className="border-b border-border bg-muted/30 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                              <th className="px-6 py-3.5 font-medium">Workspace Name</th>
                              <th className="px-6 py-3.5 font-medium">Role</th>
                              <th className="px-6 py-3.5 font-medium">Created Date</th>
                              <th className="px-6 py-3.5 text-right font-medium">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border">
                            {workspacesList.map((ws) => (
                              <tr key={ws.id} className="hover:bg-muted/40 transition-colors">
                                <td className="px-6 py-4">
                                  {editingWsId === ws.id ? (
                                    <div className="flex items-center gap-2">
                                      <input
                                        type="text"
                                        value={editingWsName}
                                        onChange={(e) => setEditingWsName(e.target.value)}
                                        className="rounded border border-primary bg-background px-2.5 py-1 text-xs outline-none"
                                        autoFocus
                                      />
                                      <Button
                                        size="sm"
                                        variant="default"
                                        className="h-7 px-2.5 text-xs"
                                        onClick={() => handleSaveRenameWs(ws.id)}
                                      >
                                        Save
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-7 px-2.5 text-xs"
                                        onClick={() => setEditingWsId(null)}
                                      >
                                        Cancel
                                      </Button>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-3">
                                      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                        <Building2 className="size-4" />
                                      </div>
                                      <div>
                                        <div className="flex items-center gap-2">
                                          <p className="text-sm font-medium">{ws.name}</p>
                                          {ws.isDefault && (
                                            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                                              Primary
                                            </span>
                                          )}
                                        </div>
                                        <p className="text-[11px] text-muted-foreground">SQLite Corpus Workspace</p>
                                      </div>
                                    </div>
                                  )}
                                </td>
                                <td className="px-6 py-4">
                                  <span className="inline-flex items-center rounded-md bg-muted px-2.5 py-1 text-xs font-mono font-medium text-foreground">
                                    {ws.role}
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-xs text-muted-foreground">{ws.createdDate}</td>
                                <td className="px-6 py-4 text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="gap-1.5 text-xs"
                                      onClick={() => handleStartRenameWs(ws)}
                                    >
                                      <Edit2 className="size-3.5" />
                                      Edit
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleDeleteWorkspace(ws.id, ws.name)}
                                      className="gap-1.5 text-xs border-rose-200 bg-rose-50/60 text-rose-700 hover:bg-rose-100 hover:text-rose-800"
                                    >
                                      <Trash2 className="size-3.5 text-rose-600" />
                                      Delete
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}


                {error && facts.length > 0 && (
                  <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900">
                    Latest refresh failed: {error}. Showing previously loaded data.
                    <button className="ml-2 underline" onClick={() => void refetch()}>
                      Retry
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>

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
