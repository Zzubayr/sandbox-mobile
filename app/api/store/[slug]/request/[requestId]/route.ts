export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
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

export async function GET(
  _request: NextRequest,
  { params }: { params: { slug: string; requestId: string } }
) {
  try {
    await connectToDatabase();
    const vendorDoc = await Vendor.findOne({ store_slug: params.slug, is_active: true }).lean();
    if (!vendorDoc) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const reqDoc = await Request.findOne({ _id: params.requestId, vendor_id: vendorDoc._id }).lean();
    if (!reqDoc) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const items = await RequestItem.find({ request_id: reqDoc._id }).lean();
    const productIds = items.map((i) => i.product_id);
    const products = await Product.find({ _id: { $in: productIds } })
      .select({ title: 1, price: 1, images: 1, attributes: 1 })
      .lean();
    const productMap = new Map(products.map((p) => [p._id.toString(), p]));

    const request = {
      ...shapeId(reqDoc),
      request_items: items.map((it) => ({
        ...shapeId(it),
        product: products.length ? shapeId(productMap.get(it.product_id.toString()) as any) : undefined,
      })),
    };

    return NextResponse.json({ vendor: shapeId(vendorDoc), request });
  } catch (err) {
    console.error("Get request error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

