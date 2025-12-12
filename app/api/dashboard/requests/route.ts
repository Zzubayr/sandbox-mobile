export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { connectToDatabase } from "@/lib/db/connection";
import Vendor from "@/lib/db/models/vendor";
import Request from "@/lib/db/models/request";
import RequestItem from "@/lib/db/models/request-item";
import Product from "@/lib/db/models/product";
import { recordInventoryMovement } from "@/lib/db/models/inventory-movement";

const RESERVATION_TTL_MS = (() => {
  const fromEnv = Number(process.env.RESERVATION_TTL_HOURS);
  const hours = Number.isFinite(fromEnv) && fromEnv > 0 ? fromEnv : 48;
  return hours * 60 * 60 * 1000;
})();

async function releaseExpiredRequests(vendorId: any) {
  const expiryDate = new Date(Date.now() - RESERVATION_TTL_MS);
  const expired = await Request.find({
    vendor_id: vendorId,
    status: "pending",
    created_at: { $lt: expiryDate },
  }).lean();
  if (!expired.length) return;

  const ids = expired.map((r: any) => r._id);
  const items = await RequestItem.find({ request_id: { $in: ids } }).lean();
  const productIds = items.map((i: any) => i.product_id);
  const products = await Product.find({ _id: { $in: productIds }, vendor_id: vendorId }).lean();
  const pmap = new Map(products.map((p: any) => [p._id.toString(), p]));

  for (const it of items) {
    const prod = pmap.get(it.product_id.toString());
    if (!prod) continue;
    const qty = Math.max(1, Math.floor(it.quantity || 1));
    await Product.updateOne(
      { _id: prod._id, reserved_stock: { $gte: qty } },
      { $inc: { reserved_stock: -qty } }
    );
    recordInventoryMovement({
      vendorId,
      productId: prod._id,
      type: "release",
      quantity: qty,
      refId: it.request_id.toString(),
      note: "Expired request auto-release",
    });
  }

  await Request.updateMany({ _id: { $in: ids } }, { status: "cancelled" });
}

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

    await releaseExpiredRequests(vendor._id);

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
