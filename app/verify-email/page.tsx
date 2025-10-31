"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function VerifyEmailPage() {
  const router = useRouter();
  // Verification not required; redirect users to login
  if (typeof window !== 'undefined') {
    router.replace('/auth/login');
  }
  return null;
}
