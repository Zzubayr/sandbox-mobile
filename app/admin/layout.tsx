import React from "react";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/session";
import { AdminLayout as AdminShell } from "@/components/admin/admin-layout";

export default async function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    const { session } = await requireAdmin(); // returns { session, admin }
    const userEmail = session.user.email as string | undefined;
    return <AdminShell userEmail={userEmail}>{children}</AdminShell>;
  } catch {
    // Not admin or not logged in
    redirect("/auth/login?next=/admin");
  }
}
