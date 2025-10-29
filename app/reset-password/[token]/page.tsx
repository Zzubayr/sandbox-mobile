"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toastHelpers } from "@/lib/toast-helpers";

export default function ResetPasswordPage() {
  const params = useParams();
  const router = useRouter();
  const search = useSearchParams();
  const token = useMemo(() => String(params?.token || ""), [params]);
  const callbackURL = search?.get("callbackURL") || "/auth/login";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (password.length < 8) {
      toastHelpers.error("Invalid Password", "Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      toastHelpers.error("Password Mismatch", "Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password, callbackURL }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Failed (${res.status})`);
      }
      toastHelpers.success("Password Updated", "You can now sign in.");
      router.replace(String(callbackURL || "/auth/login"));
    } catch (e: any) {
      toastHelpers.error("Reset Failed", e?.message || "Unable to reset password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-[#EBF3FA] to-[#D6E7F5] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
        <h1 className="text-2xl font-semibold text-slate-800 mb-2">Reset password</h1>
        <p className="text-slate-600 mb-6">Choose a new password for your account.</p>
        <form onSubmit={onSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="password">New password</Label>
            <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm">Confirm password</Label>
            <Input id="confirm" type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Updating..." : "Update password"}
          </Button>
        </form>
      </div>
    </div>
  );
}

