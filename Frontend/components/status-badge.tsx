import type { Tone } from '@/lib/types'
import { AlertCircle, CheckCircle2, Link2, TriangleAlert } from 'lucide-react'

export function StatusBadge({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  const styles: Record<Tone, string> = {
    success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    danger: 'border-rose-200 bg-rose-50 text-rose-700',
    info: 'border-sky-200 bg-sky-50 text-sky-700',
    warning: 'border-amber-200 bg-amber-50 text-amber-700',
  }
  const icons = {
    success: CheckCircle2,
    danger: TriangleAlert,
    info: Link2,
    warning: AlertCircle,
  }
  const Icon = icons[tone]

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] font-semibold tracking-wide ${styles[tone]}`}
    >
      <Icon className="size-3.5" aria-hidden="true" />
      {children}
    </span>
  )
}
