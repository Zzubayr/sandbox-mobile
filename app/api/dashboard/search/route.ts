export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { connectToDatabase } from "@/lib/db/connection";
import Vendor from "@/lib/db/models/vendor";
import Product from "@/lib/db/models/product";
import Request from "@/lib/db/models/request";

function shapeId<T extends { _id?: any }>(doc: T) {
  if (!doc) return doc as any;
  const { _id, ...rest } = doc as any;
  return { ...rest, id: _id?.toString?.() };
}

export async function GET(request: NextRequest) {
  try {
    const { user } = await requireUser();
    await connectToDatabase();
    const vendor = await Vendor.findOne({ user_id: user.id }).lean();
    if (!vendor) return NextResponse.json({ products: [], requests: [] });

    const { searchParams } = new URL(request.url);
    const q = (searchParams.get("q") || "").trim();
    if (q.length < 3) return NextResponse.json({ products: [], requests: [] });

    const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");

    const [productDocs, requestDocs] = await Promise.all([
      Product.find({
        vendor_id: vendor._id,
        $or: [{ title: regex }, { description: regex }],
      })
        .sort({ created_at: -1 })
        .limit(5)
        .lean(),
      Request.find({
        vendor_id: vendor._id,
        $or: [{ customer_name: regex }, { customer_phone: regex }],
      })
        .sort({ created_at: -1 })
        .limit(5)
        .lean(),
    ]);

    const products = productDocs.map((p) => shapeId(p));
    const requests = requestDocs.map((r) => shapeId(r));
    return NextResponse.json({ products, requests });
  } catch (err) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

