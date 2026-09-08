'use client'

import { useCallback, useState } from 'react'

export function useSidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const toggleCollapsed = useCallback(() => {
    setCollapsed((current) => !current)
  }, [])

  const openMobile = useCallback(() => {
    setMobileOpen(true)
  }, [])

  const closeMobile = useCallback(() => {
    setMobileOpen(false)
  }, [])

  return {
    collapsed,
    mobileOpen,
    setCollapsed,
    setMobileOpen,
    toggleCollapsed,
    openMobile,
    closeMobile,
  }
}
