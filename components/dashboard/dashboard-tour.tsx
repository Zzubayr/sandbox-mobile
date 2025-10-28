"use client"

import React, { useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react"

// Lightweight, dependency-free guided tour for the vendor dashboard.
// - Opens automatically on first visit (localStorage flag)
// - Can be relaunched by dispatching a window event: window.dispatchEvent(new Event('dashboard-tour:start'))
// - Uses [data-tour="..."] anchors to highlight UI areas

type Step = {
  id: string
  selector: string
  title: string
  content: string
}

const STEPS: Step[] = [
  {
    id: "sidebar-dashboard",
    selector: '[data-tour="sidebar-dashboard"]',
    title: "Overview",
    content: "This is your dashboard overview. Track status and quick metrics here.",
  },
  {
    id: "header-search",
    selector: '[data-tour="header-search"]',
    title: "Spotlight Search",
    content: "Quickly find products or requests using the dashboard search (or press Cmd/Ctrl+K).",
  },
  {
    id: "sidebar-products",
    selector: '[data-tour="sidebar-products"]',
    title: "Products",
    content: "Manage your products here. Add, edit pricing, update stock and images.",
  },
  {
    id: "sidebar-requests",
    selector: '[data-tour="sidebar-requests"]',
    title: "Requests",
    content: "Handle customer requests and orders. Review details and update statuses.",
  },
  {
    id: "sidebar-analytics",
    selector: '[data-tour="sidebar-analytics"]',
    title: "Analytics",
    content: "View performance insights to understand traffic, sales, and growth.",
  },
  {
    id: "sidebar-settings",
    selector: '[data-tour="sidebar-settings"]',
    title: "Settings",
    content: "Configure your store details, theme, and notifications.",
  },
]

function useElementRect(selector: string | null) {
  const [rect, setRect] = useState<DOMRect | null>(null)

  const update = useCallback(() => {
    if (!selector) return setRect(null)
    const el = document.querySelector(selector) as HTMLElement | null
    if (!el) return setRect(null)
    const r = el.getBoundingClientRect()
    setRect(r)
  }, [selector])

  useLayoutEffect(() => {
    update()
    const onResize = () => update()
    window.addEventListener("resize", onResize)
    window.addEventListener("scroll", onResize, { passive: true })
    const interval = window.setInterval(update, 200) // in case content shifts
    return () => {
      window.removeEventListener("resize", onResize)
      window.removeEventListener("scroll", onResize)
      window.clearInterval(interval)
    }
  }, [update])

  return rect
}

export default function DashboardTour() {
  const [open, setOpen] = useState(false)
  const [idx, setIdx] = useState(0)
  const [isMobile, setIsMobile] = useState(false)

  // Combine and order steps; on mobile group sidebar steps together
  const steps = useMemo<Step[]>(() => {
    const bannerEl = document.querySelector('[data-tour="approval-banner"]')
    const base = [...STEPS]
    const sidebar = base.filter(s => s.id.startsWith('sidebar-'))
    const nonSidebar = base.filter(s => !s.id.startsWith('sidebar-'))
    const headerSearch = nonSidebar.find(s => s.id === 'header-search')
    const others = nonSidebar.filter(s => s.id !== 'header-search')

    let ordered: Step[]
    if (isMobile) {
      // Start with header search, then sidebar group for continuous sidebar visibility
      ordered = [
        ...(headerSearch ? [headerSearch] : []),
        ...sidebar,
        ...others,
      ]
    } else {
      ordered = base
    }

    if (bannerEl) {
      // Put banner at the end to avoid interrupting sidebar flow on mobile
      ordered = [
        ...ordered,
        {
          id: "approval-banner",
          selector: '[data-tour="approval-banner"]',
          title: "Approval Status",
          content: "This banner shows your store's approval status and next actions.",
        },
      ]
    }
    return ordered
  }, [isMobile])

  const current = steps[idx]
  const rect = useElementRect(current ? current.selector : null)

  // Responsive: detect mobile viewport
  useEffect(() => {
    const update = () => setIsMobile(window.innerWidth < 640)
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  // Auto-run on first visit
  useEffect(() => {
    try {
      const seen = localStorage.getItem("dashboardTourDone")
      if (!seen) setOpen(true)
    } catch {}
  }, [])

  // Listener to relaunch
  useEffect(() => {
    const start = () => {
      setIdx(0)
      setOpen(true)
      // If first step is sidebar on mobile, open the drawer immediately
      try {
        const first = steps[0]
        if (isMobile && first?.id.startsWith('sidebar-')) {
          window.dispatchEvent(new Event('dashboard-tour:sidebar-open'))
        }
      } catch {}
    }
    window.addEventListener("dashboard-tour:start", start)
    return () => window.removeEventListener("dashboard-tour:start", start)
  }, [isMobile, steps])

  // Ensure target is visible when step changes
  useEffect(() => {
    if (!current?.selector) return
    const el = document.querySelector(current.selector) as HTMLElement | null
    if (!el) return
    // On mobile, ensure the mobile sidebar is open if step targets sidebar
    if (isMobile) {
      if (current.selector.includes('sidebar-')) {
        window.dispatchEvent(new Event('dashboard-tour:sidebar-open'))
      } else {
        window.dispatchEvent(new Event('dashboard-tour:sidebar-close'))
      }
    }
    const r = el.getBoundingClientRect()
    const inView = r.top >= 64 && r.bottom <= window.innerHeight - 64
    if (!inView) {
      try { el.scrollIntoView({ behavior: 'smooth', block: 'center' }) } catch {}
    }
  }, [idx, current?.selector])

  const closeTour = (markDone: boolean) => {
    if (markDone) {
      try { localStorage.setItem("dashboardTourDone", "1") } catch {}
    }
    try { window.dispatchEvent(new Event('dashboard-tour:sidebar-close')) } catch {}
    setOpen(false)
  }

  const next = () => setIdx((i) => Math.min(i + 1, steps.length - 1))
  const prev = () => setIdx((i) => Math.max(i - 1, 0))

  if (!open || !current) return null

  // Tooltip position
  const padding = 8
  const styleHighlight: React.CSSProperties = rect
    ? {
        position: "fixed",
        top: Math.max(rect.top - padding, 8),
        left: Math.max(rect.left - padding, 8),
        width: rect.width + padding * 2,
        height: rect.height + padding * 2,
        borderRadius: 12,
        boxShadow: "0 0 0 200vmax rgba(0,0,0,0.5)",
        zIndex: 1000,
        pointerEvents: "none",
        transition: "all 0.2s ease",
      }
    : { display: "none" }

  const tooltipTop = rect ? Math.min(rect.bottom + 12, window.innerHeight - 220) : 100
  const tooltipLeft = rect ? Math.min(Math.max(rect.left, 12), window.innerWidth - 360) : 12

  return (
    <>
      {/* Dimmer + Highlight */}
      <div style={styleHighlight} />
      {/* Tooltip */}
      {isMobile ? (
        <div
          style={{ position: "fixed", left: 12, right: 12, bottom: 16, zIndex: 1001 }}
          className="rounded-xl border border-slate-200 bg-white shadow-xl"
        >
          <div className="p-4">
            <div className="text-xs text-slate-500 mb-1">Step {idx + 1} of {steps.length}</div>
            <h3 className="text-base font-semibold text-slate-900 mb-1">{current.title}</h3>
            <p className="text-sm text-slate-600">{current.content}</p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                className="px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                onClick={() => closeTour(true)}
              >
                Skip
              </button>
              {idx < steps.length - 1 ? (
                <button
                  className="px-3 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                  onClick={next}
                >
                  Next
                </button>
              ) : (
                <button
                  className="px-3 py-2 text-sm rounded-lg bg-green-600 text-white hover:bg-green-700"
                  onClick={() => closeTour(true)}
                >
                  Done
                </button>
              )}
              <button
                className="px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 col-span-2 disabled:opacity-50"
                onClick={prev}
                disabled={idx === 0}
              >
                Back
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div
          style={{ position: "fixed", top: tooltipTop, left: tooltipLeft, zIndex: 1001, maxWidth: 340 }}
          className="rounded-xl border border-slate-200 bg-white shadow-xl"
        >
          <div className="p-4">
            <div className="text-xs text-slate-500 mb-1">Step {idx + 1} of {steps.length}</div>
            <h3 className="text-base font-semibold text-slate-900 mb-1">{current.title}</h3>
            <p className="text-sm text-slate-600">{current.content}</p>
            <div className="mt-4 flex items-center gap-2">
              <button
                className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                onClick={() => closeTour(true)}
              >
                Skip
              </button>
              <div className="flex-1" />
              <button
                className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 bg-white text-slate-700 disabled:opacity-50"
                onClick={prev}
                disabled={idx === 0}
              >
                Back
              </button>
              {idx < steps.length - 1 ? (
                <button
                  className="px-3 py-1.5 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                  onClick={next}
                >
                  Next
                </button>
              ) : (
                <button
                  className="px-3 py-1.5 text-sm rounded-lg bg-green-600 text-white hover:bg-green-700"
                  onClick={() => closeTour(true)}
                >
                  Done
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
