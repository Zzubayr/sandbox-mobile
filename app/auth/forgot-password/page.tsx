"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toastHelpers } from "@/lib/toast-helpers";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/request-password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, callbackURL: "/auth/login" }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Failed (${res.status})`);
      }
      setSent(true);
      toastHelpers.success("Email Sent", "If this email exists, you'll receive a reset link.");
    } catch (e: any) {
      toastHelpers.error("Request Failed", e?.message || "Could not send reset email");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-[#EBF3FA] to-[#D6E7F5] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
        <h1 className="text-2xl font-semibold text-slate-800 mb-2">Forgot password</h1>
        <p className="text-slate-600 mb-6">Enter your account email to receive a reset link.</p>
        <form onSubmit={onSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>
          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? "Sending..." : "Send reset link"}
          </Button>
        </form>
        {sent && (
          <p className="mt-4 text-sm text-slate-600">
            If the email exists, you'll receive a reset link shortly.
          </p>
        )}
      </div>
    </div>
  );
}

