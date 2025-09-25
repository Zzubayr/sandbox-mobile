import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  // With Fluid compute, don't put this client in a global environment
  // variable. Always create a new one on each request.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
        },
      },
    },
  )

  // Do not run code between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // IMPORTANT: If you remove getUser() and you use server-side rendering
  // with the Supabase client, your users may be randomly logged out.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // If user is already authenticated and trying to access auth pages,
  // redirect them to their appropriate dashboard.
  if (request.nextUrl.pathname.startsWith("/auth")) {
    if (user) {
      // Check if user is admin
      const { data: admin } = await supabase
        .from("admins")
        .select("id")
        .eq("user_id", user.id)
        .single()

      const url = request.nextUrl.clone()
      url.pathname = admin ? "/admin" : "/dashboard"
      return NextResponse.redirect(url)
    }
  }

  // Protect admin routes
  if (request.nextUrl.pathname.startsWith("/admin")) {
    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = "/auth/login"
      return NextResponse.redirect(url)
    }

    // Check if user is admin
    const { data: admin } = await supabase
      .from("admins")
      .select("id")
      .eq("user_id", user.id)
      .single()

    if (!admin) {
      // Redirect to regular dashboard if not admin
      const url = request.nextUrl.clone()
      url.pathname = "/dashboard"
      return NextResponse.redirect(url)
    }
  }

  // Protect vendor dashboard routes
  if (request.nextUrl.pathname.startsWith("/dashboard") && !user) {
    const url = request.nextUrl.clone()
    url.pathname = "/auth/login"
    return NextResponse.redirect(url)
  }

  if (user && request.nextUrl.pathname.startsWith("/dashboard")) {
    // Check if user is admin first
    const { data: admin } = await supabase
      .from("admins")
      .select("id")
      .eq("user_id", user.id)
      .single()

    if (admin) {
      // Redirect admin to admin dashboard
      const url = request.nextUrl.clone()
      url.pathname = "/admin"
      return NextResponse.redirect(url)
    }

    // Check if user needs onboarding
    const { data: vendor } = await supabase
      .from("vendors")
      .select("whatsapp_number, store_name")
      .eq("user_id", user.id)
      .single()

    if (!vendor || !vendor.whatsapp_number || !vendor.store_name) {
      const url = request.nextUrl.clone()
      url.pathname = "/onboarding"
      return NextResponse.redirect(url)
    }
  }

  if (request.nextUrl.pathname.startsWith("/onboarding") && !user) {
    const url = request.nextUrl.clone()
    url.pathname = "/auth/login"
    return NextResponse.redirect(url)
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is.
  return supabaseResponse
}
