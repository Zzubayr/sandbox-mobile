"use client";

import type React from "react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toastHelpers } from "@/lib/toast-helpers";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, ArrowRight, ArrowLeft, Check, Eye, EyeOff } from "lucide-react";
import Image from "next/image";
import logo from "@/public/logo.svg";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<"email" | "verify">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    setIsLoading(true);
    setError(null);

    try {
      // Call our custom API route
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to send reset code");
      }

      toastHelpers.success(
        "Code Sent",
        "A reset code has been sent to your email."
      );
      setStep("verify");
    } catch (err: any) {
      const errorMessage = err?.message || "Could not send reset code";
      setError(errorMessage);
      toastHelpers.error("Request Failed", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      const msg = "Passwords do not match";
      setError(msg);
      toastHelpers.error("Validation Error", msg);
      return;
    }

    if (newPassword.length < 8) {
      const msg = "Password must be at least 8 characters long";
      setError(msg);
      toastHelpers.error("Validation Error", msg);
      return;
    }

    if (otp.length !== 6) {
      const msg = "Please enter the 6-digit code";
      setError(msg);
      toastHelpers.error("Validation Error", msg);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Call our custom API route
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, newPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to reset password");
      }

      toastHelpers.success(
        "Password Reset",
        "Your password has been reset successfully. Please sign in."
      );
      router.push("/auth/login");
    } catch (err: any) {
      const errorMessage = err?.message || "Could not reset password";
      setError(errorMessage);
      toastHelpers.error("Reset Failed", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const passwordRequirements = [
    { text: "At least 8 characters", met: newPassword.length >= 8 },
    {
      text: "Contains letters and numbers",
      met: /[A-Za-z]/.test(newPassword) && /[0-9]/.test(newPassword),
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-[#EBF3FA] to-[#D6E7F5] flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] -z-10" />

      <div className="w-full max-w-md">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 mb-4">
            <Image src={logo} className="" alt="logo" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent mb-2">
            Ummah Square
          </h1>
          <p className="text-slate-600">
            {step === "email" ? "Reset your password" : "Enter verification code"}
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-slate-800 mb-2">
              {step === "email" ? "Forgot Password" : "Verify Code"}
            </h2>
            <p className="text-slate-600">
              {step === "email"
                ? "Enter your email to receive a reset code"
                : "Enter the 6-digit code sent to your email"}
            </p>
          </div>

          {step === "email" ? (
            <form onSubmit={handleSendOTP} className="space-y-6">
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

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full h-12 bg-gradient-to-r from-[#2B6DA9] to-[#20527F] hover:from-[#20527F] hover:to-[#183D5F] text-white font-medium rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    Sending code...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    Send Reset Code
                    <ArrowRight className="h-4 w-4" />
                  </div>
                )}
              </Button>

              {/* Back to Login */}
              <div className="text-center">
                <Link
                  href="/auth/login"
                  className="text-sm text-slate-600 hover:text-[#2B6DA9] transition-colors inline-flex items-center gap-1"
                >
                  <ArrowLeft className="h-3 w-3" />
                  Back to login
                </Link>
              </div>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-6">
              {/* OTP Input */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">
                  Verification Code
                </Label>
                <div className="flex justify-center">
                  <InputOTP
                    maxLength={6}
                    value={otp}
                    onChange={(value) => setOtp(value)}
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
                <p className="text-xs text-slate-500 text-center">
                  Code sent to {email}
                </p>
              </div>

              {/* New Password Field */}
              <div className="space-y-2">
                <Label htmlFor="newPassword" className="text-sm font-medium text-slate-700">
                  New Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="newPassword"
                    type={showPassword ? "text" : "password"}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="pl-10 pr-10 h-12 border-slate-200 focus:border-[#2B6DA9] focus:ring-[#2B6DA9]/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>

                {/* Password Requirements */}
                {newPassword && (
                  <div className="space-y-1">
                    {passwordRequirements.map((req, index) => (
                      <div key={index} className="flex items-center gap-2 text-xs">
                        <Check
                          className={`h-3 w-3 ${
                            req.met ? "text-green-500" : "text-slate-300"
                          }`}
                        />
                        <span className={req.met ? "text-green-600" : "text-slate-500"}>
                          {req.text}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium text-slate-700">
                  Confirm Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10 pr-10 h-12 border-slate-200 focus:border-[#2B6DA9] focus:ring-[#2B6DA9]/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>

                {/* Password Match Indicator */}
                {confirmPassword && (
                  <div className="flex items-center gap-2 text-xs">
                    <Check
                      className={`h-3 w-3 ${
                        newPassword === confirmPassword
                          ? "text-green-500"
                          : "text-red-500"
                      }`}
                    />
                    <span
                      className={
                        newPassword === confirmPassword
                          ? "text-green-600"
                          : "text-red-600"
                      }
                    >
                      {newPassword === confirmPassword
                        ? "Passwords match"
                        : "Passwords do not match"}
                    </span>
                  </div>
                )}
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full h-12 bg-gradient-to-r from-[#2B6DA9] to-[#20527F] hover:from-[#20527F] hover:to-[#183D5F] text-white font-medium rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
                disabled={
                  isLoading ||
                  newPassword !== confirmPassword ||
                  newPassword.length < 8 ||
                  otp.length !== 6
                }
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    Resetting password...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    Reset Password
                    <ArrowRight className="h-4 w-4" />
                  </div>
                )}
              </Button>

              {/* Back Button */}
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setStep("email");
                    setOtp("");
                    setNewPassword("");
                    setConfirmPassword("");
                    setError(null);
                  }}
                  className="text-sm text-slate-600 hover:text-[#2B6DA9] transition-colors inline-flex items-center gap-1"
                >
                  <ArrowLeft className="h-3 w-3" />
                  Use different email
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-xs text-slate-500">
            Remember your password?{" "}
            <Link
              href="/auth/login"
              className="text-[#2B6DA9] hover:text-[#20527F] font-medium"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
