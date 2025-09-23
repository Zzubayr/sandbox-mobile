"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Search } from "lucide-react"
import { useSpotlightSearch } from "@/hooks/use-spotlight-search"
import type { Vendor } from "@/lib/types"

interface MobileSearchProps {
  vendor: Vendor
}

export function MobileSearch({ vendor }: MobileSearchProps) {
  const { openSearch } = useSpotlightSearch()

  const handleSearchClick = () => {
    openSearch('storefront', vendor.store_slug)
  }

  return (
    <Button 
      variant="ghost" 
      size="icon" 
      className="md:hidden min-w-[44px] min-h-[44px]"
      onClick={handleSearchClick}
    >
      <Search className="h-5 w-5" />
    </Button>
  )
}
