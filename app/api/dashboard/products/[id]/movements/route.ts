export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { connectToDatabase } from "@/lib/db/connection";
import Vendor from "@/lib/db/models/vendor";
import InventoryMovement from "@/lib/db/models/inventory-movement";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { user } = await requireUser();
    await connectToDatabase();
    const vendor = await Vendor.findOne({ user_id: user.id }).lean();
    if (!vendor) return NextResponse.json({ movements: [] });

    const movements = await InventoryMovement.find({
      vendor_id: vendor._id,
      product_id: params.id,
    })
      .sort({ created_at: -1 })
      .limit(50)
      .lean();

    return NextResponse.json({ movements });
  } catch (err) {
    console.error("List movements error:", err);
    return NextResponse.json({ movements: [] });
  }
}
