import React from "react";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { connectToDatabase } from "@/lib/db/connection";
import Vendor from "@/lib/db/models/vendor";
import DashboardShell from "@/components/dashboard/dashboard-layout";

export default async function DashboardRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Require authentication
  let user: { id: string; email?: string };
  try {
    const session = await requireUser();
    user = {
      id: session.user.id as string,
      email: session.user.email as string | undefined,
    };
  } catch {
    redirect("/auth/login?next=/dashboard");
  }

  // Fetch vendor using Mongo/Mongoose
  await connectToDatabase();
  const vendor = await Vendor.findOne({ user_id: user.id }).lean();

  // If user is logged in but hasn't created a vendor profile, send to onboarding
  if (!vendor) {
    redirect("/onboarding");
  }

  return (
    <DashboardShell userEmail={user.email} vendor={vendor}>
      {children}
    </DashboardShell>
  );
}
