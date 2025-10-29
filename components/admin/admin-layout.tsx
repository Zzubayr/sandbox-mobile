"use client"

import type React from "react"
import { useState } from "react"
import { AdminSidebar } from "./admin-sidebar"
import { AdminHeader } from "./admin-header"

interface AdminLayoutProps {
  userEmail?: string
  isSuperAdmin?: boolean
  children: React.ReactNode
}

export function AdminLayout({ userEmail, isSuperAdmin, children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} isSuperAdmin={!!isSuperAdmin} />
      <div className="lg:pl-64">
        <AdminHeader 
          userEmail={userEmail} 
          onMenuClick={() => setSidebarOpen(true)}
        />
        <main className="py-4 lg:py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
