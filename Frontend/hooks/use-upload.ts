'use client'

import { useCallback, useRef, useState } from 'react'
import { uploadPdfs } from '@/lib/api'
import { ApiError, type UploadResponse } from '@/lib/types'

export type UploadStage =
  | 'idle'
  | 'uploading'
  | 'processing'
  | 'updating'
  | 'complete'
  | 'error'

const STAGE_DURATIONS_MS = {
  uploading: 600,
  processing: 900,
  updating: 700,
} as const

function isPdf(file: File): boolean {
  return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export interface SelectedUploadFile {
  file: File
  id: string
  sizeLabel: string
}

interface UseUploadOptions {
  userUid?: string | null
  onSuccess?: (response: UploadResponse) => void | Promise<void>
}

interface UseUploadResult {
  selectedFiles: SelectedUploadFile[]
  stage: UploadStage
  progress: number
  stageLabel: string
  detailLabel: string
  error: string | null
  isDragging: boolean
  isBusy: boolean
  activeFileName: string | null
  addFiles: (files: FileList | File[]) => void
  removeFile: (id: string) => void
  clearFiles: () => void
  upload: () => Promise<void>
  retry: () => Promise<void>
  setDragging: (dragging: boolean) => void
}

export function useUpload(options: UseUploadOptions = {}): UseUploadResult {
  const [selectedFiles, setSelectedFiles] = useState<SelectedUploadFile[]>([])
  const [stage, setStage] = useState<UploadStage>('idle')
  const [progress, setProgress] = useState(0)
  const [stageLabel, setStageLabel] = useState('')
  const [detailLabel, setDetailLabel] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [activeFileName, setActiveFileName] = useState<string | null>(null)
  const timersRef = useRef<number[]>([])

  const clearTimers = useCallback(() => {
    for (const timer of timersRef.current) {
      window.clearTimeout(timer)
    }
    timersRef.current = []
  }, [])

  const addFiles = useCallback((incoming: FileList | File[]) => {
    const files = Array.from(incoming)
    const pdfs = files.filter(isPdf)

    if (!pdfs.length) {
      setError('Only PDF files are supported.')
      return
    }

    setError(null)
    setSelectedFiles((current) => {
      const next = [...current]
      for (const file of pdfs) {
        const duplicate = next.some(
          (item) =>
            item.file.name === file.name &&
            item.file.size === file.size &&
            item.file.lastModified === file.lastModified,
        )
        if (!duplicate) {
          next.push({
            file,
            id: `${file.name}-${file.lastModified}-${file.size}`,
            sizeLabel: formatFileSize(file.size),
          })
        }
      }
      return next
    })
  }, [])

  const removeFile = useCallback((id: string) => {
    setSelectedFiles((current) => current.filter((item) => item.id !== id))
  }, [])

  const clearFiles = useCallback(() => {
    setSelectedFiles([])
    setStage('idle')
    setProgress(0)
    setStageLabel('')
    setDetailLabel('')
    setError(null)
    setActiveFileName(null)
    clearTimers()
  }, [clearTimers])

  const runVisualStages = useCallback(
    async (fileLabel: string) => {
      clearTimers()
      setActiveFileName(fileLabel)

      const stages: Array<{ stage: UploadStage; label: string; detail: string; progress: number; delay: number }> = [
        {
          stage: 'uploading',
          label: `Uploading ${fileLabel}`,
          detail: 'Sending PDFs to the backend',
          progress: 28,
          delay: STAGE_DURATIONS_MS.uploading,
        },
        {
          stage: 'processing',
          label: `Processing ${fileLabel}`,
          detail: 'Extracting facts and linking evidence',
          progress: 62,
          delay: STAGE_DURATIONS_MS.processing,
        },
        {
          stage: 'updating',
          label: 'Updating fact layer',
          detail: 'Comparing relationships and refreshing results',
          progress: 86,
          delay: STAGE_DURATIONS_MS.updating,
        },
      ]

      for (const item of stages) {
        setStage(item.stage)
        setStageLabel(item.label)
        setDetailLabel(item.detail)
        setProgress(item.progress)
        await new Promise<void>((resolve) => {
          const timer = window.setTimeout(resolve, item.delay)
          timersRef.current.push(timer)
        })
      }
    },
    [clearTimers],
  )

  const upload = useCallback(async () => {
    if (!selectedFiles.length || stage === 'uploading' || stage === 'processing' || stage === 'updating') {
      return
    }

    setError(null)
    const label =
      selectedFiles.length === 1
        ? selectedFiles[0].file.name
        : `${selectedFiles.length} documents`

    try {
      await runVisualStages(label)
      const response = await uploadPdfs(selectedFiles.map((item) => item.file), options.userUid)

      setStage('complete')
      setProgress(100)
      setStageLabel('Processing complete')
      setDetailLabel(response.message)
      await options.onSuccess?.(response)

      window.setTimeout(() => {
        clearFiles()
      }, 1800)
    } catch (err) {
      clearTimers()
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Upload failed. Please try again.'
      setStage('error')
      setProgress(0)
      setStageLabel('Upload failed')
      setDetailLabel('Your selected files were preserved. Retry when ready.')
      setError(message)
    }
  }, [clearFiles, clearTimers, options, runVisualStages, selectedFiles, stage])

  const retry = useCallback(async () => {
    setStage('idle')
    setProgress(0)
    setError(null)
    await upload()
  }, [upload])

  const isBusy = stage === 'uploading' || stage === 'processing' || stage === 'updating'

  return {
    selectedFiles,
    stage,
    progress,
    stageLabel,
    detailLabel,
    error,
    isDragging,
    isBusy,
    activeFileName,
    addFiles,
    removeFile,
    clearFiles,
    upload,
    retry,
    setDragging: setIsDragging,
  }
}
