"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useTheme } from "@/lib/theme-context"
import { Home, Package, ShoppingCart, Settings, BarChart3, HelpCircle, LogOut, Store, Sparkles, Clock, Image as ImageIcon, Boxes } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { authClient } from "@/lib/auth-client"
import { useRouter } from "next/navigation"
import logo from "@/public/logo.svg"
import Image from "next/image"

const sidebarItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: Home,
  },
  {
    title: "Products",
    href: "/dashboard/products",
    icon: Package,
  },
  {
    title: "Inventory",
    href: "/dashboard/inventory",
    icon: Boxes,
  },
  {
    title: "Requests",
    href: "/dashboard/requests",
    icon: ShoppingCart,
  },
  {
    title: "Analytics",
    href: "/dashboard/analytics",
    icon: BarChart3,
  },
  {
    title: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
  },
]

interface SidebarProps {
  className?: string
  storeName?: string
  isService?: boolean
}

export function Sidebar({ className, storeName, isService }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { colors } = useTheme()

  const handleLogout = async () => {
    try {
      await authClient.signOut({
        fetchOptions: {
          onSuccess: () => router.push('/auth/login'),
        },
      })
    } catch {
      router.push('/auth/login')
    }
  }

  const items = isService
    ? [
        { title: "Dashboard", href: "/dashboard", icon: Home },
        { title: "About & Contact", href: "/dashboard/about", icon: Store },
        { title: "Business Hours", href: "/dashboard/hours", icon: Clock },
        { title: "Services & Rates", href: "/dashboard/rates", icon: Sparkles },
        { title: "Gallery", href: "/dashboard/gallery", icon: ImageIcon },
        { title: "Settings", href: "/dashboard/settings", icon: Settings },
      ]
    : sidebarItems;

  return (
    <div className={cn("pb-12 w-64 bg-white border-r border-slate-200", className)}>
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 flex items-center justify-center rounded-md">
              <Image src={logo} className="" alt="logo"/>
            </div>
            <div>
              <h2 className="text-lg font-bold bg-gradient-to-r from-[#2B6DA9] to-[#20527F] bg-clip-text text-transparent">Ummah Square</h2>
              {storeName && <p className="text-sm text-slate-500">{storeName}</p>}
            </div>
          </div>
          <div className="space-y-1">
            {items.map((item) => {
              const dataAttr =
                item.title === "Dashboard" ? { "data-tour": "sidebar-dashboard" } :
                item.title === "Products" ? { "data-tour": "sidebar-products" } :
                item.title === "Inventory" ? { "data-tour": "sidebar-inventory" } :
                item.title === "Requests" ? { "data-tour": "sidebar-requests" } :
                item.title === "Analytics" ? { "data-tour": "sidebar-analytics" } :
                item.title === "Settings" ? { "data-tour": "sidebar-settings" } :
                item.title === "About & Contact" ? { "data-tour": "sidebar-about" } :
                item.title === "Business Hours" ? { "data-tour": "sidebar-hours" } :
                item.title === "Services & Rates" ? { "data-tour": "sidebar-rates" } :
                item.title === "Gallery" ? { "data-tour": "sidebar-gallery" } :
                {}
              return (
                <Button
                  key={item.href}
                  variant={pathname === item.href ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start h-12 transition-all min-h-[44px]",
                    pathname === item.href 
                      ? "bg-gradient-to-r from-[#EBF3FA] to-[#D6E7F5] text-[#2B6DA9] border border-[#93BAD9] shadow-sm" 
                      : "hover:bg-slate-50 text-slate-700"
                  )}
                  asChild
                >
                  <Link href={item.href} {...dataAttr}>
                    <item.icon className="mr-3 h-4 w-4" />
                    {item.title}
                  </Link>
                </Button>
              )
            })}
          </div>
        </div>
        <div className="px-3">
          <div className="space-y-1">
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => window.dispatchEvent(new Event('dashboard-tour:start'))}
            >
              <HelpCircle className="mr-2 h-4 w-4" />
              Help
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
