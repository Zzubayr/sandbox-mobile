"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Search } from "lucide-react"

export function MobileSearch() {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      // Navigate to search page with query
      window.location.href = `/store/${window.location.pathname.split('/')[2]}/search?q=${encodeURIComponent(searchQuery)}`
    }
    setIsOpen(false)
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden min-w-[44px] min-h-[44px]">
          <Search className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="top" className="h-auto">
        <SheetHeader>
          <SheetTitle>Search Products</SheetTitle>
        </SheetHeader>
        <form onSubmit={handleSearch} className="mt-4">
          <div className="flex gap-2">
            <Input
              type="search"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 h-11"
              autoFocus
            />
            <Button type="submit" className="h-11 min-w-[44px]">Search</Button>
          </div>
        </form>
        <div className="mt-4">
          <Button 
            variant="outline" 
            className="w-full h-11"
            onClick={() => {
              window.location.href = `/store/${window.location.pathname.split('/')[2]}/search`
              setIsOpen(false)
            }}
          >
            Browse All Products
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
