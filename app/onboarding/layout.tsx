import Script from 'next/script'
import { redirect } from 'next/navigation'
import { requireUser } from '@/lib/auth/session'
import { connectToDatabase } from '@/lib/db/connection'
import Vendor from '@/lib/db/models/vendor'

export default async function OnboardingLayout({ children }: { children: React.ReactNode }) {
  // Server-side guard: must be logged in, and skip if already complete
  try {
    const { user } = await requireUser()
    await connectToDatabase()
    const vendor = await Vendor.findOne({ user_id: user.id }).lean()
    if (vendor && vendor.store_name && vendor.whatsapp_number) {
      redirect('/dashboard')
    }
  } catch {
    redirect('/auth/login?next=/onboarding')
  }

  // Mapbox GL JS is loaded from CDN and CSS is linked here.
  const hasToken = !!process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
  return (
    <>
      <link
        rel="stylesheet"
        href="https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css"
      />
      {hasToken ? (
        <Script
          src="https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.js"
          strategy="afterInteractive"
        />
      ) : null}
      {children}
    </>
  )
}
