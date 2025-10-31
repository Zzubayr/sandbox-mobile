"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toastHelpers } from "@/lib/toast-helpers";

export default function ResetPasswordPage() {
  const router = useRouter();
  // Feature disabled: redirect to login
  if (typeof window !== 'undefined') {
    router.replace('/auth/login');
  }
  return null;
}
