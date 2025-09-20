"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { WhatsAppButton } from "./whatsapp-button"
import { formatWhatsAppNumber } from "@/lib/whatsapp"
import { MessageCircle, Phone } from "lucide-react"

interface WhatsAppContactCardProps {
  vendorName: string
  vendorNumber: string
  message: string
  title?: string
  description?: string
}

export function WhatsAppContactCard({
  vendorName,
  vendorNumber,
  message,
  title = "Contact Vendor",
  description = "Get in touch via WhatsApp",
}: WhatsAppContactCardProps) {
  if (!vendorNumber) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-green-600" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 text-sm">
          <Phone className="h-4 w-4 text-muted-foreground" />
          <span>{formatWhatsAppNumber(vendorNumber)}</span>
        </div>

        <WhatsAppButton
          options={{
            vendorNumber,
            message,
          }}
          size="lg"
          className="w-full"
        >
          Message {vendorName}
        </WhatsAppButton>

        <p className="text-xs text-muted-foreground text-center">This will open WhatsApp with a pre-filled message</p>
      </CardContent>
    </Card>
  )
}
