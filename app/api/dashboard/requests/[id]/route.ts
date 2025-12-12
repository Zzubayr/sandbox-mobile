export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { connectToDatabase } from "@/lib/db/connection";
import Vendor from "@/lib/db/models/vendor";
import Request from "@/lib/db/models/request";
import RequestItem from "@/lib/db/models/request-item";
import Product from "@/lib/db/models/product";
import { recordInventoryMovement } from "@/lib/db/models/inventory-movement";

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { user } = await requireUser();
    await connectToDatabase();
    const vendor = await Vendor.findOne({ user_id: user.id }).lean();
    if (!vendor) return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    const { status } = await request.json();
    if (!['pending','completed','cancelled'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }
    const existing = await Request.findOne({ _id: params.id, vendor_id: vendor._id }).lean();
    if (!existing) return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    if (existing.status === status) return NextResponse.json({ success: true });
    // Only allow transitions from pending
    if (existing.status !== 'pending') {
      return NextResponse.json({ error: 'Request is already finalized' }, { status: 400 });
    }

    const items = await RequestItem.find({ request_id: existing._id }).lean();
    const productIds = items.map((i: any) => i.product_id);
    const products = await Product.find({ _id: { $in: productIds }, vendor_id: vendor._id }).lean();
    const pmap = new Map(products.map((p: any) => [p._id.toString(), p]));

    if (status === 'completed') {
      // Attempt to commit reservations and decrement stock
      for (const it of items) {
        const prod = pmap.get(it.product_id.toString());
        if (!prod) return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        const qty = Math.max(1, Math.floor(it.quantity || 1));
        const allowBackorder = Boolean((prod as any).allow_backorder);
        const reserved = typeof (prod as any).reserved_stock === 'number' ? (prod as any).reserved_stock : 0;
        const available = (typeof (prod as any).stock === 'number' ? (prod as any).stock : 0) - reserved;
        if (!allowBackorder && available < qty) {
          return NextResponse.json({ error: `Insufficient stock for ${prod.title}` }, { status: 400 });
        }
        // Commit: reduce reserved then stock (allow backorder can go negative)
        await Product.updateOne(
          { _id: prod._id },
          {
            $inc: {
              reserved_stock: -Math.min(reserved, qty),
              stock: -qty,
            },
          }
        );
        recordInventoryMovement({
          vendorId: vendor._id,
          productId: prod._id,
          type: "commit",
          quantity: -qty,
          refId: existing._id.toString(),
          note: "Request fulfilled",
        });
      }
    }

    if (status === 'cancelled') {
      // Release reservations
      for (const it of items) {
        const prod = pmap.get(it.product_id.toString());
        if (!prod) continue;
        const qty = Math.max(1, Math.floor(it.quantity || 1));
        await Product.updateOne(
          { _id: prod._id, reserved_stock: { $gte: qty } },
          { $inc: { reserved_stock: -qty } }
        );
        // If not enough reserved_stock, zero it out
        await Product.updateOne(
          { _id: prod._id, reserved_stock: { $lt: 0 } },
          { $set: { reserved_stock: 0 } }
        );
        recordInventoryMovement({
          vendorId: vendor._id,
          productId: prod._id,
          type: "release",
          quantity: qty,
          refId: existing._id.toString(),
          note: "Request cancelled",
        });
      }
    }

    const updated = await Request.findOneAndUpdate(
      { _id: params.id, vendor_id: vendor._id },
      { status },
      { new: true }
    ).lean();
    return NextResponse.json({ success: true, status: updated?.status });
  } catch (err) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
