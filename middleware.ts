import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Edge Config is optional. Only load if configured to avoid runtime errors.

export async function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const hostname = request.headers.get("host") || "";

  // Define base domain for production vs dev
  const isProduction = process.env.NODE_ENV === "production";
  const baseDomain = isProduction ? "ummahsquare.com.ng" : "localhost:3000";

  // Check if we are on a subdomain
  // logic: if hostname is NOT the baseDomain AND NOT "www." + baseDomain
  // We exclude specific subdomains if you have them (e.g. "admin", "dashboard" if they are separate apps)
  const isSubdomain =
    hostname !== baseDomain &&
    hostname !== `www.${baseDomain}` &&
    hostname.endsWith(baseDomain);

  if (isSubdomain) {
    // Extract subdomain
    const subdomain = hostname.replace(`.${baseDomain}`, "");

    // Reserved subdomains that should NOT be treated as store slugs
    const reservedSubdomains = ["www", "api", "admin", "dashboard", "assets", "sandbox"];

    if (reservedSubdomains.includes(subdomain)) {
      // Allow these to pass through normally
      // But we might want to ensure they don't get rewritten if they match a folder
      return NextResponse.next();
    }

    // Rewrite to store page: /store/[slug]/...
    // Keep the path and query (e.g. /product/123?foo=bar)
    // Destination: /store/[slug]/[...rest]

    url.pathname = `/store/${subdomain}${url.pathname}`;
    return NextResponse.rewrite(url);
  }

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
