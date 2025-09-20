"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useTheme } from "@/lib/theme-context"
import { Eye, MessageCircle, Search, Filter, Calendar, DollarSign, User, Phone } from "lucide-react"
import Link from "next/link"
import { WhatsAppButton } from "@/components/whatsapp/whatsapp-button"
import { createVendorContactMessage } from "@/lib/whatsapp"
import type { Vendor, Request } from "@/lib/types"

export default function RequestsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { colors } = useTheme()
  const [vendor, setVendor] = useState<Vendor | null>(null)
  const [requests, setRequests] = useState<Request[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || "")
  const [statusFilter, setStatusFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState("all")

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    // Update search term when URL changes
    const search = searchParams.get('search')
    if (search) {
      setSearchTerm(search)
    }
  }, [searchParams])

  const loadData = async () => {
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

      // Get requests
      const { data: requestsData } = await supabase
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

      setRequests(requestsData || [])
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateRequestStatus = async (requestId: string, newStatus: string) => {
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("requests")
        .update({ status: newStatus })
        .eq("id", requestId)

      if (error) throw error

      setRequests(requests.map(r => 
        r.id === requestId ? { ...r, status: newStatus as any } : r
      ))
    } catch (error) {
      console.error('Error updating request status:', error)
      alert('Failed to update request status. Please try again.')
    }
  }

  const filteredRequests = requests.filter(request => {
    const matchesSearch = 
      request.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.customer_phone.includes(searchTerm) ||
      request.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.request_items?.some(item => 
        item.product?.title.toLowerCase().includes(searchTerm.toLowerCase())
      )
    
    const matchesStatus = statusFilter === "all" || request.status === statusFilter
    
    const matchesDate = (() => {
      if (dateFilter === "all") return true
      const requestDate = new Date(request.created_at)
      const now = new Date()
      
      switch (dateFilter) {
        case "today":
          return requestDate.toDateString() === now.toDateString()
        case "week":
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          return requestDate >= weekAgo
        case "month":
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          return requestDate >= monthAgo
        default:
          return true
      }
    })()

    return matchesSearch && matchesStatus && matchesDate
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Requests</h1>
          <p className="text-slate-600">Manage customer requests and orders</p>
        </div>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-blue-600" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by name, phone, ID, or product..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Time" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm("")
                setStatusFilter("all")
                setDateFilter("all")
              }}
              className="flex items-center gap-2"
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-800">Total Requests</p>
                <p className="text-2xl font-bold text-blue-900">{requests.length}</p>
              </div>
              <MessageCircle className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-yellow-50 to-yellow-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-800">Pending</p>
                <p className="text-2xl font-bold text-yellow-900">
                  {requests.filter(r => r.status === 'pending').length}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-800">Completed</p>
                <p className="text-2xl font-bold text-green-900">
                  {requests.filter(r => r.status === 'completed').length}
                </p>
              </div>
              <Eye className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-800">Total Revenue</p>
                <p className="text-2xl font-bold text-purple-900">
                  ${requests.reduce((sum, r) => sum + r.total_amount, 0).toFixed(2)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Requests List */}
      {filteredRequests.length > 0 ? (
        <div className="space-y-4">
          {filteredRequests.map((request) => {
            const whatsappMessage = createVendorContactMessage({
              vendorNumber: vendor?.whatsapp_number || "",
              customerName: request.customer_name,
              requestId: request.id,
            })

            return (
              <Card key={request.id} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <span>Request #{request.id.slice(-8)}</span>
                        <Badge
                          variant={
                            request.status === "pending"
                              ? "default"
                              : request.status === "completed"
                                ? "secondary"
                                : "destructive"
                          }
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
                      </CardTitle>
                      <div className="flex items-center gap-4 text-sm text-slate-600">
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          {request.customer_name}
                        </div>
                        <div className="flex items-center gap-1">
                          <Phone className="h-4 w-4" />
                          {request.customer_phone}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(request.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-slate-800">${request.total_amount}</p>
                      <p className="text-sm text-slate-500">{request.request_items?.length || 0} items</p>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-4">
                    {/* Items */}
                    <div>
                      <h4 className="font-medium mb-3 text-slate-700">Items</h4>
                      <div className="space-y-2">
                        {request.request_items?.map((item) => (
                          <div key={item.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                            <div>
                              <span className="font-medium">{item.product?.title}</span>
                              <span className="text-slate-500 ml-2">× {item.quantity}</span>
                            </div>
                            <span className="font-semibold">${(item.price * item.quantity).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Customer Note */}
                    {request.customer_note && (
                      <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <h4 className="font-medium mb-2 text-blue-800">Customer Note</h4>
                        <p className="text-sm text-blue-700 italic">"{request.customer_note}"</p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-4 border-t">
                      <div className="flex gap-2">
                        <Select
                          value={request.status}
                          onValueChange={(value) => updateRequestStatus(request.id, value)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/dashboard/requests/${request.id}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </Link>
                        </Button>
                        {vendor?.whatsapp_number && (
                          <WhatsAppButton
                            options={{
                              vendorNumber: vendor.whatsapp_number,
                              message: whatsappMessage,
                            }}
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            WhatsApp
                          </WhatsAppButton>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card className="border-0 shadow-lg">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="p-4 rounded-full bg-gradient-to-br from-blue-50 to-blue-100 mb-4">
              <MessageCircle className="h-12 w-12 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-slate-800">
              {searchTerm || statusFilter !== "all" || dateFilter !== "all" 
                ? "No requests found" 
                : "No requests yet"}
            </h3>
            <p className="text-slate-600 text-center max-w-md">
              {searchTerm || statusFilter !== "all" || dateFilter !== "all"
                ? "Try adjusting your search or filter criteria"
                : "Customer requests will appear here when they submit orders from your store"}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
