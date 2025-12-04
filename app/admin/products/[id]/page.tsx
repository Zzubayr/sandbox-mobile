import { redirect, notFound } from "next/navigation";
import { headers } from "next/headers";
import { requireAdmin } from "@/lib/auth/session";
import { AdminProductDetail } from "@/components/admin/admin-product-detail";

export default async function AdminProductDetailPage({ params }: { params: { id: string } }) {
  try {
    await requireAdmin();
  } catch {
    redirect(`/auth/login?next=/admin/products/${params.id}`);
  }

  const baseURL =
    process.env.NEXT_PUBLIC_SITE_URL || process.env.BETTER_AUTH_URL || "http://localhost:3000";
  const cookie = (await headers()).get("cookie") || "";

  const res = await fetch(new URL(`/api/admin/products/${params.id}`, baseURL).toString(), {
    cache: "no-store",
    headers: { cookie },
  });

  if (res.status === 404) {
    notFound();
  }

  const data = res.ok ? await res.json() : null;

  if (!data?.product) {
    notFound();
  }

  return <AdminProductDetail product={data.product} />;
}
