export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { connectToDatabase } from "@/lib/db/connection";
import Vendor from "@/lib/db/models/vendor";

function shapeId<T extends { _id?: any }>(doc: T) {
  if (!doc) return doc as any;
  const { _id, ...rest } = doc as any;
  return { ...rest, id: _id?.toString?.() };
}

export async function GET() {
  try {
    const { user } = await requireUser();
    await connectToDatabase();
    const vendorDoc = await Vendor.findOne({ user_id: user.id }).lean();
    if (!vendorDoc) return NextResponse.json({ vendor: null });
    return NextResponse.json({ vendor: shapeId(vendorDoc) });
  } catch (err) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

