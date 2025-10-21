export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { connectToDatabase } from "@/lib/db/connection";
import Vendor from "@/lib/db/models/vendor";
import Request from "@/lib/db/models/request";
import RequestItem from "@/lib/db/models/request-item";
import Product from "@/lib/db/models/product";

function shapeId<T extends { _id?: any }>(doc: T) {
  if (!doc) return doc as any;
  const { _id, ...rest } = doc as any;
  return { ...rest, id: _id?.toString?.() };
}

export async function GET() {
  try {
    const { user } = await requireUser();
    await connectToDatabase();
    const vendor = await Vendor.findOne({ user_id: user.id }).lean();
    if (!vendor) return NextResponse.json({ requests: [] });

    const reqs = await Request.find({ vendor_id: vendor._id }).sort({ created_at: -1 }).lean();
    const ids = reqs.map((r: any) => r._id);
    const items = await RequestItem.find({ request_id: { $in: ids } }).lean();
    const products = await Product.find({ _id: { $in: items.map((i: any) => i.product_id) } })
      .select({ title: 1 })
      .lean();
    const pmap = new Map(products.map((p: any) => [p._id.toString(), p]));

    const grouped = new Map<string, any[]>();
    for (const it of items) {
      const key = it.request_id.toString();
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push({ ...shapeId(it), product: shapeId(pmap.get(it.product_id.toString()) as any) });
    }

    const out = reqs.map((r: any) => ({
      ...shapeId(r),
      request_items: grouped.get(r._id.toString()) || [],
    }));
    return NextResponse.json({ requests: out });
  } catch (err) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

