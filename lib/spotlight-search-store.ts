import { create } from 'zustand'

interface SpotlightSearchState {
  isOpen: boolean
  context: "dashboard" | "storefront"
  vendorSlug?: string
}

interface SpotlightSearchActions {
  openSearch: (context: "dashboard" | "storefront", vendorSlug?: string) => void
  closeSearch: () => void
}

export const useSpotlightSearchStore = create<SpotlightSearchState & SpotlightSearchActions>((set) => ({
  isOpen: false,
  context: "dashboard",
  vendorSlug: undefined,

  openSearch: (context, vendorSlug) => set({ isOpen: true, context, vendorSlug }),
  closeSearch: () => set({ isOpen: false, context: "dashboard", vendorSlug: undefined }),
}))
