"use client"

import { SpotlightSearch } from "@/components/ui/spotlight-search"
import { useSpotlightSearch } from "@/hooks/use-spotlight-search"

export function SpotlightSearchProvider() {
  const { isOpen, context, vendorSlug, closeSearch } = useSpotlightSearch()

  return (
    <SpotlightSearch
      isOpen={isOpen}
      onClose={closeSearch}
      context={context}
      vendorSlug={vendorSlug}
    />
  )
}