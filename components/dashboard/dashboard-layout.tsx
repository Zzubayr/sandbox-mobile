"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Sidebar } from "@/components/dashboard/sidebar"
import { MobileSidebar } from "@/components/dashboard/mobile-sidebar"
import { Header } from "@/components/dashboard/header"
import { ApprovalStatusBanner } from "@/components/dashboard/approval-status-banner"
import { useTheme } from "@/lib/theme-context"
import type { Vendor } from "@/lib/types"

interface DashboardLayoutProps {
  children: React.ReactNode
  userEmail?: string
  vendor?: Vendor
}

export default function DashboardLayout({ children, userEmail, vendor }: DashboardLayoutProps) {
  const { theme, setTheme } = useTheme()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Apply vendor's theme if available
    if (vendor?.theme_color && vendor.theme_color !== theme) {
      setTheme(vendor.theme_color)
    }
    setLoading(false)
  }, [vendor?.theme_color, theme, setTheme])

  if (loading) {
    return (
      <div className="flex h-screen bg-background items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar storeName={vendor?.store_name} />
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          title="Dashboard"
          userEmail={userEmail}
          mobileSidebar={<MobileSidebar storeName={vendor?.store_name} />}
        />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gradient-to-br from-slate-50 to-slate-100">
          {/* Approval Status Banner */}
          {vendor && (
            <div className="mb-6">
              <ApprovalStatusBanner vendor={vendor} />
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  )
}
