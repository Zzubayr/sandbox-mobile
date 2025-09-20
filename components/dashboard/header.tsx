"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Bell, Search, User, Store, LogOut, Settings, Package, ShoppingCart } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

interface HeaderProps {
  title: string
  userEmail?: string
  mobileSidebar?: React.ReactNode
}

export function Header({ title, userEmail, mobileSidebar }: HeaderProps) {
  const router = useRouter()
  const supabase = createClient()
  const [searchTerm, setSearchTerm] = useState("")

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchTerm.trim()) return

    // Navigate to search page with query
    router.push(`/dashboard/search?q=${encodeURIComponent(searchTerm)}`)
  }

  const handleSearchClick = () => {
    // Navigate to search page when search input is clicked
    router.push('/dashboard/search')
  }

  return (
    <header className="border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 shadow-sm">
      <div className="flex h-16 items-center gap-4 px-4 md:px-6">
        {mobileSidebar && <div className="md:hidden">{mobileSidebar}</div>}

        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg">
            <Store className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg md:text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Sandbox
            </h1>
            <p className="text-xs text-slate-500 hidden sm:block">Dashboard</p>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
            <form onSubmit={handleSearch} className="relative hidden sm:block">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                type="search" 
                placeholder="Search products or request ID..." 
                className="w-[150px] pl-8 md:w-[200px] lg:w-[300px] cursor-pointer"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onClick={handleSearchClick}
                readOnly
              />
            </form>

          <Button 
            variant="ghost" 
            size="icon" 
            className="sm:hidden min-w-[44px] min-h-[44px]"
            onClick={handleSearchClick}
          >
            <Search className="h-4 w-4" />
          </Button>

          <Button variant="ghost" size="icon">
            <Bell className="h-4 w-4" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">Account</p>
                      <p className="text-xs leading-none text-muted-foreground truncate">{userEmail}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push('/dashboard')}>
                    <Store className="mr-2 h-4 w-4" />
                    Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/dashboard/products')}>
                    <Package className="mr-2 h-4 w-4" />
                    Products
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/dashboard/requests')}>
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Requests
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push('/dashboard/settings')}>
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
