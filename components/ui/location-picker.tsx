"use client"

import { useEffect, useRef, useState } from "react"
import { Search, MapPin, Loader2 } from "lucide-react"
import { Button } from "./button"
type GeoPoint = { type: "Point"; coordinates: [number, number] }
type LocationValue = {
  location: GeoPoint
  address?: string
  placeId?: string
  components?: any
}

interface Props {
  value?: LocationValue
  onChange: (v: LocationValue) => void
  placeholder?: string
}

export default function LocationPicker({ value, onChange, placeholder = "Search for your business location..." }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [isOpen, setIsOpen] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const [geoError, setGeoError] = useState<string | null>(null)
  const [geolocating, setGeolocating] = useState(false)

  // Keep input in sync when external address changes (e.g., prefilled vendor)
  useEffect(() => {
    const external = value?.address ?? ""
    if (external !== searchQuery) setSearchQuery(external)
  }, [value?.address])

  useEffect(() => {
    // Only fetch and show suggestions when the input is focused
    if (!isFocused) {
      setSuggestions([])
      setIsOpen(false)
      return
    }
    const handler = setTimeout(async () => {
      const q = searchQuery.trim()
      const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN as string | undefined
      if (!q || !token) {
        setSuggestions([])
        setIsOpen(false)
        return
      }
      setLoading(true)
      try {
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json?autocomplete=true&limit=8&country=NG&access_token=${token}`
        const res = await fetch(url)
        const json = await res.json()
        const feats = Array.isArray(json.features) ? json.features : []
        setSuggestions(feats)
        setIsOpen(isFocused && feats.length > 0)
      } catch {
        setSuggestions([])
        setIsOpen(false)
      } finally {
        setLoading(false)
      }
    }, 300)
    return () => clearTimeout(handler)
  }, [searchQuery, isFocused])

  const selectSuggestion = (feature: any) => {
    const coords = feature?.center as [number, number] | undefined
    if (!coords) return

    onChange({
      location: { type: "Point", coordinates: coords },
      address: feature.place_name,
      placeId: feature.id,
      components: feature.context,
    })

    setSearchQuery(feature.place_name || "")
    setSuggestions([])
    setIsOpen(false)
  }

  const useMyLocation = () => {
    setGeoError(null)
    if (!navigator?.geolocation) {
      setGeoError("Geolocation is not supported by your browser.")
      return
    }
    setGeolocating(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lng = pos.coords.longitude
        const lat = pos.coords.latitude
        let address: string | undefined
        const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN as string | undefined
        if (token) {
          try {
            const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${token}`
            const res = await fetch(url)
            const json = await res.json()
            address = json?.features?.[0]?.place_name as string | undefined
          } catch {}
        }
        onChange({ location: { type: 'Point', coordinates: [lng, lat] }, address })
        setSearchQuery(address || "")
        setSuggestions([])
        setIsOpen(false)
        setGeolocating(false)
      },
      (err) => {
        setGeoError(err?.message || "Unable to fetch your location.")
        setGeolocating(false)
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }

  const handleInputFocus = () => {
    setIsFocused(true)
    // Opening is controlled by effect; it will open if there is a query and results
  }

  const handleInputBlur = () => {
    setIsFocused(false)
    setTimeout(() => setIsOpen(false), 150)
  }

  return (
    <div className="w-full">
      <div className="relative">
        <div className="relative">
          <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
            <Search className="h-4 w-4" />
          </div>
          <input
            ref={inputRef}
            placeholder={placeholder}
            value={searchQuery}
            className="w-full pl-12 pr-12 py-4 text-base bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 shadow-sm hover:shadow-md"
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
          />
          
          {loading && (
            <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2">
              <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
            </div>
          )}
        </div>
        <div className="mt-2 flex items-center gap-2">
            <Button
              type="button"
              onClick={useMyLocation}
              className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 bg-white text-slate-700 hover:text-blue-600 hover:border-blue-400"
            >
              {geolocating ? (
                <span className="inline-flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" /> Locating...
                </span>
              ) : (
                'Use my location'
              )}
            </Button>
            {searchQuery && (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => {
                  setSearchQuery("")
                  setSuggestions([])
                  onChange({ ...(value || { location: { type: 'Point', coordinates: [3.3792, 6.5244] } }), address: undefined, placeId: undefined, components: undefined })
                }}
                className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-slate-800"
              >
                Clear
              </button>
            )}
            {geoError && <div className="text-xs text-red-600">{geoError}</div>}
          </div>
        
        {isOpen && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden backdrop-blur-sm">
            <div className="max-h-64 overflow-y-auto">
              {suggestions.map((feature: any) => (
                <button
                  key={feature.id}
                  type="button"
                  className="w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors text-sm border-b border-slate-100 last:border-b-0"
                  onClick={() => selectSuggestion(feature)}
                >
                  <div className="flex items-start gap-3">
                    <MapPin className="h-4 w-4 text-slate-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-slate-900 truncate">{feature.place_name}</div>
                      {feature.context && (
                        <div className="text-xs text-slate-500 mt-1">
                          {feature.context.map((c: any) => c.text).join(', ')}
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {value?.location && (
        <div className="mt-3 p-4 bg-green-50 rounded-2xl border border-green-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
              <MapPin className="h-4 w-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              {value.address && (
                <div className="text-sm font-medium text-green-900 truncate">{value.address}</div>
              )}
              <div className="text-xs text-green-600 mt-1">Location selected</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
