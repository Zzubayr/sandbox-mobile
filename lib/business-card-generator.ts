/**
 * Generate a shareable business card image for a vendor.
 * Inspired by the provided examples: left-aligned business info, right contact, soft gradients.
 */

export type BusinessCardVariant =
  | "midnight"
  | "slate"
  | "indigo"
  | "ocean"
  | "sunset"
  | "sky"

export interface BusinessCardOptions {
  businessName: string
  tagline?: string
  description?: string
  phone?: string
  website?: string
  logoUrl?: string
  variant?: BusinessCardVariant
}

type VariantSpec = {
  name: BusinessCardVariant
  gradient: [string, string]
  accent: string
  watermarkOpacity: number
}

const VARIANTS: Record<BusinessCardVariant, VariantSpec> = {
  midnight: { name: "midnight", gradient: ["#121C24", "#0C1116"], accent: "#FFFFFF", watermarkOpacity: 1 },
  slate: { name: "slate", gradient: ["#1F2933", "#111827"], accent: "#FFFFFF", watermarkOpacity: 1 },
  indigo: { name: "indigo", gradient: ["#0D1B44", "#1A2F5A"], accent: "#FFFFFF", watermarkOpacity: 1 },
  ocean: { name: "ocean", gradient: ["#1B3A57", "#2A6F90"], accent: "#FFFFFF", watermarkOpacity: 1 },
  sunset: { name: "sunset", gradient: ["#FF6126", "#2C6DB3"], accent: "#FFFFFF", watermarkOpacity: 0.2 },
  sky: { name: "sky", gradient: ["#0D47A1", "#2196F3"], accent: "#FFFFFF", watermarkOpacity: 1 },
}

async function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`Failed to load image: ${url}`))
    img.src = url
  })
}

