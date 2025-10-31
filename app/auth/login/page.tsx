"use client"

import type React from "react"
import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toastHelpers } from "@/lib/toast-helpers"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import logo from "@/public/logo.svg"
import Image from "next/image"
import { Eye, EyeOff, Mail, Lock, ArrowRight, Store, Shield } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const { error } = await authClient.signIn.email({
        email,
        password,
        rememberMe: true,
        callbackURL: "/auth/post-login",
      });
      if (error) throw error;
      toastHelpers.success("Login Successful", "Welcome back!");
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);
      toastHelpers.error("Login Failed", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    // If offline, fail fast with a clear message.
    if (typeof navigator !== "undefined" && navigator && navigator.onLine === false) {
      const msg = "You appear to be offline. Please check your connection.";
      setError(msg);
      toastHelpers.networkError();
      return;
    }

    setIsGoogleLoading(true);
    setError(null);

    // Fallback: if the auth endpoint errors or does not redirect
    // (e.g., backend 500), show a toast and re-enable the button.
    const timeout = setTimeout(() => {
      // If we're still loading after a few seconds, assume failure.
      if (isGoogleLoading) {
        const msg = "Google sign-in did not start. Please try again.";
        setError(msg);
        toastHelpers.error("Google Login Failed", msg);
        setIsGoogleLoading(false);
      }
    }, 7000);

    try {
      await authClient.signIn.social({
        provider: "google",
        callbackURL: "/auth/post-login",
        errorCallbackURL: "/auth/login",
      });
      // Normally this triggers a redirect; if it returns without redirecting
      // and without throwing, clear the timeout and reset the button.
      clearTimeout(timeout);
      setIsGoogleLoading(false);
    } catch (err: unknown) {
      clearTimeout(timeout);
      const errorMessage =
        err instanceof Error ? err.message : "Google login failed";
      setError(errorMessage);
      // Provide a helpful message for common network/DB errors.
      if (
        typeof errorMessage === "string" &&
        (errorMessage.toLowerCase().includes("network") ||
          errorMessage.toLowerCase().includes("econnrefused") ||
          errorMessage.toLowerCase().includes("mongodb"))
      ) {
        toastHelpers.error(
          "Google Login Failed",
          "A server connection error occurred. Please try again."
        );
      } else {
        toastHelpers.error("Google Login Failed", errorMessage);
      }
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-[#EBF3FA] to-[#D6E7F5] flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] -z-10" />
      
      <div className="w-full max-w-md">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16  mb-4">
              {/* <Sparkles className="h-5 w-5 text-white" /> */}
              <Image src={logo} className="" alt="logo"/>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent mb-2">
            Ummah Square
          </h1>
          <p className="text-slate-600">Welcome back to your vendor dashboard</p>
        </div>

        {/* Login Form */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-slate-800 mb-2">Sign In</h2>
            <p className="text-slate-600">Access your vendor account</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-slate-700">
                Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="vendor@example.com"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-12 border-slate-200 focus:border-[#2B6DA9] focus:ring-[#2B6DA9]/20"
                    />
                  </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-slate-700">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      id="password"
                  type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 h-12 border-slate-200 focus:border-[#2B6DA9] focus:ring-[#2B6DA9]/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-600">{error}</p>
                  </div>
            )}

            {/* Login Button */}
            <Button 
              type="submit" 
              className="w-full h-12 bg-gradient-to-r from-[#2B6DA9] to-[#20527F] hover:from-[#20527F] hover:to-[#183D5F] text-white font-medium rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl" 
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  Signing in...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  Sign In
                  <ArrowRight className="h-4 w-4" />
                </div>
              )}
            </Button>

            {/* Forgot password disabled */}
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-slate-500">Or continue with</span>
            </div>
          </div>

          {/* Google Login */}
          <Button
            type="button"
            variant="outline"
            onClick={handleGoogleLogin}
            disabled={isGoogleLoading}
            className="w-full h-12 border-slate-200 hover:bg-slate-50 font-medium rounded-lg transition-all duration-200"
          >
            {isGoogleLoading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-slate-400 border-t-transparent" />
                Connecting...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continue with Google
              </div>
            )}
          </Button>

          {/* Sign Up Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-slate-600">
              Don't have an account?{" "}
              <Link 
                href="/auth/signup" 
                className="font-medium text-[#2B6DA9] hover:text-[#20527F] transition-colors"
              >
                Create one here
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-xs text-slate-500">
            By signing in, you agree to our{" "}
            <Link href="https://www.ummahsquare.com.ng/policies/legal" className="text-blue-600 hover:text-blue-700">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="https://www.ummahsquare.com.ng/policies/privacy" className="text-blue-600 hover:text-blue-700">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
