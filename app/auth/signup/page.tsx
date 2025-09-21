"use client"

import type React from "react"
// import { SignupDebug } from "@/components/debug/signup-debug"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toastHelpers } from "@/lib/toast-helpers"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"

export default function SignupPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [storeName, setStoreName] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      toastHelpers.error("Validation Error", "Passwords do not match")
      setIsLoading(false)
      return
    }

    try {
      console.log(email)

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/dashboard`,
          data: {
            store_name: storeName,
          },
        },
      })

      console.log({ data, error })

      if (error) {
        console.log(error)
        throw error
      }

      // Check if user was created successfully
      if (data.user) {
        toastHelpers.success("Account Created", "Please check your email to verify your account")
        router.push("/auth/signup-success")
      } else {
        throw new Error("User creation failed - no user data returned")
      }
    } catch (error: unknown) {
      console.log("[v0] Caught error:", error)

      // Provide more specific error messages
      if (error instanceof Error) {
        let errorMessage = error.message
        if (error.message.includes("duplicate key")) {
          errorMessage = "An account with this email already exists"
        } else if (error.message.includes("database")) {
          errorMessage = "Database error - please try again or contact support"
        } else if (error.message.includes("trigger")) {
          errorMessage = "Account setup error - please try again"
        }
        setError(errorMessage)
        toastHelpers.error("Signup Failed", errorMessage)
      } else {
        const errorMessage = "An unexpected error occurred"
        setError(errorMessage)
        toastHelpers.error("Signup Failed", errorMessage)
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-blue-600">Sandbox</h1>
            <p className="text-muted-foreground">Create Vendor Account</p>
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Sign up</CardTitle>
              <CardDescription>Create your vendor account</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSignup}>
                <div className="flex flex-col gap-6">
                  <div className="grid gap-2">
                    <Label htmlFor="storeName">Store Name</Label>
                    <Input
                      id="storeName"
                      type="text"
                      placeholder="My Music Store"
                      required
                      value={storeName}
                      onChange={(e) => setStoreName(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="vendor@example.com"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                  {error && <p className="text-sm text-red-500">{error}</p>}
                  <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={isLoading}>
                    {isLoading ? "Creating account..." : "Sign up"}
                  </Button>
                </div>
                <div className="mt-4 text-center text-sm">
                  Already have an account?{" "}
                  <Link href="/auth/login" className="underline underline-offset-4 text-blue-600">
                    Login
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>
          {/* {process.env.NODE_ENV === "development" && <SignupDebug />} */}
        </div>
      </div>
    </div>
  )
}
