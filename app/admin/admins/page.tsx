import { redirect } from "next/navigation"
import { headers } from "next/headers"
import { AdminManagement } from "@/components/admin/admin-management"
import { requireAdmin } from "@/lib/auth/session"

export default async function AdminAdminsPage() {
  try {
    const { session } = await requireAdmin()
    // Only allow super_admins
    const baseURL = process.env.NEXT_PUBLIC_SITE_URL || process.env.BETTER_AUTH_URL || 'http://localhost:3000'
    const cookie = (await headers()).get('cookie') || ''
    const res = await fetch(new URL('/api/admin/admins', baseURL).toString(), { cache: 'no-store', headers: { cookie } })
    if (res.status === 403) redirect('/admin')
    const data = res.ok ? await res.json() : { admins: [] }
    return <AdminManagement initialAdmins={data.admins || []} />
  } catch {
    redirect('/auth/login?next=/admin/admins')
  }
}
