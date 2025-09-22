"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { MessageCircle, RotateCcw, Send } from "lucide-react"
import { WhatsAppButton } from "./whatsapp-button"
import { createDetailedCustomerRequestMessage } from "@/lib/whatsapp"
import type { WhatsAppMessageOptions } from "@/lib/whatsapp"

interface WhatsAppMessageCustomizerProps {
  options: WhatsAppMessageOptions & { requestUrl?: string }
  onSend?: (message: string) => void
  className?: string
}

export function WhatsAppMessageCustomizer({
  options,
  onSend,
  className = "",
}: WhatsAppMessageCustomizerProps) {
  const [customMessage, setCustomMessage] = useState("")
  const [useCustom, setUseCustom] = useState(false)

  const defaultMessage = createDetailedCustomerRequestMessage({
    ...options,
    message: undefined, // Force default message
  })

  const currentMessage = useCustom ? customMessage : defaultMessage

  const handleReset = () => {
    setCustomMessage("")
    setUseCustom(false)
  }

  const handleSend = () => {
    if (onSend) {
      onSend(currentMessage)
    }
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          WhatsApp Message
        </CardTitle>
        <CardDescription>
          Customize your message to the vendor or use the default template
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Message Preview */}
        <div>
          <Label className="text-sm font-medium">Message Preview</Label>
          <div className="mt-2 p-3 bg-muted/50 rounded-lg border">
            <p className="text-sm whitespace-pre-wrap">{currentMessage}</p>
          </div>
        </div>

        {/* Custom Message Input */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label htmlFor="custom-message">Custom Message (Optional)</Label>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setUseCustom(!useCustom)}
                className="text-xs"
              >
                {useCustom ? "Use Default" : "Customize"}
              </Button>
              {useCustom && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReset}
                  className="text-xs"
                >
                  <RotateCcw className="h-3 w-3 mr-1" />
                  Reset
                </Button>
              )}
            </div>
          </div>
          <Textarea
            id="custom-message"
            placeholder="Type your custom message here..."
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
            className="min-h-[100px]"
            disabled={!useCustom}
          />
          <p className="text-xs text-muted-foreground mt-1">
            {useCustom 
              ? "Your custom message will be sent instead of the default template"
              : "Click 'Customize' to write your own message"
            }
          </p>
        </div>

        {/* Message Info */}
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="text-xs">
            {currentMessage.length} characters
          </Badge>
          <Badge variant="outline" className="text-xs">
            {currentMessage.split('\n').length} lines
          </Badge>
          {options.requestId && (
            <Badge variant="outline" className="text-xs">
              Request #{options.requestId.slice(-8)}
            </Badge>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <WhatsAppButton
            options={{
              ...options,
              message: currentMessage,
            }}
            className="flex-1"
          >
            <Send className="mr-2 h-4 w-4" />
            Send via WhatsApp
          </WhatsAppButton>
          
          {onSend && (
            <Button
              variant="outline"
              onClick={handleSend}
              className="px-6"
            >
              <MessageCircle className="mr-2 h-4 w-4" />
              Send
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