export async function generateBusinessCard(options: BusinessCardOptions): Promise<Blob> {
  const {
    businessName,
    tagline = "",
    description = "",
    phone = "",
    website = "",
    logoUrl,
    variant = "ocean",
  } = options

  const { gradient, accent, watermarkOpacity } = VARIANTS[variant]

  const WIDTH = 1800
  const HEIGHT = 900
  const canvas = document.createElement("canvas")
  canvas.width = WIDTH
  canvas.height = HEIGHT
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("Unable to create canvas context")

  // Background gradient
  const bg = ctx.createLinearGradient(0, 0, 0, HEIGHT)
  bg.addColorStop(0, gradient[0])
  bg.addColorStop(1, gradient[1])
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, WIDTH, HEIGHT)

  // Rounded corners mask
  const radius = 40
  ctx.globalCompositeOperation = "destination-in"
  ctx.beginPath()
  ctx.moveTo(radius, 0)
  ctx.arcTo(WIDTH, 0, WIDTH, HEIGHT, radius)
  ctx.arcTo(WIDTH, HEIGHT, 0, HEIGHT, radius)
  ctx.arcTo(0, HEIGHT, 0, 0, radius)
  ctx.arcTo(0, 0, WIDTH, 0, radius)
  ctx.closePath()
  ctx.fill()
  ctx.globalCompositeOperation = "source-over"

  // Watermark: UmmahSquare logo centered, tinted per variant
  try {
    const watermark = await loadImage("/logo.png")
    const wmSize = 640
    const tintCanvas = document.createElement("canvas")
    tintCanvas.width = wmSize
    tintCanvas.height = wmSize
    const tintCtx = tintCanvas.getContext("2d")
    if (tintCtx) {
      tintCtx.drawImage(watermark, 0, 0, wmSize, wmSize)
      tintCtx.globalCompositeOperation = "source-in"
      tintCtx.fillStyle = gradient[0]
      tintCtx.globalAlpha = 0.9
      tintCtx.fillRect(0, 0, wmSize, wmSize)
    }

    ctx.save()
    ctx.translate(WIDTH * 0.55, HEIGHT * 0.5)
    ctx.rotate(-0.05)
    ctx.globalAlpha = watermarkOpacity
    ctx.drawImage(tintCanvas, -wmSize / 2, -wmSize / 2)
    ctx.restore()
  } catch (err) {
    console.warn("Watermark logo failed to load", err)
  }

  // Text styles
  ctx.fillStyle = accent
  ctx.textAlign = "left"
  ctx.shadowColor = "rgba(0,0,0,0.25)"
  ctx.shadowBlur = 10
  ctx.shadowOffsetY = 2

  const leftX = 120
  let y = 200

  // Business name
  ctx.font = "800 86px 'Inter', 'Helvetica Neue', Arial, sans-serif"
  ctx.fillText(businessName, leftX, y)
  y += 70

  // Tagline
  if (tagline) {
    ctx.font = "600 36px 'Inter', 'Helvetica Neue', Arial, sans-serif"
    ctx.fillText(tagline, leftX, y)
    y += 70
  }

  // Description
  if (description) {
    ctx.font = "400 30px 'Inter', 'Helvetica Neue', Arial, sans-serif"
    const maxWidth = WIDTH * 0.4
    const words = description.split(" ")
    let line = ""
    const lines: string[] = []
    for (const word of words) {
      const test = line ? `${line} ${word}` : word
      if (ctx.measureText(test).width > maxWidth) {
        lines.push(line)
        line = word
      } else {
        line = test
      }
    }
    if (line) lines.push(line)
    for (const l of lines.slice(0, 3)) {
      ctx.fillText(l, leftX, y)
      y += 44
    }
  }

  // Contact and logo on right
  const rightX = WIDTH * 0.62
  const contactYStart = HEIGHT * 0.45
  ctx.font = "600 32px 'Inter', 'Helvetica Neue', Arial, sans-serif"
  ctx.fillText("Contact us:", rightX, contactYStart)

  ctx.font = "400 30px 'Inter', 'Helvetica Neue', Arial, sans-serif"
  let cy = contactYStart + 55
  if (phone) {
    ctx.fillText(`☎  ${phone}`, rightX, cy)
    cy += 50
  }
  if (website) {
    ctx.fillText(`🌐  ${website}`, rightX, cy)
  }

  // Logo top-right if available
  // Logo top-right if available
  if (logoUrl) {
    try {
      const logo = await loadImage(logoUrl)
      const size = 200
      const padding = 80
      const x = WIDTH - size - padding
      const y = padding
      const radius = size / 2
      const cx = x + radius
      const cy = y + radius

      ctx.save()

      // 1. Draw white container circle with shadow
      ctx.beginPath()
      ctx.arc(cx, cy, radius, 0, Math.PI * 2)
      ctx.fillStyle = "#FFFFFF"
      ctx.shadowColor = "rgba(0, 0, 0, 0.15)"
      ctx.shadowBlur = 20
      ctx.shadowOffsetY = 8
      ctx.fill()

      // 2. Create clip for logo (leaving a white border)
      ctx.shadowColor = "transparent" // Reset shadow for the clip content
      ctx.beginPath()
      const border = 8
      ctx.arc(cx, cy, radius - border, 0, Math.PI * 2)
      ctx.clip()

      // 3. Draw logo
      // Draw a white background behind the logo first (for transparent logos)
      ctx.fillStyle = "#FFFFFF"
      ctx.fillRect(x, y, size, size)
      ctx.drawImage(logo, x + border, y + border, size - (border * 2), size - (border * 2))

      ctx.restore()
    } catch (err) {
      console.warn("Logo load failed for business card", err)
    }
  }

  // Footer
  ctx.font = "500 26px 'Inter', 'Helvetica Neue', Arial, sans-serif"
  ctx.fillStyle = "rgba(255,255,255,0.8)"
  ctx.textAlign = "right"
  ctx.fillText("Powered by: UmmahSquare", WIDTH - 80, HEIGHT - 60)

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob)
        else reject(new Error("Failed to generate business card"))
      },
      "image/png",
      0.92
    )
  })
}
