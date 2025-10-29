import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth/session";

export default async function LoginLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession();
  if (session?.user) {
    redirect("/auth/post-login");
  }
  return <>{children}</>;
}

