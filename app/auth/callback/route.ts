import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? "/dashboard"

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // Get the user after successful authentication
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        // Check if user is admin
        const { data: admin } = await supabase
          .from("admins")
          .select("id")
          .eq("user_id", user.id)
          .single()

        if (admin) {
          // Redirect admin to admin dashboard
          return NextResponse.redirect(`${origin}/admin`)
        } else {
          // Redirect regular user to dashboard
          return NextResponse.redirect(`${origin}/dashboard`)
        }
      }
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
