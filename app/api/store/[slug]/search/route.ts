export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/connection";
import Vendor from "@/lib/db/models/vendor";
import Product from "@/lib/db/models/product";

function shapeId<T extends { _id?: any }>(doc: T) {
  if (!doc) return doc as any;
  const { _id, ...rest } = doc as any;
  return { ...rest, id: _id?.toString?.() };
}

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get("q") || "").trim();
    if (q.length < 3) return NextResponse.json({ products: [] });

    const vendor = await Vendor.findOne({
      store_slug: params.slug,
      is_active: true,
      approval_status: "approved",
    }).lean();
    if (!vendor) return NextResponse.json({ products: [] });

    const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    const productDocs = await Product.find({
      vendor_id: vendor._id,
      status: "active",
      $or: [{ title: regex }, { description: regex }],
    })
      .sort({ created_at: -1 })
      .limit(5)
      .lean();
    const products = productDocs.map((p) => shapeId(p));
    return NextResponse.json({ products });
  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
