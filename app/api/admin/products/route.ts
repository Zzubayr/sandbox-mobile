export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/session";
import { connectToDatabase } from "@/lib/db/connection";
import Product from "@/lib/db/models/product";
import Vendor from "@/lib/db/models/vendor";

function shapeProduct(doc: any) {
  if (!doc) return null;
  const { _id, vendor_id, ...rest } = doc;
  const vendorObj: any = vendor_id && typeof vendor_id === "object" && !Array.isArray(vendor_id) ? vendor_id : null;

  return {
    ...rest,
    id: _id?.toString?.(),
    vendor_id: vendorObj?._id?.toString?.() || vendor_id?.toString?.(),
    vendor: vendorObj
      ? {
          id: vendorObj._id?.toString?.(),
          store_name: vendorObj.store_name,
          store_slug: vendorObj.store_slug,
          email: vendorObj.email,
          approval_status: vendorObj.approval_status,
          theme_color: vendorObj.theme_color,
        }
      : undefined,
    created_at: doc.created_at ? new Date(doc.created_at).toISOString() : undefined,
    updated_at: doc.updated_at ? new Date(doc.updated_at).toISOString() : undefined,
  };
}

export async function GET() {
  try {
    await requireAdmin();
    await connectToDatabase();

    const products = await Product.find({})
      .sort({ created_at: -1 })
      .populate({
        path: "vendor_id",
        model: Vendor,
        select: "store_name store_slug email theme_color approval_status",
      })
      .lean();

    return NextResponse.json({
      products: products.map((p: any) => shapeProduct(p)).filter(Boolean),
    });
  } catch (error) {
    console.error("Admin products API error:", error);
    return NextResponse.json({ error: "Forbidden or server error" }, { status: 403 });
  }
}
