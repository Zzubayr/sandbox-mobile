"use client"

import { useEffect } from "react"
import { useSpotlightSearchStore } from "@/lib/spotlight-search-store"

export function useSpotlightSearch() {
  const { isOpen, context, vendorSlug, openSearch, closeSearch } = useSpotlightSearchStore()

  // Global keyboard shortcut (Cmd/Ctrl + K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        if (isOpen) {
          closeSearch()
        } else {
          // Determine context based on current path
          const path = window.location.pathname
          if (path.startsWith('/dashboard')) {
            openSearch('dashboard')
          } else if (path.startsWith('/store/')) {
            const slug = path.split('/')[2]
            openSearch('storefront', slug)
          } else {
            openSearch('dashboard') // Default to dashboard if path is unknown
          }
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, openSearch, closeSearch])

  return {
    isOpen,
    context,
    vendorSlug,
    openSearch,
    closeSearch
  }
}