import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Store, Users, Package, TrendingUp } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export default async function HomePage() {
  const supabase = await createClient()

  // Get featured vendors
  const { data: vendors } = await supabase
    .from("vendors")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(6)

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg">
                <Store className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Sandbox</h1>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="ghost" asChild>
                <Link href="/auth/login">Vendor Login</Link>
              </Button>
              <Button asChild className="bg-blue-600 hover:bg-blue-700">
                <Link href="/auth/signup">Start Selling</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Your Store, <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Online</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Create beautiful online catalogs for your business. Let customers browse and request products through
            WhatsApp with our sleek multi-vendor platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild className="bg-blue-600 hover:bg-blue-700">
              <Link href="/auth/signup">Start Your Store</Link>
            </Button>
            <Button size="lg" variant="outline">
              View Demo Stores
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Everything You Need to Sell Online</h2>
            <p className="text-xl text-muted-foreground">Simple, powerful tools for modern retailers</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card>
              <CardHeader>
                <Store className="h-12 w-12 text-blue-600 mb-4" />
                <CardTitle>Beautiful Storefronts</CardTitle>
                <CardDescription>Create stunning online catalogs with customizable themes and branding</CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Package className="h-12 w-12 text-green-600 mb-4" />
                <CardTitle>Product Management</CardTitle>
                <CardDescription>Easily manage your inventory, prices, and product information</CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Users className="h-12 w-12 text-purple-600 mb-4" />
                <CardTitle>WhatsApp Integration</CardTitle>
                <CardDescription>Customers can place orders directly through WhatsApp messaging</CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <TrendingUp className="h-12 w-12 text-orange-600 mb-4" />
                <CardTitle>Analytics & Insights</CardTitle>
                <CardDescription>Track your store performance and customer engagement</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Featured Stores */}
      {vendors && vendors.length > 0 && (
        <section className="py-20 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">Featured Stores</h2>
              <p className="text-xl text-muted-foreground">Discover amazing retailers on Sandbox</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {vendors.map((vendor) => (
                <Card key={vendor.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="h-32 bg-gradient-to-r from-blue-500 to-purple-600 relative">
                    {vendor.banner_url && (
                      <Image
                        src={vendor.banner_url || "/placeholder.svg"}
                        alt={vendor.store_name}
                        fill
                        className="object-cover"
                      />
                    )}
                  </div>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      {vendor.logo_url ? (
                        <img
                          src={vendor.logo_url || "/placeholder.svg"}
                          alt={vendor.store_name}
                          className="h-12 w-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
                          {vendor.store_name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <CardTitle>{vendor.store_name}</CardTitle>
                        <Badge variant="outline" className="mt-1">
                          {vendor.theme_color}
                        </Badge>
                      </div>
                    </div>
                    {vendor.description && <CardDescription>{vendor.description}</CardDescription>}
                  </CardHeader>
                  <CardContent>
                    <Button asChild className="w-full">
                      <Link href={`/store/${vendor.store_slug}`}>Visit Store</Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-20 bg-blue-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Start Selling?</h2>
          <p className="text-xl mb-8 opacity-90">Join thousands of retailers already using Sandbox</p>
          <Button size="lg" variant="secondary" asChild>
            <Link href="/auth/signup">Create Your Store Now</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <div className="p-1 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600">
                <Store className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Sandbox</span>
            </div>
            <p className="text-muted-foreground text-center">© 2024 Sandbox. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
