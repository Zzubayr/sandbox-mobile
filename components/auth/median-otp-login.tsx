"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Mail } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"
import { Label } from "@/components/ui/label"
import logo from "@/public/logo.svg"
import { toastHelpers } from "@/lib/toast-helpers"

export function MedianOtpLogin() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState("")
  const [step, setStep] = useState<"email" | "otp">("email")
  const [error, setError] = useState<string | null>(null)
  const [isSending, setIsSending] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [resendTimer, setResendTimer] = useState(0)

  useEffect(() => {
    if (resendTimer <= 0) return
    const timer = setInterval(() => {
      setResendTimer((prev) => Math.max(prev - 1, 0))
    }, 1000)
    return () => clearInterval(timer)
  }, [resendTimer])

  const requestOtp = async () => {
    const normalizedEmail = email.trim().toLowerCase()
    if (!normalizedEmail) {
      setError("Please enter your email address")
      return
    }
    setIsSending(true)
    setError(null)
    try {
      const response = await fetch("/api/auth/email-otp/send-verification-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail, type: "sign-in" }),
      })
      const payload = await readJson(response)
      if (!response.ok) {
        throw new Error(resolveErrorMessage(payload, "Unable to send the code"))
      }
      toastHelpers.success("Code sent", "Check your inbox for a 6-digit code.")
      setEmail(normalizedEmail)
      setOtp("")
      setStep("otp")
      setResendTimer(60)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to send the code"
      setError(message)
      toastHelpers.error("OTP Error", message)
    } finally {
      setIsSending(false)
    }
  }

  const verifyOtp = async () => {
    const normalizedEmail = email.trim().toLowerCase()
    if (!normalizedEmail) {
      setError("Email is required")
      return
    }
    if (otp.length !== 6) {
      setError("Enter the 6-digit code we emailed you")
      return
    }
    setIsVerifying(true)
    setError(null)
    try {
      const response = await fetch("/api/auth/sign-in/email-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail, otp }),
      })
      const payload = await readJson(response)
      if (!response.ok) {
        throw new Error(resolveErrorMessage(payload, "Incorrect or expired code"))
      }
      toastHelpers.success("Login Successful", "Welcome back!")
      router.push("/auth/post-login")
    } catch (err) {
      const message = err instanceof Error ? err.message : "Incorrect or expired code"
      setError(message)
      toastHelpers.error("Verification Failed", message)
    } finally {
      setIsVerifying(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-[#EBF3FA] to-[#D6E7F5] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] -z-10" />

      <div className="w-full max-w-md">
        <div className="text-center mb-8 space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 mx-auto rounded-2xl bg-white/80 shadow-md">
            <Image src={logo} alt="logo" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-[#2B6DA9] to-[#20527F] bg-clip-text text-transparent">
              Median Secure Sign In
            </h1>
            <p className="text-slate-600 mt-2">
              Enter the email tied to your Ummah Square store to get a one-time login code.
            </p>
          </div>
        </div>

        <div className="bg-white/85 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8 space-y-6">
          {step === "email" ? (
            <form
              onSubmit={(event) => {
                event.preventDefault()
                void requestOtp()
              }}
              className="space-y-6"
            >
              <div className="space-y-2">
                <Label htmlFor="median-email" className="text-sm font-medium text-slate-700">
                  Account Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="median-email"
                    type="email"
                    placeholder="vendor@example.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="pl-10 h-12 border-slate-200 focus:border-[#2B6DA9] focus:ring-[#2B6DA9]/20"
                    required
                  />
                </div>
                <p className="text-xs text-slate-500">
                  We’ll send a code only if this email matches an existing Ummah Square account.
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-12 bg-gradient-to-r from-[#2B6DA9] to-[#20527F] hover:from-[#20527F] hover:to-[#183D5F]"
                disabled={isSending}
              >
                {isSending ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    Sending code...
                  </div>
                ) : (
                  "Send login code"
                )}
              </Button>
            </form>
          ) : (
            <form
              onSubmit={(event) => {
                event.preventDefault()
                void verifyOtp()
              }}
              className="space-y-6"
            >
              <div className="space-y-1 text-sm text-slate-600">
                <p>
                  We sent a 6-digit code to <span className="font-semibold text-slate-800">{email}</span>.
                </p>
                <button
                  type="button"
                  className="text-[#2B6DA9] hover:text-[#20527F] text-xs"
                  onClick={() => {
                    setStep("email")
                    setOtp("")
                    setResendTimer(0)
                    setError(null)
                  }}
                >
                  Use a different email
                </button>
              </div>

              <InputOTP
                value={otp}
                onChange={(value) => {
                  setOtp(value)
                  if (error) setError(null)
                }}
                maxLength={6}
                containerClassName="justify-center gap-2"
              >
                <InputOTPGroup>
                  {Array.from({ length: 6 }).map((_, index) => (
                    <InputOTPSlot
                      key={index}
                      index={index}
                      className="h-12 w-10 text-lg font-semibold"
                    />
                  ))}
                </InputOTPGroup>
              </InputOTP>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-12 bg-gradient-to-r from-[#2B6DA9] to-[#20527F] hover:from-[#20527F] hover:to-[#183D5F]"
                disabled={isVerifying || otp.length !== 6}
              >
                {isVerifying ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    Verifying...
                  </div>
                ) : (
                  "Verify & sign in"
                )}
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="w-full justify-center"
                disabled={resendTimer > 0 || isSending}
                onClick={() => {
                  void requestOtp()
                }}
              >
                {resendTimer > 0 ? `Resend code in ${resendTimer}s` : "Resend code"}
              </Button>
            </form>
          )}
        </div>

        <div className="text-center mt-6 text-sm text-slate-600">
          Need an account?{" "}
          <Link href="/auth/signup" className="text-[#2B6DA9] hover:text-[#20527F] font-medium">
            Finish sign up on the web
          </Link>
        </div>
      </div>
    </div>
  )
}

async function readJson(response: Response) {
  try {
    return await response.json()
  } catch {
    return null
  }
}

function resolveErrorMessage(payload: any, fallback: string) {
  if (!payload) return fallback
  if (typeof payload.error === "string") return payload.error
  if (typeof payload.error?.message === "string") return payload.error.message
  if (typeof payload.message === "string") return payload.message
  return fallback
}
