"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { MessageCircle } from "lucide-react"
import { generateWhatsAppUrl, openWhatsApp } from "@/lib/whatsapp"
import type { WhatsAppMessageOptions } from "@/lib/whatsapp"

interface WhatsAppButtonProps {
  options: WhatsAppMessageOptions
  children?: React.ReactNode
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive"
  size?: "default" | "sm" | "lg" | "icon"
  className?: string
  disabled?: boolean
}

export function WhatsAppButton({
  options,
  children,
  variant = "default",
  size = "default",
  className = "",
  disabled = false,
}: WhatsAppButtonProps) {
  const handleClick = () => {
    try {
      const url = generateWhatsAppUrl(options)
      openWhatsApp(url)
    } catch (error) {
      console.error("Error opening WhatsApp:", error)
      alert("Unable to open WhatsApp. Please check the phone number.")
    }
  }

  return (
    <Button
      onClick={handleClick}
      variant={variant}
      size={size}
      className={`bg-green-600 hover:bg-green-700 ${className}`}
      disabled={disabled || !options.vendorNumber}
    >
      <MessageCircle className="mr-2 h-4 w-4" />
      {children || "WhatsApp"}
    </Button>
  )
}
