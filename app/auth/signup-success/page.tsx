"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { authClient } from "@/lib/auth-client"
import { Loader2, ArrowRight } from "lucide-react"

export default function SignupSuccessPage() {
  const router = useRouter()
  const [showManualButton, setShowManualButton] = useState(false)

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await authClient.getSession()
      if (data?.user) {
        router.push('/onboarding')
        return
      }
    }

    checkSession()
    // Show manual button after 3 seconds if no redirect happened
    const timer = setTimeout(() => setShowManualButton(true), 3000)
    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Sandbox</h1>
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                Setting up your account...
              </CardTitle>
              <CardDescription>Please wait while we prepare your store</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                You've successfully signed up. We'll take you to onboarding in a moment.
              </p>
              {showManualButton && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm text-muted-foreground mb-3">
                    If you're not redirected automatically, click below to continue:
                  </p>
                  <Button
                    onClick={() => router.push('/onboarding')}
                    className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                  >
                    Continue to Setup <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
