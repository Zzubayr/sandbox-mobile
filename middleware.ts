import { updateSession } from "@/lib/supabase/middleware"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { get } from "@vercel/edge-config"

export async function middleware(request: NextRequest) {
  // Skip maintenance check for the maintenance page itself and static assets
  if (
    request.nextUrl.pathname.startsWith("/maintenance") ||
    request.nextUrl.pathname.startsWith("/_next") ||
    request.nextUrl.pathname.startsWith("/api") ||
    request.nextUrl.pathname.includes(".")
  ) {
    // For auth-protected routes, still run auth middleware even during maintenance
    if (request.nextUrl.pathname.match(/^\/(admin|dashboard|onboarding|auth)/)) {
      return await updateSession(request)
    }
    return NextResponse.next()
  }

  try {
    // Check if maintenance mode is enabled
    const isMaintenanceMode = await get("isMaintenanceMode")

    if (isMaintenanceMode) {
      // Rewrite to maintenance page
      return NextResponse.rewrite(new URL("/maintenance", request.url))
    }
  } catch (error) {
    // If Edge Config fails, continue normally
    console.error("Edge Config error:", error)
  }

  if (request.nextUrl.pathname.match(/^\/(admin|dashboard|onboarding|auth)/)) {
    return await updateSession(request)
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
