"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function VerifyEmailPage() {
  const search = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState("Verifying email...");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = search?.get("token");
    const callbackURL = search?.get("callbackURL") || "/auth/login";
    if (!token) {
      setStatus("Missing token");
      setError("The verification link is invalid.");
      return;
    }
    (async () => {
      try {
        const res = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, callbackURL }),
          credentials: "include",
        });
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || `Failed (${res.status})`);
        }
        setStatus("Email verified. Redirecting...");
        router.replace(callbackURL);
      } catch (e: any) {
        setError(e?.message || "Verification failed");
        setStatus("Error");
      }
    })();
  }, [router, search]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-sm text-slate-600">{status}</p>
        {error && <p className="mt-2 text-red-600 text-sm">{error}</p>}
      </div>
    </div>
  );
}

