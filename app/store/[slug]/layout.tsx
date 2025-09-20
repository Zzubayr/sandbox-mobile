import type React from "react"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import StoreLayout from "@/components/storefront/store-layout"

export default async function StoreLayoutWrapper({
  children,
  params,
}: {
  children: React.ReactNode
  params: { slug: string }
}) {
  const supabase = await createClient()

  // Get vendor by slug
  const { data: vendor, error } = await supabase
    .from("vendors")
    .select("*")
    .eq("store_slug", params.slug)
    .single()

  if (error || !vendor) {
    redirect("/")
  }

  return (
    <StoreLayout vendor={vendor}>
      {children}
    </StoreLayout>
  )
}
