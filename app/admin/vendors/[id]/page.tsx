import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { isAdmin } from "@/lib/admin-utils"
import { VendorDetailPage } from "@/components/admin/vendor-detail-page"

export default async function AdminVendorDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  
  if (error || !user) {
    redirect("/auth/login")
  }

  // Check if user is admin
  const userIsAdmin = await isAdmin(user.id)
  if (!userIsAdmin) {
    redirect("/dashboard")
  }

  // Get vendor details
  const { data: vendor, error: vendorError } = await supabase
    .from('vendors')
    .select('*')
    .eq('id', params.id)
    .single()

  if (vendorError || !vendor) {
    redirect("/admin/vendors")
  }

  // Get vendor's products
  const { data: products } = await supabase
    .from('products')
    .select('*')
    .eq('vendor_id', params.id)
    .order('created_at', { ascending: false })

  // Get vendor's requests
  const { data: requests } = await supabase
    .from('requests')
    .select('*')
    .eq('vendor_id', params.id)
    .order('created_at', { ascending: false })

  return (
    <VendorDetailPage 
      vendor={vendor} 
      products={products || []} 
      requests={requests || []} 
    />
  )
}
