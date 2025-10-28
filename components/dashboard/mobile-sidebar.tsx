"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu } from "lucide-react"
import { Sidebar } from "./sidebar"

interface MobileSidebarProps {
  storeName?: string
}

export function MobileSidebar({ storeName }: MobileSidebarProps) {
  const [isOpen, setIsOpen] = useState(false)

  // Allow tour to control the mobile drawer visibility
  useEffect(() => {
    const open = () => setIsOpen(true)
    const close = () => setIsOpen(false)
    window.addEventListener('dashboard-tour:sidebar-open', open)
    window.addEventListener('dashboard-tour:sidebar-close', close)
    return () => {
      window.removeEventListener('dashboard-tour:sidebar-open', open)
      window.removeEventListener('dashboard-tour:sidebar-close', close)
    }
  }, [])

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden min-w-[44px] min-h-[44px]">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="p-0 w-72 sm:w-80">
        <Sidebar storeName={storeName} className="border-0" />
      </SheetContent>
    </Sheet>
  )
}
