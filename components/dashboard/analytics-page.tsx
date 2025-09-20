"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useTheme } from "@/lib/theme-context"
import { 
  TrendingUp, 
  Package, 
  ShoppingCart, 
  Eye, 
  Users, 
  DollarSign, 
  Calendar,
  BarChart3,
  PieChart,
  Activity
} from "lucide-react"
import type { Vendor, Request, Product } from "@/lib/types"

interface AnalyticsData {
  totalProducts: number
  totalRequests: number
  pendingRequests: number
  completedRequests: number
  cancelledRequests: number
  totalRevenue: number
  averageOrderValue: number
  conversionRate: number
  recentRequests: Request[]
  topProducts: Array<{ product: Product; requestCount: number; revenue: number }>
  monthlyData: Array<{ month: string; requests: number; revenue: number }>
}

export default function AnalyticsPage() {
  const { colors } = useTheme()
  const [vendor, setVendor] = useState<Vendor | null>(null)
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState("30")

  useEffect(() => {
    loadAnalyticsData()
  }, [timeRange])

  const loadAnalyticsData = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get vendor info
      const { data: vendorData } = await supabase
        .from("vendors")
        .select("*")
        .eq("user_id", user.id)
        .single()

      if (!vendorData) return

      setVendor(vendorData)

      // Calculate date range
      const days = parseInt(timeRange)
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)

      // Get all data
      const [
        { count: totalProducts },
        { data: allRequests },
        { data: recentRequests },
        { data: allProducts }
      ] = await Promise.all([
        supabase
          .from("products")
          .select("*", { count: "exact", head: true })
          .eq("vendor_id", vendorData.id),
        supabase
          .from("requests")
          .select(`
            *,
            request_items (
              *,
              product:products (id, title)
            )
          `)
          .eq("vendor_id", vendorData.id)
          .gte("created_at", startDate.toISOString()),
        supabase
          .from("requests")
          .select(`
            *,
            request_items (
              *,
              product:products (title)
            )
          `)
          .eq("vendor_id", vendorData.id)
          .order("created_at", { ascending: false })
          .limit(10),
        supabase
          .from("products")
          .select("*")
          .eq("vendor_id", vendorData.id)
      ])

      const requests = allRequests || []
      const products = allProducts || []

      // Calculate analytics
      const totalRequests = requests.length
      const pendingRequests = requests.filter(r => r.status === 'pending').length
      const completedRequests = requests.filter(r => r.status === 'completed').length
      const cancelledRequests = requests.filter(r => r.status === 'cancelled').length
      const totalRevenue = requests.reduce((sum, r) => sum + r.total_amount, 0)
      const averageOrderValue = totalRequests > 0 ? totalRevenue / totalRequests : 0
      const conversionRate = totalRequests > 0 ? (completedRequests / totalRequests) * 100 : 0

      // Calculate top products
      const productStats = new Map()
      requests.forEach(request => {
        request.request_items?.forEach(item => {
          if (item.product) {
            const productId = item.product.id
            if (!productStats.has(productId)) {
              productStats.set(productId, {
                product: products.find(p => p.id === productId),
                requestCount: 0,
                revenue: 0
              })
            }
            const stats = productStats.get(productId)
            stats.requestCount += 1
            stats.revenue += item.price * item.quantity
          }
        })
      })

      const topProducts = Array.from(productStats.values())
        .filter(item => item.product)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5)

      // Calculate monthly data
      const monthlyData = []
      for (let i = 11; i >= 0; i--) {
        const date = new Date()
        date.setMonth(date.getMonth() - i)
        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1)
        const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0)
        
        const monthRequests = requests.filter(r => {
          const requestDate = new Date(r.created_at)
          return requestDate >= monthStart && requestDate <= monthEnd
        })
        
        monthlyData.push({
          month: date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
          requests: monthRequests.length,
          revenue: monthRequests.reduce((sum, r) => sum + r.total_amount, 0)
        })
      }

      setAnalyticsData({
        totalProducts: totalProducts || 0,
        totalRequests,
        pendingRequests,
        completedRequests,
        cancelledRequests,
        totalRevenue,
        averageOrderValue,
        conversionRate,
        recentRequests: recentRequests || [],
        topProducts,
        monthlyData
      })
    } catch (error) {
      console.error('Error loading analytics data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!analyticsData) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-slate-600">No analytics data available</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Analytics</h1>
          <p className="text-slate-600">Track your store performance and insights</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-800">Total Products</p>
                <p className="text-2xl font-bold text-blue-900">{analyticsData.totalProducts}</p>
              </div>
              <Package className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-800">Total Requests</p>
                <p className="text-2xl font-bold text-green-900">{analyticsData.totalRequests}</p>
              </div>
              <ShoppingCart className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-800">Total Revenue</p>
                <p className="text-2xl font-bold text-purple-900">${analyticsData.totalRevenue.toFixed(2)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-orange-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-800">Conversion Rate</p>
                <p className="text-2xl font-bold text-orange-900">{analyticsData.conversionRate.toFixed(1)}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Request Status Breakdown */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="w-5 h-5 text-blue-600" />
              Request Status
            </CardTitle>
            <CardDescription>Current request breakdown</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <span className="text-sm">Pending</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-yellow-500 text-white">{analyticsData.pendingRequests}</Badge>
                  <span className="text-sm text-slate-500">
                    {analyticsData.totalRequests > 0 ? ((analyticsData.pendingRequests / analyticsData.totalRequests) * 100).toFixed(0) : 0}%
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-sm">Completed</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-green-500 text-white">{analyticsData.completedRequests}</Badge>
                  <span className="text-sm text-slate-500">
                    {analyticsData.totalRequests > 0 ? ((analyticsData.completedRequests / analyticsData.totalRequests) * 100).toFixed(0) : 0}%
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span className="text-sm">Cancelled</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-red-500 text-white">{analyticsData.cancelledRequests}</Badge>
                  <span className="text-sm text-slate-500">
                    {analyticsData.totalRequests > 0 ? ((analyticsData.cancelledRequests / analyticsData.totalRequests) * 100).toFixed(0) : 0}%
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance Metrics */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-green-600" />
              Performance
            </CardTitle>
            <CardDescription>Key performance indicators</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Average Order Value</span>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-slate-400" />
                  <span className="font-medium">${analyticsData.averageOrderValue.toFixed(2)}</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Conversion Rate</span>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-slate-400" />
                  <span className="font-medium">{analyticsData.conversionRate.toFixed(1)}%</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Total Products</span>
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-slate-400" />
                  <span className="font-medium">{analyticsData.totalProducts}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-purple-600" />
              Top Products
            </CardTitle>
            <CardDescription>Most requested items</CardDescription>
          </CardHeader>
          <CardContent>
            {analyticsData.topProducts.length > 0 ? (
              <div className="space-y-3">
                {analyticsData.topProducts.map((item, index) => (
                  <div key={item.product.id} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-600">#{index + 1}</span>
                      <span className="text-sm font-medium truncate">{item.product.title}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">${item.revenue.toFixed(2)}</p>
                      <p className="text-xs text-slate-500">{item.requestCount} requests</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-center py-4">No product data available</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Monthly Trends */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            Monthly Trends
          </CardTitle>
          <CardDescription>Request and revenue trends over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analyticsData.monthlyData.map((month, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium w-16">{month.month}</span>
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="h-4 w-4 text-slate-400" />
                    <span className="text-sm">{month.requests} requests</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-slate-400" />
                  <span className="text-sm font-semibold">${month.revenue.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-green-600" />
            Recent Requests
          </CardTitle>
          <CardDescription>Latest customer activity</CardDescription>
        </CardHeader>
        <CardContent>
          {analyticsData.recentRequests.length > 0 ? (
            <div className="space-y-3">
              {analyticsData.recentRequests.slice(0, 5).map((request) => (
                <div key={request.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{request.customer_name}</p>
                    <p className="text-sm text-slate-500">
                      {request.request_items?.length || 0} items • ${request.total_amount}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge
                      className={
                        request.status === "pending"
                          ? "bg-yellow-500 text-white"
                          : request.status === "completed"
                            ? "bg-green-500 text-white"
                            : "bg-red-500 text-white"
                      }
                    >
                      {request.status}
                    </Badge>
                    <p className="text-xs text-slate-500 mt-1">
                      {new Date(request.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 text-center py-8">No recent requests</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
