"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { 
  Clock, 
  ArrowLeft, 
  Shield, 
  CheckCircle,
  XCircle,
  AlertTriangle
} from "lucide-react"
import Link from "next/link"
import type { Vendor } from "@/lib/types"

interface PendingApprovalPageProps {
  vendor: Vendor
}

export function PendingApprovalPage({ vendor }: PendingApprovalPageProps) {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pending':
        return {
          icon: Clock,
          title: "Store Pending Approval",
          description: "Your store is currently under review. Our team will review your application and get back to you soon.",
          bgColor: "bg-yellow-50",
          borderColor: "border-yellow-200",
          iconColor: "text-yellow-600",
          titleColor: "text-yellow-800",
          descriptionColor: "text-yellow-700"
        }
      case 'rejected':
        return {
          icon: XCircle,
          title: "Store Application Rejected",
          description: "Unfortunately, your store application was not approved. Please review the admin notes and make necessary changes.",
          bgColor: "bg-red-50",
          borderColor: "border-red-200",
          iconColor: "text-red-600",
          titleColor: "text-red-800",
          descriptionColor: "text-red-700"
        }
      default:
        return {
          icon: AlertTriangle,
          title: "Store Status Unknown",
          description: "There seems to be an issue with your store status. Please contact support for assistance.",
          bgColor: "bg-gray-50",
          borderColor: "border-gray-200",
          iconColor: "text-gray-600",
          titleColor: "text-gray-800",
          descriptionColor: "text-gray-700"
        }
    }
  }

  const config = getStatusConfig(vendor.approval_status)
  const Icon = config.icon

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] -z-10" />
      
      <div className="w-full max-w-md">
        {/* Animated Card */}
        <Card className={`${config.bgColor} ${config.borderColor} border-2 shadow-2xl animate-in fade-in-0 slide-in-from-bottom-4 duration-700`}>
          <CardContent className="p-8 text-center">
            {/* Animated Icon */}
            <div className="mb-6">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white shadow-lg animate-pulse">
                <Icon className={`h-10 w-10 ${config.iconColor}`} />
              </div>
            </div>

            {/* Store Info */}
            <div className="mb-6">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900">{vendor.store_name}</h1>
              </div>
              <p className="text-gray-600">Store Slug: /{vendor.store_slug}</p>
            </div>

            {/* Status Message */}
            <div className="mb-8">
              <h2 className={`text-xl font-semibold ${config.titleColor} mb-3`}>
                {config.title}
              </h2>
              <p className={`${config.descriptionColor} leading-relaxed`}>
                {config.description}
              </p>
            </div>

            {/* Admin Notes */}
            {vendor.admin_notes && (
              <div className="mb-6 p-4 bg-white/50 rounded-lg border border-white/20">
                <h3 className="font-medium text-gray-800 mb-2">Admin Notes:</h3>
                <p className="text-sm text-gray-700">{vendor.admin_notes}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button 
                asChild
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <Link href="/">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Homepage
                </Link>
              </Button>
              
              {vendor.approval_status === 'rejected' && (
                <Button 
                  asChild
                  variant="outline"
                  className="w-full border-gray-300 hover:bg-gray-50"
                >
                  <Link href="/auth/login">
                    <Shield className="h-4 w-4 mr-2" />
                    Access Dashboard
                  </Link>
                </Button>
              )}
            </div>

            {/* Status Timeline */}
            <div className="mt-8 pt-6 border-t border-white/20">
              <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                <Clock className="h-4 w-4" />
                <span>Created: {new Date(vendor.created_at).toLocaleDateString()}</span>
              </div>
              
              {vendor.approved_at && (
                <div className="flex items-center justify-center gap-2 text-sm text-gray-600 mt-2">
                  {vendor.approval_status === 'approved' ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                  <span>
                    {vendor.approval_status === 'approved' ? 'Approved' : 'Rejected'}: {' '}
                    {new Date(vendor.approved_at).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-xs text-gray-500">
            Need help? Contact our support team for assistance.
          </p>
        </div>
      </div>
    </div>
  )
}
