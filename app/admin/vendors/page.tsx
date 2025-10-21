import { redirect } from "next/navigation"
import { headers } from "next/headers"
import { VendorManagement } from "@/components/admin/vendor-management"
import { requireAdmin } from "@/lib/auth/session"

export default async function AdminVendorsPage() {
  try {
    await requireAdmin()
  } catch {
    redirect('/auth/login?next=/admin/vendors')
  }

  const baseURL = process.env.NEXT_PUBLIC_SITE_URL || process.env.BETTER_AUTH_URL || 'http://localhost:3000'
  const cookie = (await headers()).get('cookie') || ''
  const res = await fetch(new URL('/api/admin/vendors', baseURL).toString(), { cache: 'no-store', headers: { cookie } })
  const data = res.ok ? await res.json() : { vendors: [] }
  return <VendorManagement initialVendors={data.vendors || []} />
}
