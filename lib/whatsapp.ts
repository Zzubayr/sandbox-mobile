/**
 * WhatsApp Integration Utilities
 * Centralized functions for WhatsApp messaging and URL generation
 */

export interface WhatsAppMessageOptions {
  vendorNumber: string
  customerName?: string
  requestId?: string
  message?: string
  storeName?: string
  totalAmount?: number
  itemCount?: number
}

/**
 * Generates a WhatsApp URL with pre-filled message
 */
export function generateWhatsAppUrl(options: WhatsAppMessageOptions): string {
  const { vendorNumber, message } = options

  if (!vendorNumber) {
    throw new Error("Vendor WhatsApp number is required")
  }

  // Clean phone number (remove any non-digits except +)
  const cleanNumber = vendorNumber.replace(/[^\d+]/g, "")

  // Encode the message for URL
  const encodedMessage = encodeURIComponent(message || "")

  return `https://wa.me/${cleanNumber}?text=${encodedMessage}`
}

/**
 * Creates a customer request message for WhatsApp
 */
export function createCustomerRequestMessage(options: WhatsAppMessageOptions): string {
  const { customerName, requestId, storeName, totalAmount, itemCount } = options

  const shortRequestId = requestId?.slice(-8) || "N/A"
  const items = itemCount ? `${itemCount} items` : "items"
  const total = totalAmount ? `$${totalAmount}` : "TBD"

  return `Hi ${storeName}! I just submitted a request (#${shortRequestId}) for ${items} totaling ${total}. Please let me know about availability and next steps. Thanks!`
}

/**
 * Creates a vendor contact message for WhatsApp
 */
export function createVendorContactMessage(options: WhatsAppMessageOptions): string {
  const { customerName, requestId } = options

  const shortRequestId = requestId?.slice(-8) || "N/A"

  return `Hi ${customerName}, regarding your request #${shortRequestId}...`
}

/**
 * Opens WhatsApp with the generated URL
 */
export function openWhatsApp(url: string): void {
  if (typeof window !== "undefined") {
    window.open(url, "_blank")
  }
}

/**
 * Validates WhatsApp phone number format
 */
export function validateWhatsAppNumber(number: string): boolean {
  if (!number) return false

  // Remove all non-digit characters except +
  const cleaned = number.replace(/[^\d+]/g, "")

  // Should start with + and have at least 10 digits
  const phoneRegex = /^\+\d{10,15}$/

  return phoneRegex.test(cleaned)
}

/**
 * Formats WhatsApp number for display
 */
export function formatWhatsAppNumber(number: string): string {
  if (!number) return ""

  const cleaned = number.replace(/[^\d+]/g, "")

  // Basic formatting for common patterns
  if (cleaned.startsWith("+1") && cleaned.length === 12) {
    // US/Canada format: +1 (XXX) XXX-XXXX
    const match = cleaned.match(/^\+1(\d{3})(\d{3})(\d{4})$/)
    if (match) {
      return `+1 (${match[1]}) ${match[2]}-${match[3]}`
    }
  }

  return cleaned
}
