"use client"

import React, { createContext, useContext, useEffect, useState } from 'react'
import { applyThemeToDocument, getThemeColors } from '@/lib/theme-colors'

type Theme = "blue" | "green" | "purple"

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  colors: ReturnType<typeof getThemeColors>
  isLoading: boolean
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("blue")
  const [isLoading, setIsLoading] = useState(true)
  

  const colors = getThemeColors(theme)

  // Only hit Supabase on protected routes to avoid extra network calls on public pages
  const isProtectedRoute = () => {
    if (typeof window === 'undefined') return false
    const p = window.location.pathname
    return p.startsWith('/dashboard') || p.startsWith('/admin')
  }

  const setTheme = async (newTheme: Theme) => {
    setThemeState(newTheme)
    applyThemeToDocument(newTheme)
    
    // Save theme to user's vendor profile only on protected routes
    if (isProtectedRoute()) {
      try {
        await fetch('/api/dashboard/vendor', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ theme_color: newTheme })
        })
      } catch (error) {
        console.error('Error saving theme:', error)
      }
    }
  }

  useEffect(() => {
    const loadUserTheme = async () => {
      try {
        if (!isProtectedRoute()) return
        const res = await fetch('/api/dashboard/vendor', { cache: 'no-store' })
        if (res.ok) {
          const json = await res.json()
          const vendor = json.vendor
          if (vendor?.theme_color) {
            setThemeState(vendor.theme_color as Theme)
            applyThemeToDocument(vendor.theme_color as Theme)
          }
        }
      } catch (error) {
        console.error('Error loading theme:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadUserTheme()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <ThemeContext.Provider value={{ theme, setTheme, colors, isLoading }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
