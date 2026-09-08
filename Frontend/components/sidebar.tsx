'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { signOut, type User } from 'firebase/auth'
import {
  Building2,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleDot,
  FolderOpen,
  LayoutDashboard,
  Link2,
  LogOut,
  MoreHorizontal,
  Settings2,
  Sparkles,
  User as UserIcon,
  X,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import type { FactFilter, FactStatus } from '@/lib/types'
import { STATUS_META } from '@/lib/types'
import { auth } from '@/lib/firebase'

export type View = 'overview' | 'documents' | 'facts' | 'relationships' | 'settings' | 'profile' | 'api-keys'

const NAV_ITEMS: { id: View; label: string; icon: React.ElementType }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'documents', label: 'Documents', icon: FolderOpen },
  { id: 'facts', label: 'Facts', icon: Sparkles },
  { id: 'relationships', label: 'Relationships', icon: Link2 },
]

export interface WorkspaceItem {
  id: string
  name: string
  role: 'Owner' | 'Admin' | 'Member'
  isDefault?: boolean
  createdDate: string
}

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
  onNotify?: (message: string) => void
  user?: User | null
  workspaces: WorkspaceItem[]
  activeWorkspace: WorkspaceItem
  onSelectWorkspace: (workspace: WorkspaceItem) => void
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
  onNotify,
  user,
  workspaces,
  activeWorkspace,
  onSelectWorkspace,
}: SidebarProps) {
  const router = useRouter()
  const [showWorkspaceMenu, setShowWorkspaceMenu] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)

  const workspaceRef = useRef<HTMLDivElement>(null)
  const userRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (workspaceRef.current && !workspaceRef.current.contains(event.target as Node)) {
        setShowWorkspaceMenu(false)
      }
      if (userRef.current && !userRef.current.contains(event.target as Node)) {
        setShowUserMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const [imgError, setImgError] = useState(false)
  const userDisplayName = user?.displayName || 'Analyst'
  const userEmail = user?.email || 'analyst@factgate.io'
  const userPhoto = user?.photoURL
  const userFallbackLetter = user?.displayName?.charAt(0)?.toUpperCase() || 'U'
  const userInitials =
    user?.displayName
      ?.trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || userFallbackLetter

  return (
    <aside
      className={cn(
        'relative flex flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-all duration-300',
        collapsed ? 'w-16' : 'w-64',
        mobileOpen ? 'fixed inset-y-0 left-0 z-50 flex shadow-2xl' : 'hidden md:flex',
      )}
    >
      {/* Header */}
      <div className="flex h-14 items-center justify-between border-b border-sidebar-border px-3.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-xs shadow-sm">
            FG
          </div>
          {!collapsed && (
            <span className="truncate text-sm font-bold tracking-tight text-foreground">
              FactGate
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={onToggleCollapsed}
          className="hidden md:flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-sidebar-accent hover:text-foreground transition-colors"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
        </button>
        <button
          type="button"
          onClick={onCloseMobile}
          className="flex md:hidden size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-sidebar-accent"
          aria-label="Close sidebar"
        >
          <X className="size-4" />
        </button>
      </div>

      {/* Workspace Switcher */}
      <div ref={workspaceRef} className="relative border-b border-sidebar-border p-2">
        <button
          type="button"
          onClick={() => setShowWorkspaceMenu((prev) => !prev)}
          className={cn(
            'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs transition-colors hover:bg-sidebar-accent',
            collapsed && 'justify-center px-0',
          )}
        >
          <div className="flex size-5 shrink-0 items-center justify-center rounded bg-primary/10 text-primary">
            <Building2 className="size-3" />
          </div>
          {!collapsed && (
            <>
              <span className="truncate font-medium text-foreground">{activeWorkspace?.name || 'Acme Corp'}</span>
              <ChevronDown className="ml-auto size-3.5 text-muted-foreground" />
            </>
          )}
        </button>

        {showWorkspaceMenu && !collapsed && (
          <div className="absolute left-2 right-2 top-11 z-50 rounded-lg border border-border bg-popover p-1 shadow-lg animate-in fade-in zoom-in-95">
            {workspaces.map((ws) => (
              <button
                key={ws.id}
                type="button"
                onClick={() => {
                  onSelectWorkspace(ws)
                  setShowWorkspaceMenu(false)
                  onNotify?.(`Switched to workspace: ${ws.name}`)
                }}
                className={cn(
                  'flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-xs transition-colors hover:bg-accent',
                  activeWorkspace?.id === ws.id ? 'font-semibold text-primary' : 'text-popover-foreground',
                )}
              >
                <span className="truncate">{ws.name}</span>
                {activeWorkspace?.id === ws.id && <Check className="size-3 text-primary shrink-0" />}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
        <div className="mb-2 px-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          {!collapsed && 'Navigation'}
        </div>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const isActive = currentView === item.id
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                onViewChange(item.id)
                onCloseMobile()
              }}
              className={cn(
                'flex w-full items-center rounded-md py-2 text-xs font-medium transition-colors',
                collapsed ? 'justify-center px-0' : 'gap-3 px-2.5',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground font-semibold shadow-xs'
                  : 'text-muted-foreground hover:bg-sidebar-accent hover:text-foreground',
              )}
            >
              <Icon className={cn('size-4 shrink-0', isActive ? 'text-primary' : '')} />
              {!collapsed && <span>{item.label}</span>}
            </button>
          )
        })}

        <div className="my-3 border-t border-sidebar-border" />

        {/* Filter Quick Links */}
        <div className="mb-2 px-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          {!collapsed && 'Status Filter'}
        </div>

        {(['All', 'corroborated', 'contradicted', 'resolved', 'review'] as const).map((key) => {
          const isAll = key === 'All'
          const meta = isAll ? null : STATUS_META[key]
          const label = isAll ? 'All facts' : meta?.label
          const count = isAll ? totalFacts : statusCounts[key] || 0
          const isActive = filter === key

          return (
            <button
              key={key}
              type="button"
              onClick={() => {
                onFilterChange(key)
                onCloseMobile()
              }}
              className={cn(
                'flex w-full items-center justify-between rounded-md py-1.5 text-xs transition-colors',
                collapsed ? 'justify-center px-0' : 'px-2.5',
                isActive
                  ? 'bg-primary/10 text-primary font-semibold'
                  : 'text-muted-foreground hover:bg-sidebar-accent hover:text-foreground',
              )}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <CircleDot
                  className={cn(
                    'size-3 shrink-0',
                    isAll
                      ? 'text-foreground'
                      : key === 'corroborated'
                        ? 'text-emerald-500'
                        : key === 'contradicted'
                          ? 'text-rose-500'
                          : key === 'resolved'
                            ? 'text-sky-500'
                            : 'text-amber-500',
                  )}
                />
                {!collapsed && <span className="truncate">{label}</span>}
              </div>
              {!collapsed && (
                <span className="font-mono text-[10px] text-muted-foreground">{count}</span>
              )}
            </button>
          )
        })}
      </div>

      {/* Footer / Profile */}
      <div ref={userRef} className="relative border-t border-sidebar-border p-2">
        <button
          type="button"
          onClick={() => {
            onViewChange('settings')
            onCloseMobile()
          }}
          className={cn(
            'flex w-full items-center rounded-md py-2 text-xs transition-colors',
            collapsed ? 'justify-center px-0' : 'gap-3 px-2.5',
            currentView === 'settings'
              ? 'bg-sidebar-accent font-semibold text-sidebar-accent-foreground ring-1 ring-primary/20'
              : 'text-muted-foreground hover:bg-sidebar-accent hover:text-foreground',
          )}
        >
          <Settings2 className="size-4 shrink-0" />
          {!collapsed && 'Workspace settings'}
        </button>

        {!collapsed ? (
          <button
            type="button"
            onClick={() => setShowUserMenu((prev) => !prev)}
            className="mt-3 flex w-full items-center gap-2.5 rounded-md p-1.5 hover:bg-sidebar-accent transition-colors text-left"
          >
            {userPhoto && !imgError ? (
              <img
                src={userPhoto}
                alt={userDisplayName}
                onError={() => setImgError(true)}
                className="size-8 shrink-0 rounded-full object-cover ring-1 ring-border"
              />
            ) : (
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                {userFallbackLetter}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-foreground">{userDisplayName}</p>
              <p className="truncate text-[11px] text-muted-foreground">{userEmail}</p>
            </div>
            <MoreHorizontal className="ml-auto size-4 shrink-0 text-muted-foreground" />
          </button>
        ) : (
          <div className="mt-3 flex justify-center">
            <button
              type="button"
              onClick={() => setShowUserMenu((prev) => !prev)}
              className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary hover:ring-2 hover:ring-primary/20 overflow-hidden"
            >
              {userPhoto && !imgError ? (
                <img
                  src={userPhoto}
                  alt={userDisplayName}
                  onError={() => setImgError(true)}
                  className="size-full object-cover"
                />
              ) : (
                userFallbackLetter
              )}
            </button>
          </div>
        )}

        {showUserMenu && (
          <div
            className={cn(
              'absolute z-50 rounded-lg border border-border bg-popover p-1.5 shadow-xl animate-in fade-in zoom-in-95',
              collapsed ? 'bottom-2 left-16 w-48' : 'bottom-14 left-2 right-2',
            )}
          >
            <div className="border-b border-border px-2 py-1.5 mb-1">
              <p className="text-xs font-semibold text-popover-foreground">{userDisplayName}</p>
              <p className="text-[10px] text-muted-foreground">{userEmail}</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setShowUserMenu(false)
                onViewChange('profile')
                onCloseMobile()
                onNotify?.('Switched to Profile Settings')
              }}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs text-popover-foreground hover:bg-accent transition-colors"
            >
              <UserIcon className="size-3.5 text-muted-foreground" />
              Profile Settings
            </button>
            <button
              type="button"
              onClick={() => {
                setShowUserMenu(false)
                onViewChange('settings')
                onCloseMobile()
                onNotify?.('Switched to Workspace Management')
              }}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs text-popover-foreground hover:bg-accent transition-colors"
            >
              <Building2 className="size-3.5 text-muted-foreground" />
              Workspace Preferences
            </button>
            <button
              type="button"
              onClick={() => {
                setShowUserMenu(false)
                onViewChange('api-keys')
                onCloseMobile()
                onNotify?.('Switched to API Tokens & Keys')
              }}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs text-popover-foreground hover:bg-accent transition-colors"
            >
              <Settings2 className="size-3.5 text-muted-foreground" />
              API Tokens & Keys
            </button>
            <div className="my-1 border-t border-border" />
            <button
              type="button"
              onClick={async () => {
                setShowUserMenu(false)
                try {
                  await signOut(auth)
                } catch (err) {
                  console.error('Sign out error:', err)
                }
                onNotify?.('Logged out successfully')
                router.push('/')
              }}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors"
            >
              <LogOut className="size-3.5" />
              Log out
            </button>
          </div>
        )}
      </div>
    </aside>
  )
}
