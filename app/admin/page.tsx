import { redirect } from "next/navigation"
import { headers } from "next/headers"
import { AdminDashboard } from "@/components/admin/admin-dashboard"
import { requireAdmin } from "@/lib/auth/session"

export default async function AdminPage() {
  try {
    await requireAdmin()
  } catch {
    redirect('/auth/login?next=/admin')
  }

  const baseURL = process.env.NEXT_PUBLIC_SITE_URL || process.env.BETTER_AUTH_URL || 'http://localhost:3000'
  const cookie = (await headers()).get('cookie') || ''
  const res = await fetch(new URL('/api/admin/stats', baseURL).toString(), { cache: 'no-store', headers: { cookie } })
  const data = res.ok ? await res.json() : null
  const stats = data?.stats || null

  return <AdminDashboard initialStats={stats || undefined} />
}
