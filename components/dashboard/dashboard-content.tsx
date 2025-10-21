"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useTheme } from "@/lib/theme-context"
import { toastHelpers } from "@/lib/toast-helpers"
import { DashboardStatsSkeleton } from "@/components/ui/loading-skeletons"
import { Plus, Eye, Copy, TrendingUp, Package, ShoppingCart, Store, Users, DollarSign, Activity, ExternalLink } from "lucide-react"
import Link from "next/link"

interface Vendor {
  id: string
  store_name: string
  store_slug: string
  description?: string
  theme_color: "blue" | "green" | "purple"
  whatsapp_number?: string
}

interface RequestItemBrief {
  id: string
  quantity: number
  price: number
  product?: { title: string }
}

interface Request {
  id: string
  customer_name: string
  customer_phone: string
  status: "pending" | "completed" | "cancelled"
  total_amount: number
  created_at: string
  request_items?: RequestItemBrief[]
}

export default function DashboardContent() {
  const { colors } = useTheme()
  const [vendor, setVendor] = useState<Vendor | null>(null)
  const [stats, setStats] = useState({
    productsCount: 0,
    requestsCount: 0,
    totalRevenue: 0,
    conversionRate: 0,
  })
  const [recentRequests, setRecentRequests] = useState<Request[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      // Load vendor
      const vendRes = await fetch('/api/dashboard/me/vendor', { cache: 'no-store' })
      if (!vendRes.ok) return
      const vendJson = await vendRes.json()
      if (!vendJson.vendor) return
      const vendorData = vendJson.vendor as Vendor
      setVendor(vendorData)

      // Load products and requests
      const [prodRes, reqRes] = await Promise.all([
        fetch('/api/dashboard/products', { cache: 'no-store' }),
        fetch('/api/dashboard/requests', { cache: 'no-store' }),
      ])
      const productsJson = prodRes.ok ? await prodRes.json() : { products: [] }
      const requestsJson = reqRes.ok ? await reqRes.json() : { requests: [] }

      const productsCount = (productsJson.products || []).length
      const requestsArr = (requestsJson.requests || []) as Request[]
      const requestsCount = requestsArr.length

      const totalRevenue = requestsArr.reduce((sum, r) => (r.status === 'completed' ? sum + (r.total_amount || 0) : sum), 0)
      const completedCount = requestsArr.filter((r) => r.status === 'completed').length
      const conversionRate = requestsCount > 0 ? (completedCount / requestsCount) * 100 : 0

      setStats({
        productsCount,
        requestsCount,
        totalRevenue,
        conversionRate: Math.round(conversionRate * 10) / 10,
      })

      const sortedRecent = [...requestsArr]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5)
      setRecentRequests(sortedRecent)
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const copyStoreLink = async () => {
    if (!vendor) return
    const storeUrl = `${window.location.origin}/store/${vendor.store_slug}`
    try {
      await navigator.clipboard.writeText(storeUrl)
      toastHelpers.storeLinkCopied()
    } catch (error) {
      console.error('Failed to copy link:', error)
      const textArea = document.createElement('textarea')
      textArea.value = storeUrl
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      toastHelpers.storeLinkCopied()
    }
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-2xl p-6 border border-slate-200">
          <div className="h-20 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <DashboardStatsSkeleton />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="h-64 bg-gray-200 rounded-2xl animate-pulse"></div>
          <div className="h-64 bg-gray-200 rounded-2xl animate-pulse"></div>
        </div>
      </div>
    )
  }

  if (!vendor) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Unable to load vendor data</p>
      </div>
    )
  }

  const storeUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/store/${vendor.store_slug}`

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-2xl p-6 border border-slate-200">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 mb-2">
              Welcome back, {vendor.store_name}!
            </h1>
            <p className="text-slate-600">
              Here's what's happening with your store today
            </p>
          </div>
          <div className="hidden md:flex items-center gap-3">
            <div className="p-3 rounded-xl bg-white shadow-sm border border-slate-200">
              <Store className="w-6 h-6 text-slate-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Store URL</p>
              <p className="font-mono text-sm text-slate-700">{vendor.store_slug}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-800">Total Products</CardTitle>
            <div className="p-2 rounded-lg bg-blue-500">
              <Package className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">{stats.productsCount}</div>
            <p className="text-xs text-blue-700">Active in your catalog</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-800">Total Requests</CardTitle>
            <div className="p-2 rounded-lg bg-green-500">
              <Users className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">{stats.requestsCount}</div>
            <p className="text-xs text-green-700">Across all time</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-800">Total Revenue</CardTitle>
            <div className="p-2 rounded-lg bg-purple-500">
              <DollarSign className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900">${stats.totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-purple-700">Completed requests</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-orange-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-800">Conversion Rate</CardTitle>
            <div className="p-2 rounded-lg bg-orange-500">
              <TrendingUp className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-900">{stats.conversionRate}%</div>
            <p className="text-xs text-orange-700">Request completion rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions & Recent Requests */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Quick Actions */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-600" />
              Quick Actions
            </CardTitle>
            <CardDescription>Manage your store efficiently</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button asChild className="w-full h-12 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg">
              <Link href="/dashboard/products/new">
                <Plus className="mr-2 h-4 w-4" />
                Add New Product
              </Link>
            </Button>
            <Button variant="outline" asChild className="w-full h-12 border-slate-200 hover:bg-slate-50">
              <Link href="/dashboard/products">
                <Package className="mr-2 h-4 w-4" />
                Manage Products
              </Link>
            </Button>
            <Button variant="outline" asChild className="w-full h-12 border-slate-200 hover:bg-slate-50">
              <Link href="/dashboard/settings">
                <Eye className="mr-2 h-4 w-4" />
                Store Settings
              </Link>
            </Button>
            <Button
              variant="outline"
              onClick={copyStoreLink}
              className="w-full h-12 border-slate-200 hover:bg-slate-50"
            >
              <Copy className="mr-2 h-4 w-4" />
              Copy Store Link
            </Button>
            <Button variant="outline" asChild className="w-full h-12 border-slate-200 hover:bg-slate-50">
              <Link href={storeUrl} target="_blank">
                <ExternalLink className="mr-2 h-4 w-4" />
                View Store
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Recent Requests */}
        <Card className="lg:col-span-2 border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-green-600" />
              Recent Requests
            </CardTitle>
            <CardDescription>Latest customer orders</CardDescription>
          </CardHeader>
          <CardContent>
            {recentRequests.length > 0 ? (
              <div className="space-y-4">
                {recentRequests.map((request) => (
                  <div key={request.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-semibold text-slate-800">{request.customer_name}</h4>
                        <Badge 
                          variant="outline" 
                          className={
                            request.status === "pending" 
                              ? "border-yellow-200 text-yellow-800 bg-yellow-50"
                              : request.status === "completed"
                                ? "border-green-200 text-green-800 bg-green-50"
                                : "border-red-200 text-red-800 bg-red-50"
                          }
                        >
                          {request.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-600">
                        {request.request_items?.length || 0} items • ${request.total_amount.toFixed(2)}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {new Date(request.created_at).toLocaleDateString()} at {new Date(request.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/dashboard/requests/${request.id}`}>
                        View Details
                      </Link>
                    </Button>
                  </div>
                ))}
                <div className="text-center pt-4">
                  <Button variant="outline" asChild>
                    <Link href="/dashboard/requests">View All Requests</Link>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <ShoppingCart className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500 mb-4">No requests yet</p>
                <p className="text-sm text-slate-400">Share your store link to start receiving orders</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}