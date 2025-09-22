"use client"

import { useEffect, useState } from "react"

interface PerformanceMetrics {
  lcp: number | null
  fid: number | null
  cls: number | null
  fcp: number | null
  ttfb: number | null
}

export function PerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    lcp: null,
    fid: null,
    cls: null,
    fcp: null,
    ttfb: null,
  })

  useEffect(() => {
    if (typeof window === 'undefined') return

    // Only run in development
    if (process.env.NODE_ENV !== 'development') return

    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'largest-contentful-paint') {
          setMetrics(prev => ({ ...prev, lcp: entry.startTime }))
        }
        if (entry.entryType === 'first-input') {
          setMetrics(prev => ({ ...prev, fid: (entry as any).processingStart - entry.startTime }))
        }
        if (entry.entryType === 'layout-shift') {
          if (!(entry as any).hadRecentInput) {
            setMetrics(prev => ({ ...prev, cls: (prev.cls || 0) + (entry as any).value }))
          }
        }
        if (entry.entryType === 'paint') {
          if (entry.name === 'first-contentful-paint') {
            setMetrics(prev => ({ ...prev, fcp: entry.startTime }))
          }
        }
        if (entry.entryType === 'navigation') {
          setMetrics(prev => ({ ...prev, ttfb: (entry as any).responseStart - (entry as any).requestStart }))
        }
      }
    })

    try {
      observer.observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift', 'paint', 'navigation'] })
    } catch (e) {
      // Some browsers don't support all entry types
    }

    return () => observer.disconnect()
  }, [])

  // Only show in development
  if (process.env.NODE_ENV !== 'development') return null

  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white p-3 rounded-lg text-xs font-mono z-50">
      <div className="font-bold mb-2">Performance Metrics</div>
      <div>LCP: {metrics.lcp ? `${metrics.lcp.toFixed(0)}ms` : 'Loading...'}</div>
      <div>FID: {metrics.fid ? `${metrics.fid.toFixed(0)}ms` : 'Loading...'}</div>
      <div>CLS: {metrics.cls ? metrics.cls.toFixed(3) : 'Loading...'}</div>
      <div>FCP: {metrics.fcp ? `${metrics.fcp.toFixed(0)}ms` : 'Loading...'}</div>
      <div>TTFB: {metrics.ttfb ? `${metrics.ttfb.toFixed(0)}ms` : 'Loading...'}</div>
    </div>
  )
}
