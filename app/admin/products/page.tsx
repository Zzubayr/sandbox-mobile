import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { requireAdmin } from "@/lib/auth/session";
import { AdminProducts } from "@/components/admin/admin-products";

export default async function AdminProductsPage() {
  try {
    await requireAdmin();
  } catch {
    redirect("/auth/login?next=/admin/products");
  }

  const baseURL =
    process.env.NEXT_PUBLIC_SITE_URL || process.env.BETTER_AUTH_URL || "http://localhost:3000";
  const cookie = (await headers()).get("cookie") || "";
  const res = await fetch(new URL("/api/admin/products", baseURL).toString(), {
    cache: "no-store",
    headers: { cookie },
  });
  const data = res.ok ? await res.json() : { products: [] };

  return <AdminProducts initialProducts={data.products || []} />;
}
