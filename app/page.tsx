import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CloudinaryImage } from "@/components/ui/cloudinary-image"
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
      <section className="relative py-24 bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-20"></div>
        
        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="max-w-4xl mx-auto">
            <Badge className="mb-6 bg-blue-500/20 text-blue-300 border-blue-400/30 hover:bg-blue-500/30">
              Launch Your Online Store in Minutes
            </Badge>
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-8 leading-tight">
              Your Store, <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-pulse">Online</span>
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 mb-12 max-w-3xl mx-auto leading-relaxed">
              Create stunning online catalogs that convert. Let customers browse and order through WhatsApp with our 
              <span className="text-yellow-300 font-semibold"> AI-powered</span> multi-vendor platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Button size="lg" asChild className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-4 text-lg font-semibold shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 transform hover:scale-105">
                <Link href="/auth/signup">
                  <Store className="mr-2 h-5 w-5" />
                  Start Your Store Free
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 px-8 py-4 text-lg font-semibold backdrop-blur-sm">
                <Package className="mr-2 h-5 w-5" />
                View Demo
              </Button>
            </div>
            
            {/* Trust Indicators */}
            <div className="mt-16 flex flex-col sm:flex-row items-center justify-center gap-8 text-blue-200">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm">No Setup Fees</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm">WhatsApp Integration</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm">Mobile Optimized</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 bg-gradient-to-b from-white to-slate-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-20">
            <Badge className="mb-4 bg-blue-100 text-blue-700 border-blue-200">
              Features
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
              Everything You Need to Sell Online
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Powerful tools designed for modern retailers who want to grow their business online
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="group hover:shadow-2xl transition-all duration-300 border-0 shadow-lg hover:scale-105 bg-gradient-to-br from-blue-50 to-blue-100">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 p-4 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg group-hover:shadow-blue-500/25 transition-all duration-300">
                  <Store className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-xl">Beautiful Storefronts</CardTitle>
                <CardDescription className="text-slate-600">
                  Create stunning online catalogs with customizable themes and professional branding
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="group hover:shadow-2xl transition-all duration-300 border-0 shadow-lg hover:scale-105 bg-gradient-to-br from-green-50 to-green-100">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 p-4 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 shadow-lg group-hover:shadow-green-500/25 transition-all duration-300">
                  <Package className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-xl">Smart Inventory</CardTitle>
                <CardDescription className="text-slate-600">
                  AI-powered product management with automatic categorization and smart pricing
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="group hover:shadow-2xl transition-all duration-300 border-0 shadow-lg hover:scale-105 bg-gradient-to-br from-purple-50 to-purple-100">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 p-4 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg group-hover:shadow-purple-500/25 transition-all duration-300">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-xl">WhatsApp Commerce</CardTitle>
                <CardDescription className="text-slate-600">
                  Seamless order management through WhatsApp with automated customer support
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="group hover:shadow-2xl transition-all duration-300 border-0 shadow-lg hover:scale-105 bg-gradient-to-br from-orange-50 to-orange-100">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 p-4 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 shadow-lg group-hover:shadow-orange-500/25 transition-all duration-300">
                  <TrendingUp className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-xl">Growth Analytics</CardTitle>
                <CardDescription className="text-slate-600">
                  Advanced insights and performance tracking to optimize your sales strategy
                </CardDescription>
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
                        <CloudinaryImage
                          src={vendor.logo_url}
                          alt={vendor.store_name}
                          width={48}
                          height={48}
                          className="h-12 w-12 rounded-full object-cover"
                          quality="auto"
                          crop="fill"
                          priority={false}
                          placeholder="blur"
                          sizes="48px"
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