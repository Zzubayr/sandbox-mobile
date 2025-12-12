export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { connectToDatabase } from "@/lib/db/connection";
import Vendor from "@/lib/db/models/vendor";
import Product from "@/lib/db/models/product";
import { recordInventoryMovement } from "@/lib/db/models/inventory-movement";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user } = await requireUser();
    await connectToDatabase();
    const vendor = await Vendor.findOne({ user_id: user.id }).lean();
    if (!vendor) return NextResponse.json({ error: "Vendor not found" }, { status: 404 });

    const { delta, note } = await request.json();
    const parsed = Number(delta);
    if (!Number.isFinite(parsed) || parsed === 0) {
      return NextResponse.json({ error: "Invalid adjustment" }, { status: 400 });
    }

    const product = await Product.findOne({ _id: params.id, vendor_id: vendor._id }).lean();
    if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

    const newStock = Math.max(0, (product as any).stock + Math.trunc(parsed));

    await Product.updateOne(
      { _id: product._id, vendor_id: vendor._id },
      { $set: { stock: newStock } }
    );

    await recordInventoryMovement({
      vendorId: vendor._id,
      productId: product._id as any,
      type: "adjust",
      quantity: Math.trunc(parsed),
      refId: params.id,
      note: typeof note === "string" ? note : undefined,
    });

    return NextResponse.json({ success: true, stock: newStock });
  } catch (err) {
    console.error("Adjust stock error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
