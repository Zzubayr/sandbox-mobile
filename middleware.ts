import { updateSession } from "@/lib/supabase/middleware"
import type { NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    // Only run middleware where auth/session checks are actually needed.
    // This avoids running on public pages and dramatically reduces navigation latency.
    "/admin/:path*",
    "/dashboard/:path*",
    "/onboarding",
  ],
}
