import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
// Edge Config is optional. Only load if configured to avoid runtime errors.

export async function middleware(request: NextRequest) {
  // Skip maintenance check for the maintenance page itself and static assets
  if (
    request.nextUrl.pathname.startsWith("/maintenance") ||
    request.nextUrl.pathname.startsWith("/_next") ||
    request.nextUrl.pathname.startsWith("/api") ||
    request.nextUrl.pathname.includes(".")
  ) {
    return NextResponse.next()
  }

  try {
    // Only attempt Edge Config if a connection string is provided at build time
    if (process.env.EDGE_CONFIG) {
      const { get } = await import("@vercel/edge-config")
      const isMaintenanceMode = await get("isMaintenanceMode")
      if (isMaintenanceMode) {
        // Rewrite to maintenance page
        return NextResponse.rewrite(new URL("/maintenance", request.url))
      }
    }
  } catch (error) {
    // If Edge Config fails, continue normally
    console.error("Edge Config error:", error)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
}
