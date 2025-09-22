// Simple in-memory cache for Supabase queries
// This helps reduce API calls and improve performance

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number // Time to live in milliseconds
}

class SupabaseCache {
  private cache = new Map<string, CacheEntry<any>>()
  private defaultTTL = 5 * 60 * 1000 // 5 minutes

  set<T>(key: string, data: T, ttl: number = this.defaultTTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    })
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return null
    }

    return entry.data
  }

  delete(key: string): void {
    this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }

  // Generate cache key from query parameters
  generateKey(table: string, filters: Record<string, any> = {}): string {
    const sortedFilters = Object.keys(filters)
      .sort()
      .map(key => `${key}:${filters[key]}`)
      .join('|')
    
    return `${table}:${sortedFilters}`
  }

  // Cache vendor data (longer TTL since it doesn't change often)
  setVendor(userId: string, vendor: any): void {
    this.set(`vendor:${userId}`, vendor, 15 * 60 * 1000) // 15 minutes
  }

  getVendor(userId: string): any | null {
    return this.get(`vendor:${userId}`)
  }

  // Cache products (shorter TTL since they can change)
  setProducts(vendorId: string, products: any[]): void {
    this.set(`products:${vendorId}`, products, 2 * 60 * 1000) // 2 minutes
  }

  getProducts(vendorId: string): any[] | null {
    return this.get(`products:${vendorId}`)
  }

  // Cache categories (medium TTL)
  setCategories(vendorId: string, categories: any[]): void {
    this.set(`categories:${vendorId}`, categories, 10 * 60 * 1000) // 10 minutes
  }

  getCategories(vendorId: string): any[] | null {
    return this.get(`categories:${vendorId}`)
  }

  // Cache requests (short TTL since they change frequently)
  setRequests(vendorId: string, requests: any[]): void {
    this.set(`requests:${vendorId}`, requests, 1 * 60 * 1000) // 1 minute
  }

  getRequests(vendorId: string): any[] | null {
    return this.get(`requests:${vendorId}`)
  }

  // Invalidate cache when data changes
  invalidateVendor(userId: string): void {
    this.delete(`vendor:${userId}`)
  }

  invalidateProducts(vendorId: string): void {
    this.delete(`products:${vendorId}`)
  }

  invalidateCategories(vendorId: string): void {
    this.delete(`categories:${vendorId}`)
  }

  invalidateRequests(vendorId: string): void {
    this.delete(`requests:${vendorId}`)
  }
}

// Export singleton instance
export const supabaseCache = new SupabaseCache()

// Helper function to get cached data or fetch from Supabase
export async function getCachedData<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttl?: number
): Promise<T> {
  // Try to get from cache first
  const cached = supabaseCache.get<T>(key)
  if (cached) {
    console.log(`Cache hit for key: ${key}`)
    return cached
  }

  // Fetch from Supabase
  console.log(`Cache miss for key: ${key}, fetching from Supabase`)
  const data = await fetchFn()
  
  // Cache the result
  supabaseCache.set(key, data, ttl)
  
  return data
}
