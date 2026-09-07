'use client'

import { useRef } from 'react'
import { CloudUpload, FileText, RefreshCw, UploadCloud, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { DocumentMeta } from '@/lib/types'
import type { UploadStage } from '@/hooks/use-upload'
import type { SelectedUploadFile } from '@/hooks/use-upload'

interface UploadZoneProps {
  selectedFiles: SelectedUploadFile[]
  stage: UploadStage
  progress: number
  stageLabel: string
  detailLabel: string
  error: string | null
  isDragging: boolean
  isBusy: boolean
  recentDocuments: DocumentMeta[]
  onAddFiles: (files: FileList | File[]) => void
  onRemoveFile: (id: string) => void
  onUpload: () => void
  onRetry: () => void
  onDragStateChange: (dragging: boolean) => void
}

export function UploadZone({
  selectedFiles,
  stage,
  progress,
  stageLabel,
  detailLabel,
  error,
  isDragging,
  isBusy,
  recentDocuments,
  onAddFiles,
  onRemoveFile,
  onUpload,
  onRetry,
  onDragStateChange,
}: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const processingDoc = recentDocuments.find((doc) => doc.status === 'Processing')

  const openFilePicker = () => {
    inputRef.current?.click()
  }

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    onDragStateChange(false)
    if (event.dataTransfer.files?.length) {
      onAddFiles(event.dataTransfer.files)
    }
  }

  return (
    <section id="upload-zone" className="rounded-lg border border-border bg-card p-5">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h3 className="text-sm font-semibold">Ingest documents</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Add PDFs to extract, normalize, and connect facts.
          </p>
        </div>
        <UploadCloud className="size-5 text-muted-foreground" />
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        multiple
        className="sr-only"
        onChange={(event) => {
          if (event.target.files?.length) {
            onAddFiles(event.target.files)
          }
          event.target.value = ''
        }}
      />

      <div
        role="button"
        tabIndex={0}
        onClick={() => {
          if (!isBusy) openFilePicker()
        }}
        onKeyDown={(event) => {
          if ((event.key === 'Enter' || event.key === ' ') && !isBusy) {
            event.preventDefault()
            openFilePicker()
          }
        }}
        onDragEnter={(event) => {
          event.preventDefault()
          onDragStateChange(true)
        }}
        onDragOver={(event) => {
          event.preventDefault()
          onDragStateChange(true)
        }}
        onDragLeave={(event) => {
          event.preventDefault()
          if (event.currentTarget.contains(event.relatedTarget as Node)) {
            return
          }
          onDragStateChange(false)
        }}
        onDrop={handleDrop}
        className={`group flex w-full flex-col items-center justify-center rounded-md border border-dashed px-4 py-8 transition-colors ${
          isDragging
            ? 'border-primary bg-primary/5'
            : 'border-border bg-muted/30 hover:border-primary/50 hover:bg-muted/60'
        } ${isBusy ? 'pointer-events-none opacity-80' : 'cursor-pointer'}`}
      >
        <div className="mb-3 flex size-10 items-center justify-center rounded-full bg-background shadow-sm">
          <CloudUpload
            className={`size-5 ${isDragging ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'}`}
          />
        </div>
        <p className="text-sm font-medium">
          Drop PDF files here or{' '}
          <span className="text-primary underline underline-offset-2">browse files</span>
        </p>
        <p className="mt-1 text-xs text-muted-foreground">PDF only · Up to 25 MB per file</p>
      </div>

      {selectedFiles.length > 0 && (
        <div className="mt-4 space-y-2">
          {selectedFiles.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between rounded-md border border-border bg-background px-3 py-2.5"
            >
              <div className="flex min-w-0 items-center gap-2.5">
                <div className="rounded bg-muted p-1.5">
                  <FileText className="size-4 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium">{item.file.name}</p>
                  <p className="text-[11px] text-muted-foreground">{item.sizeLabel} · Ready to upload</p>
                </div>
              </div>
              {!isBusy && (
                <button
                  type="button"
                  aria-label={`Remove ${item.file.name}`}
                  onClick={() => onRemoveFile(item.id)}
                  className="rounded p-1 text-muted-foreground hover:bg-muted"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>
          ))}

          <div className="flex items-center gap-2 pt-1">
            <Button size="sm" onClick={onUpload} disabled={isBusy} className="gap-2">
              {isBusy ? <RefreshCw className="size-3.5 animate-spin" /> : <UploadCloud className="size-3.5" />}
              {isBusy ? 'Processing…' : `Upload ${selectedFiles.length} file${selectedFiles.length === 1 ? '' : 's'}`}
            </Button>
            {stage === 'error' && (
              <Button size="sm" variant="outline" onClick={onRetry}>
                Retry upload
              </Button>
            )}
          </div>
        </div>
      )}

      {isBusy && (
        <div className="mt-4 rounded-md border border-sky-200 bg-sky-50 p-3">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-2 font-medium text-sky-800">
              <RefreshCw className="size-3.5 animate-spin" />
              {stageLabel}
            </span>
            <span className="text-sky-700">{progress}%</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-sky-100">
            <div className="h-full rounded-full bg-sky-500 transition-all" style={{ width: `${progress}%` }} />
          </div>
          <p className="mt-2 text-[11px] text-sky-700">{detailLabel}</p>
          <p className="mt-1 text-[10px] text-sky-600/80">
            Visual progress only — backend processing may differ.
          </p>
        </div>
      )}

      {stage === 'complete' && (
        <div className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
          {detailLabel || 'Upload complete. Refreshing facts…'}
        </div>
      )}

      {error && (
        <div className="mt-4 rounded-md border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
          {error}
        </div>
      )}

      {!isBusy && !selectedFiles.length && processingDoc && (
        <div className="mt-4 flex items-center justify-between rounded-md border border-border bg-background px-3 py-2.5">
          <div className="flex items-center gap-2.5">
            <div className="rounded bg-muted p-1.5">
              <FileText className="size-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-xs font-medium">{processingDoc.name}</p>
              <p className="text-[11px] text-muted-foreground">
                Processing · {processingDoc.facts} facts found
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-sky-700">
            <RefreshCw className="size-3.5 animate-spin" />
            Extracting
          </div>
        </div>
      )}
    </section>
  )
}
