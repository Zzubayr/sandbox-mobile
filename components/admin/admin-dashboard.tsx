"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  Users, 
  Package, 
  ShoppingCart, 
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  Activity,
  DollarSign
} from "lucide-react"
import Link from "next/link"

interface AdminStats {
  vendors: {
    total: number
    pending: number
    approved: number
    rejected: number
    active: number
  }
  products: {
    total: number
    active: number
  }
  requests: {
    total: number
    pending: number
    completed: number
  }
  recentActivity: {
    vendors: number
    products: number
    requests: number
  }
}

interface AdminDashboardProps {
  initialStats?: AdminStats
}

export function AdminDashboard({ initialStats }: AdminDashboardProps) {
  const [stats, setStats] = useState<AdminStats | null>(initialStats || null)
  const [loading, setLoading] = useState(false)

  const fetchStats = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Always fetch stats on component mount to ensure fresh data
    fetchStats()
  }, [])

  // Default stats structure
  const defaultStats: AdminStats = {
    vendors: { total: 0, pending: 0, approved: 0, rejected: 0, active: 0 },
    products: { total: 0, active: 0 },
    requests: { total: 0, pending: 0, completed: 0 },
    recentActivity: { vendors: 0, products: 0, requests: 0 }
  }

  const currentStats = stats || defaultStats

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 text-sm sm:text-base">Overview of your platform</p>
        </div>
        <Button onClick={fetchStats} disabled={loading} className="w-full sm:w-auto">
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
              Loading...
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Refresh
            </div>
          )}
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Vendors */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Vendors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentStats.vendors?.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              {currentStats.vendors?.active || 0} active stores
            </p>
          </CardContent>
        </Card>

        {/* Pending Approvals */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{currentStats.vendors?.pending || 0}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting review
            </p>
          </CardContent>
        </Card>

        {/* Total Products */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentStats.products?.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              {currentStats.products?.active || 0} active products
            </p>
          </CardContent>
        </Card>

        {/* Total Requests */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentStats.requests?.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              {currentStats.requests?.pending || 0} pending
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Vendor Status Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Vendor Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">Approved</span>
                </div>
                <span className="text-sm font-bold text-green-600">{currentStats.vendors?.approved || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm font-medium">Pending</span>
                </div>
                <span className="text-sm font-bold text-yellow-600">{currentStats.vendors?.pending || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-600" />
                  <span className="text-sm font-medium">Rejected</span>
                </div>
                <span className="text-sm font-bold text-red-600">{currentStats.vendors?.rejected || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity (7 days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">New Vendors</span>
                </div>
                <span className="text-sm font-bold">{currentStats.recentActivity?.vendors || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">New Products</span>
                </div>
                <span className="text-sm font-bold">{currentStats.recentActivity?.products || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4 text-purple-600" />
                  <span className="text-sm font-medium">New Requests</span>
                </div>
                <span className="text-sm font-bold">{currentStats.recentActivity?.requests || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/admin/vendors">
              <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center gap-2">
                <Users className="h-6 w-6" />
                <span>Manage Vendors</span>
              </Button>
            </Link>
            <Link href="/admin/users">
              <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center gap-2">
                <Users className="h-6 w-6" />
                <span>Manage Users</span>
              </Button>
            </Link>
            <Link href="/admin/analytics">
              <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center gap-2">
                <TrendingUp className="h-6 w-6" />
                <span>View Analytics</span>
              </Button>
            </Link>
            <Link href="/admin/settings">
              <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center gap-2">
                <DollarSign className="h-6 w-6" />
                <span>System Settings</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
