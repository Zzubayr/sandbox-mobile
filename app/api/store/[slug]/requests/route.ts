export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/connection";
import Vendor from "@/lib/db/models/vendor";
import Product from "@/lib/db/models/product";
import Request from "@/lib/db/models/request";
import RequestItem from "@/lib/db/models/request-item";

type ItemInput = { productId: string; quantity: number };

export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    await connectToDatabase();
    const { customerName, customerPhone, customerNote, items } = (await request.json()) as {
      customerName: string;
      customerPhone: string;
      customerNote?: string;
      items: ItemInput[];
    };

    if (!customerName || !customerPhone || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const vendorDoc = await Vendor.findOne({ store_slug: params.slug, is_active: true }).lean();
    if (!vendorDoc) return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
    if (vendorDoc.approval_status !== "approved") {
      return NextResponse.json({ error: "Vendor not approved" }, { status: 403 });
    }

    const productIds = items.map((i) => i.productId);
    const productDocs = await Product.find({ _id: { $in: productIds }, vendor_id: vendorDoc._id, status: "active" }).lean();
    if (productDocs.length !== productIds.length) {
      return NextResponse.json({ error: "Some products not found or inactive" }, { status: 400 });
    }

    // Build a map for prices and ensure quantities are valid
    const productMap = new Map(productDocs.map((p) => [p._id.toString(), p]));
    let total = 0;
    for (const it of items) {
      const prod = productMap.get(it.productId);
      if (!prod) return NextResponse.json({ error: "Invalid product" }, { status: 400 });
      const qty = Math.max(1, Math.floor(it.quantity || 1));
      total += (prod.price || 0) * qty;
    }

    const reqDoc = await Request.create({
      vendor_id: vendorDoc._id,
      customer_name: customerName,
      customer_phone: customerPhone,
      customer_note: customerNote || null,
      status: "pending",
      total_amount: total,
    });

    const itemsToInsert = items.map((it) => {
      const prod = productMap.get(it.productId)!;
      const qty = Math.max(1, Math.floor(it.quantity || 1));
      return {
        request_id: reqDoc._id,
        product_id: prod._id,
        quantity: qty,
        price: prod.price,
      };
    });
    await RequestItem.insertMany(itemsToInsert);

    return NextResponse.json({ requestId: reqDoc._id.toString() });
  } catch (err) {
    console.error("Create request error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

