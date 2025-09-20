"use client"

import React, { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
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
  const supabase = createClient()

  const colors = getThemeColors(theme)

  const setTheme = async (newTheme: Theme) => {
    setThemeState(newTheme)
    applyThemeToDocument(newTheme)
    
    // Save theme to user's vendor profile
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: vendor } = await supabase
          .from('vendors')
          .select('id')
          .eq('user_id', user.id)
          .single()
        
        if (vendor) {
          await supabase
            .from('vendors')
            .update({ theme_color: newTheme })
            .eq('id', vendor.id)
        }
      }
    } catch (error) {
      console.error('Error saving theme:', error)
    }
  }

  useEffect(() => {
    const loadUserTheme = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: vendor } = await supabase
            .from('vendors')
            .select('theme_color')
            .eq('user_id', user.id)
            .single()
          
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
  }, [supabase])

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
