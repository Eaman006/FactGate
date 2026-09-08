'use client'

import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleDot,
  FolderOpen,
  LayoutDashboard,
  Link2,
  MoreHorizontal,
  Settings2,
  Sparkles,
  X,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import type { FactFilter, FactStatus } from '@/lib/types'
import { STATUS_META } from '@/lib/types'

export type View = 'overview' | 'documents' | 'facts' | 'relationships'

const NAV_ITEMS: { id: View; label: string; icon: React.ElementType }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'documents', label: 'Documents', icon: FolderOpen },
  { id: 'facts', label: 'Facts', icon: Sparkles },
  { id: 'relationships', label: 'Relationships', icon: Link2 },
]

interface SidebarProps {
  currentView: View
  onViewChange: (view: View) => void
  filter: FactFilter
  onFilterChange: (filter: FactFilter) => void
  collapsed: boolean
  onToggleCollapsed: () => void
  mobileOpen: boolean
  onCloseMobile: () => void
  statusCounts: Record<FactStatus, number>
  totalFacts: number
}

export function Sidebar({
  currentView,
  onViewChange,
  filter,
  onFilterChange,
  collapsed,
  onToggleCollapsed,
  mobileOpen,
  onCloseMobile,
  statusCounts,
  totalFacts,
}: SidebarProps) {
  const handleFilter = (next: FactFilter) => {
    onFilterChange(next)
    onCloseMobile()
  }

  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-30 flex h-svh shrink-0 flex-col overflow-hidden border-r border-border bg-sidebar py-5 transition-[width,transform] duration-200 lg:static lg:h-svh lg:translate-x-0',
        collapsed ? 'w-[72px] px-2' : 'w-64 px-4',
        mobileOpen ? 'translate-x-0' : '-translate-x-full',
      )}
    >
      <div className={cn('flex items-center pb-7', collapsed ? 'justify-center' : 'justify-between px-2')}>
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <CircleDot className="size-4" />
          </div>
          {!collapsed && <span className="text-[17px] font-bold tracking-tight">FactLayer</span>}
        </div>
        {!collapsed && (
          <button
            type="button"
            aria-label="Close navigation"
            onClick={onCloseMobile}
            className="rounded-md p-1 text-muted-foreground hover:bg-accent lg:hidden"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      <button
        type="button"
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        aria-expanded={!collapsed}
        onClick={onToggleCollapsed}
        className="mb-5 hidden items-center justify-center rounded-md border border-border bg-background p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground lg:flex"
      >
        {collapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
      </button>

      <div className="min-h-0 flex-1 overflow-y-auto">
      {!collapsed && (
        <div className="mb-6 px-2">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Workspace
          </p>
          <button
            type="button"
            className="flex w-full items-center justify-between rounded-md border border-border bg-background px-3 py-2 text-left text-sm"
          >
            <span className="flex items-center gap-2">
              <span className="flex size-5 items-center justify-center rounded bg-primary text-[9px] font-bold text-primary-foreground">
                AC
              </span>
              Acme Corp
            </span>
            <ChevronDown className="size-3.5 text-muted-foreground" />
          </button>
        </div>
      )}

      <nav className="flex flex-col gap-1" aria-label="Main navigation">
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
          const isActive = currentView === id
          return (
            <button
              key={id}
              type="button"
              title={label}
              onClick={() => {
                onViewChange(id)
                onCloseMobile()
              }}
              className={cn(
                'flex items-center rounded-md py-2.5 text-sm transition-colors',
                collapsed ? 'justify-center px-0' : 'gap-3 px-3',
                isActive
                  ? 'bg-sidebar-accent font-semibold text-sidebar-accent-foreground ring-1 ring-primary/20'
                  : 'text-muted-foreground hover:bg-sidebar-accent hover:text-foreground',
              )}
            >
              <Icon className={cn('size-4 shrink-0', isActive ? 'text-primary' : '')} />
              {!collapsed && label}
            </button>
          )
        })}
      </nav>

      <div className="mt-8">
        {!collapsed && (
          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Relationship cases
          </p>
        )}
        <div className="flex flex-col gap-1" role="group" aria-label="Filter facts by relationship">
          <button
            type="button"
            title="All facts"
            onClick={() => handleFilter('All')}
            className={cn(
              'flex items-center rounded-md py-2 text-left text-xs',
              collapsed ? 'justify-center px-0' : 'gap-3 px-3',
              filter === 'All'
                ? 'bg-sidebar-accent font-medium text-foreground ring-1 ring-primary/20'
                : 'text-muted-foreground hover:bg-sidebar-accent hover:text-foreground',
            )}
            aria-pressed={filter === 'All'}
          >
            <Sparkles className="size-3.5 shrink-0" />
            {!collapsed && (
              <>
                <span className="truncate">All facts</span>
                <span className="ml-auto text-[10px] text-muted-foreground">{totalFacts}</span>
              </>
            )}
          </button>
          {(Object.keys(STATUS_META) as FactStatus[]).map((key) => {
            const item = STATUS_META[key]
            const Icon = item.icon
            const isActive = filter === key
            return (
              <button
                key={key}
                type="button"
                title={item.label}
                onClick={() => handleFilter(key)}
                className={cn(
                  'flex items-center rounded-md py-2 text-left text-xs',
                  collapsed ? 'justify-center px-0' : 'gap-3 px-3',
                  isActive
                    ? 'bg-sidebar-accent font-medium text-foreground ring-1 ring-primary/20'
                    : 'text-muted-foreground hover:bg-sidebar-accent hover:text-foreground',
                )}
                aria-pressed={isActive}
              >
                <Icon className="size-3.5 shrink-0" />
                {!collapsed && (
                  <>
                    <span className="truncate">{item.label}</span>
                    <span className="ml-auto text-[10px] text-muted-foreground">{statusCounts[key]}</span>
                  </>
                )}
              </button>
            )
          })}
        </div>
      </div>
      </div>

      <div className="mt-auto shrink-0 border-t border-sidebar-border pt-4">
        <button
          type="button"
          title="Workspace settings"
          className={cn(
            'flex w-full items-center rounded-md py-2 text-sm text-muted-foreground hover:bg-sidebar-accent hover:text-foreground',
            collapsed ? 'justify-center px-0' : 'gap-3 px-3',
          )}
        >
          <Settings2 className="size-4 shrink-0" />
          {!collapsed && 'Workspace settings'}
        </button>
        {!collapsed && (
          <div className="mt-3 flex items-center gap-2.5 px-3">
            <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
              EA
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-medium">Eaman</p>
              <p className="truncate text-[11px] text-muted-foreground">Engineering</p>
            </div>
            <MoreHorizontal className="ml-auto size-4 text-muted-foreground" />
          </div>
        )}
        {collapsed && (
          <div className="mt-3 flex justify-center">
            <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
              EA
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}

