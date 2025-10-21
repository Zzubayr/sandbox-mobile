export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/connection";
import Vendor from "@/lib/db/models/vendor";

function shapeId<T extends { _id?: any }>(doc: T) {
  if (!doc) return doc as any;
  const { _id, ...rest } = doc as any;
  return { ...rest, id: _id?.toString?.() };
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    await connectToDatabase();
    const vendorDoc = await Vendor.findOne({ store_slug: params.slug, is_active: true }).lean();
    if (!vendorDoc) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ vendor: shapeId(vendorDoc) });
  } catch (err) {
    console.error("Get vendor by slug error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

