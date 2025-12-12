/**
 * Client-side product poster generator using HTML Canvas API
 * Generates shareable product images similar to Substack's style
 */

export interface PosterOptions {
    productImage: string
    productTitle: string
    productDescription: string
    businessName: string
    logoUrl?: string
}

/**
 * Load an image from URL and return as HTMLImageElement
 */
function loadImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image()
        img.crossOrigin = "anonymous"
        img.onload = () => resolve(img)
        img.onerror = () => reject(new Error(`Failed to load image: ${url}`))
        img.src = url
    })
}

/**
 * Wrap text to fit within a specified width
 */
function wrapText(
    ctx: CanvasRenderingContext2D,
    text: string,
    maxWidth: number
): string[] {
    const words = text.split(" ")
    const lines: string[] = []
    let currentLine = ""

    for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word
        const metrics = ctx.measureText(testLine)

        if (metrics.width > maxWidth && currentLine) {
            lines.push(currentLine)
            currentLine = word
        } else {
            currentLine = testLine
        }
    }

    if (currentLine) {
        lines.push(currentLine)
    }

    return lines
}

/**
 * Generate a shareable product poster image
 * @returns Promise<Blob> PNG image blob
 */
export async function generateProductPoster(
    options: PosterOptions
): Promise<Blob> {
    const { productImage, productTitle, productDescription, businessName, logoUrl } = options

    // Canvas dimensions (1080x1350 4:5 ratio for best cross-platform quality)
    const WIDTH = 1080
    const HEIGHT = 1350

    // Create canvas
    const canvas = document.createElement("canvas")
    canvas.width = WIDTH
    canvas.height = HEIGHT
    const ctx = canvas.getContext("2d")

    if (!ctx) {
        throw new Error("Failed to get canvas context")
    }

    // Load background image
    let bgImage: HTMLImageElement | null = null
    try {
        bgImage = await loadImage(productImage)
    } catch (err) {
        console.warn("Failed to load product image, using fallback", err)
    }

    // Draw background
    if (bgImage) {
        // Draw image to fill canvas while maintaining aspect ratio
        const imgRatio = bgImage.width / bgImage.height
        const canvasRatio = WIDTH / HEIGHT
        let drawWidth, drawHeight, offsetX, offsetY

        if (imgRatio > canvasRatio) {
            // Image is wider, fit to height
            drawHeight = HEIGHT
            drawWidth = bgImage.width * (HEIGHT / bgImage.height)
            offsetX = (WIDTH - drawWidth) / 2
            offsetY = 0
        } else {
            // Image is taller, fit to width
            drawWidth = WIDTH
            drawHeight = bgImage.height * (WIDTH / bgImage.width)
            offsetX = 0
            offsetY = (HEIGHT - drawHeight) / 2
        }

        ctx.drawImage(bgImage, offsetX, offsetY, drawWidth, drawHeight)

        // Apply darkening overlay
        ctx.fillStyle = "rgba(0, 0, 0, 0.5)"
        ctx.fillRect(0, 0, WIDTH, HEIGHT)
    } else {
        // Fallback gradient background
        const gradient = ctx.createLinearGradient(0, 0, 0, HEIGHT)
        gradient.addColorStop(0, "#1a1a1a")
        gradient.addColorStop(1, "#0a0a0a")
        ctx.fillStyle = gradient
        ctx.fillRect(0, 0, WIDTH, HEIGHT)
    }

    // Add a subtle gradient overlay at the bottom for text readability
    const textGradient = ctx.createLinearGradient(0, HEIGHT * 0.5, 0, HEIGHT)
    textGradient.addColorStop(0, "rgba(0, 0, 0, 0)")
    textGradient.addColorStop(0.5, "rgba(0, 0, 0, 0.3)")
    textGradient.addColorStop(1, "rgba(0, 0, 0, 0.7)")
    ctx.fillStyle = textGradient
    ctx.fillRect(0, 0, WIDTH, HEIGHT)

    // Text rendering setup
    const padding = 90
    const maxTextWidth = WIDTH - padding * 2
    let yPosition = HEIGHT - 330 // Start position from bottom

    // Product Title - Large and Bold
    ctx.font = "800 96px Inter, system-ui, -apple-system, sans-serif"
    ctx.fillStyle = "#FFFFFF"
    ctx.textAlign = "left"
    ctx.shadowColor = "rgba(0, 0, 0, 0.6)"
    ctx.shadowBlur = 12
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 3

    const titleLines = wrapText(ctx, productTitle, maxTextWidth)
    titleLines.forEach((line) => {
        ctx.fillText(line, padding, yPosition)
        yPosition += 110 // More line height for larger text
    })

    yPosition += 30 // Spacing after title

    // Product Description - Medium size
    if (productDescription) {
        ctx.font = "400 32px Inter, system-ui, -apple-system, sans-serif"
        ctx.fillStyle = "#E5E7EB"
        ctx.shadowBlur = 8
        ctx.shadowOffsetY = 2

        // Limit description to ~140 characters
        const shortDesc = productDescription.slice(0, 140) + (productDescription.length > 140 ? "..." : "")
        const descLines = wrapText(ctx, shortDesc, maxTextWidth)

        // Limit to 3 lines
        descLines.slice(0, 3).forEach((line) => {
            ctx.fillText(line, padding, yPosition)
            yPosition += 46
        })

        yPosition += 24 // Spacing after description
    }

    // Business Name - Smallest, elegant
    ctx.font = "italic 500 28px Inter, Georgia, serif"
    ctx.fillStyle = "#D1D5DB"
    ctx.shadowBlur = 5
    ctx.shadowOffsetY = 1
    ctx.fillText(businessName, padding, yPosition)

    // Reset shadow
    ctx.shadowColor = "transparent"
    ctx.shadowBlur = 0
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 0

    // Logo in bottom right corner
    if (logoUrl) {
        try {
            const logo = await loadImage(logoUrl)
            const logoSize = 120
            const logoX = WIDTH - 60 - logoSize
            const logoY = HEIGHT - 60 - logoSize

            // Draw logo
            ctx.drawImage(logo, logoX, logoY, logoSize, logoSize)
        } catch (err) {
            console.warn("Failed to load logo, using text fallback", err)

            // Fallback: simple text without background
            const badgeX = WIDTH - 60 - 200
            const badgeY = HEIGHT - 60 - 60
            ctx.font = "700 24px system-ui, -apple-system, sans-serif"
            ctx.fillStyle = "#FFFFFF"
            ctx.textAlign = "center"
            ctx.fillText("Ummah Square", badgeX + 100, badgeY + 38)
        }
    }

    // Convert canvas to blob
    return new Promise((resolve, reject) => {
        canvas.toBlob(
            (blob) => {
                if (blob) {
                    resolve(blob)
                } else {
                    reject(new Error("Failed to generate image blob"))
                }
            },
            "image/png",
            0.95
        )
    })
}
