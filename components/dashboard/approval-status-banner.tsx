"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  ExternalLink,
  X
} from "lucide-react"
import type { Vendor } from "@/lib/types"

interface ApprovalStatusBannerProps {
  vendor: Vendor
}

export function ApprovalStatusBanner({ vendor }: ApprovalStatusBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false)
  const [hasShownNotification, setHasShownNotification] = useState(false)

  // Check if user has already seen this notification
  useEffect(() => {
    const notificationKey = `approval-notification-${vendor.id}-${vendor.approval_status}`
    const hasSeen = localStorage.getItem(notificationKey)
    
    if (hasSeen) {
      setIsDismissed(true)
    } else {
      setHasShownNotification(true)
      // Mark as seen after 5 seconds automatically
      const timer = setTimeout(() => {
        localStorage.setItem(notificationKey, 'true')
        setIsDismissed(true)
      }, 20000)
      
      return () => clearTimeout(timer)
    }
  }, [vendor.id, vendor.approval_status])

  const handleDismiss = () => {
    const notificationKey = `approval-notification-${vendor.id}-${vendor.approval_status}`
    localStorage.setItem(notificationKey, 'true')
    setIsDismissed(true)
  }

  // Don't show if dismissed or if status hasn't changed
  if (isDismissed || !hasShownNotification) {
    return null
  }
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pending':
        return {
          icon: Clock,
          title: "Store Pending Approval",
          description: "Your store is being reviewed by our admin team. It will be visible to customers once approved.",
          bgColor: "bg-yellow-50",
          borderColor: "border-yellow-200",
          iconColor: "text-yellow-600",
          titleColor: "text-yellow-800",
          descriptionColor: "text-yellow-700"
        }
      case 'approved':
        return {
          icon: CheckCircle,
          title: "Store Approved",
          description: "Your store is live and visible to customers! You can start receiving orders.",
          bgColor: "bg-green-50",
          borderColor: "border-green-200",
          iconColor: "text-green-600",
          titleColor: "text-green-800",
          descriptionColor: "text-green-700"
        }
      case 'rejected':
        return {
          icon: XCircle,
          title: "Store Rejected",
          description: "Your store application was rejected. Please review the admin notes and make necessary changes.",
          bgColor: "bg-red-50",
          borderColor: "border-red-200",
          iconColor: "text-red-600",
          titleColor: "text-red-800",
          descriptionColor: "text-red-700"
        }
      default:
        return {
          icon: AlertTriangle,
          title: "Unknown Status",
          description: "Please contact support for assistance.",
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
    <Card className={`${config.bgColor} ${config.borderColor} border-2`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Icon className={`h-5 w-5 ${config.iconColor} mt-0.5 flex-shrink-0`} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <h3 className={`text-sm font-medium ${config.titleColor}`}>
                  {config.title}
                </h3>
                <Badge 
                  variant="outline" 
                  className={`${config.borderColor} ${config.titleColor} text-xs`}
                >
                  {vendor.approval_status}
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDismiss}
                className="h-6 w-6 p-0 hover:bg-white/50"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
            <p className={`text-sm ${config.descriptionColor}`}>
              {config.description}
            </p>
            
            {/* Admin Notes */}
            {vendor.admin_notes && (
              <div className="mt-3 p-3 bg-white/50 rounded-lg border border-gray-200">
                <h4 className="text-xs font-medium text-gray-700 mb-1">Admin Notes:</h4>
                <p className="text-xs text-gray-600">{vendor.admin_notes}</p>
              </div>
            )}

            {/* Storefront Link for Approved Vendors */}
            {vendor.approval_status === 'approved' && (
              <div className="mt-3">
                <a
                  href={`/store/${vendor.store_slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
                >
                  View Your Storefront
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}

            {/* Approval Date */}
            {vendor.approved_at && (
              <div className="mt-2">
                <p className="text-xs text-gray-500">
                  {vendor.approval_status === 'approved' ? 'Approved' : 'Rejected'} on{' '}
                  {new Date(vendor.approved_at).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
