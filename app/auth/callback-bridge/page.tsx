"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function CallbackBridgePage() {
  const router = useRouter()

  useEffect(() => {
    let cancelled = false

    const handleCallback = async () => {
      try {
        await new Promise((resolve) => setTimeout(resolve, 500))
        if (cancelled) return

        if (window.history.length > 1) {
          window.history.back()
        } else {
          router.replace("/")
        }
      } catch (error) {
        console.error("Callback bridge error:", error)
        router.replace("/")
      }
    }

    void handleCallback()

    return () => {
      cancelled = true
    }
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center p-6 text-center">
      <div className="space-y-3">
        <p className="text-lg font-semibold text-slate-900">Completing sign in...</p>
        <p className="text-sm text-slate-600">You'll be redirected back to the app automatically.</p>
      </div>
    </div>
  )
}
