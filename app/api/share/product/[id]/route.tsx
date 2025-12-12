import { ImageResponse } from "next/og"
import { connectToDatabase } from "@/lib/db/connection"
import Product from "@/lib/db/models/product"
import Vendor from "@/lib/db/models/vendor"

export const runtime = "nodejs"

function getBaseUrl(req: Request) {
  try {
    return new URL(req.url).origin
  } catch {
    return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
  }
}

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    await connectToDatabase()
    const product = await Product.findById(params.id).lean()
    if (!product) return new Response("Not found", { status: 404 })
    const vendor = await Vendor.findById((product as any).vendor_id).lean()
    if (!vendor) return new Response("Not found", { status: 404 })

    const origin = getBaseUrl(req)
    let bgUrl =
      Array.isArray((product as any).images) && (product as any).images.length > 0
        ? (typeof (product as any).images[0] === "string"
            ? (product as any).images[0]
            : (product as any).images[0]?.url) || ""
        : ""
    
    // Normalize relative URLs
    if (bgUrl && bgUrl.startsWith("/")) {
      bgUrl = `${origin}${bgUrl}`
    }

    // Validate the image URL - must be a full URL for ImageResponse
    const isValidUrl = bgUrl && (bgUrl.startsWith('http://') || bgUrl.startsWith('https://'))
    if (!isValidUrl) {
      bgUrl = "" // Clear invalid URLs to avoid fetch errors
    }

    const safeDesc = (product as any).description
      ? String((product as any).description).slice(0, 140)
      : ""

    return new ImageResponse(
      (
        <div
          style={{
            width: "1080px",
            height: "1920px",
            display: "flex",
            position: "relative",
            color: "#FFFFFF",
            background: "#1a1a1a",
            fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          }}
        >
          {/* Background Image */}
          {bgUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={bgUrl}
              alt="background"
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                filter: "brightness(0.5)",
              }}
            />
          ) : null}

          {/* Gradient Overlay */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(180deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.7) 100%)",
            }}
          />

          {/* Content Container */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-end",
              padding: "80px 100px 100px 100px",
              height: "100%",
              width: "100%",
              position: "relative",
            }}
          >
            {/* Product Title */}
            <div 
              style={{ 
                fontSize: "72px", 
                fontWeight: 700, 
                lineHeight: 1.1,
                marginBottom: "24px",
                color: "#FFFFFF",
                textShadow: "0 2px 8px rgba(0,0,0,0.3)",
              }}
            >
              {String((product as any).title || "Product")}
            </div>
            
            {/* Product Description */}
            {safeDesc ? (
              <div 
                style={{ 
                  fontSize: "36px", 
                  lineHeight: 1.3, 
                  color: "#E5E7EB",
                  marginBottom: "32px",
                  textShadow: "0 1px 4px rgba(0,0,0,0.3)",
                }}
              >
                {safeDesc}
              </div>
            ) : null}
            
            {/* Vendor/Store Name */}
            <div 
              style={{ 
                fontSize: "32px", 
                fontWeight: 600, 
                color: "#D1D5DB",
                fontStyle: "italic",
                textShadow: "0 1px 4px rgba(0,0,0,0.3)",
              }}
            >
              {String((vendor as any).store_name || "Ummah Square")}
            </div>
          </div>

          {/* Logo/Branding in Bottom Right Corner */}
          <div
            style={{
              position: "absolute",
              right: "60px",
              bottom: "60px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(255,255,255,0.15)",
              borderRadius: "12px",
              padding: "16px 24px",
              backdropFilter: "blur(8px)",
            }}
          >
            <div style={{ 
              fontSize: "28px", 
              fontWeight: 700,
              color: "#FFFFFF",
              textShadow: "0 2px 4px rgba(0,0,0,0.3)",
            }}>
              {String((vendor as any).store_name || "Ummah Square")}
            </div>
          </div>
        </div>
      ),
      {
        width: 1080,
        height: 1920,
      }
    )
  } catch (err) {
    console.error("Share image error:", err)
    return new Response("Error", { status: 500 })
  }
}
