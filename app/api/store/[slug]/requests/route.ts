export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/connection";
import Vendor from "@/lib/db/models/vendor";
import Product from "@/lib/db/models/product";
import Request from "@/lib/db/models/request";
import RequestItem from "@/lib/db/models/request-item";
import { sendRequestNotificationEmail } from "@/lib/mail";
import { recordInventoryMovement } from "@/lib/db/models/inventory-movement";

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
    const productDocs = await Product.find({ _id: { $in: productIds }, vendor_id: vendorDoc._id, status: "active", is_archived: { $ne: true } }).lean();
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
      const maxPerOrder = typeof (prod as any).max_per_order === 'number' ? (prod as any).max_per_order : 50;
      if (qty > maxPerOrder) {
        return NextResponse.json({ error: `Quantity exceeds allowed limit for ${prod.title}` }, { status: 400 });
      }
      if (!(prod as any).allow_backorder) {
        const currentStock = typeof (prod as any).stock === 'number' ? (prod as any).stock : 0;
        const reserved = typeof (prod as any).reserved_stock === 'number' ? (prod as any).reserved_stock : 0;
        if (currentStock - reserved < qty) {
          return NextResponse.json({ error: `Insufficient stock for ${prod.title}` }, { status: 400 });
        }
      }
      total += (prod.price || 0) * qty;
    }

    const reserved: Array<{ id: any; qty: number }> = [];
    try {
      for (const it of items) {
        const prod = productMap.get(it.productId)!;
        const qty = Math.max(1, Math.floor(it.quantity || 1));
        if (!(prod as any).allow_backorder) {
          const res = await Product.updateOne(
            {
              _id: prod._id,
              $expr: {
                $gte: [
                  { $subtract: ["$stock", { $ifNull: ["$reserved_stock", 0] }] },
                  qty,
                ],
              },
            },
            { $inc: { reserved_stock: qty } }
          );
          if (!res.modifiedCount) {
            // rollback previous reservations
            for (const r of reserved) {
              await Product.updateOne({ _id: r.id }, { $inc: { reserved_stock: -r.qty } });
            }
            return NextResponse.json({ error: `Insufficient stock for ${prod.title}` }, { status: 400 });
          }
          reserved.push({ id: prod._id, qty });
        }
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

      const toEmail = vendorDoc.contact_email || vendorDoc.email;
      const itemsForMail = itemsToInsert.map((it) => ({
        name: productMap.get(it.product_id.toString())?.title || "Product",
        quantity: it.quantity,
        price: it.price,
      }));
      sendRequestNotificationEmail({
        to: toEmail,
        storeName: vendorDoc.store_name,
        requestId: reqDoc._id.toString(),
        customerName,
        customerPhone,
        customerNote: customerNote || null,
        items: itemsForMail,
        total,
      }).catch((err) => console.error("Send request notification failed", err));

      // Log reservations for audit trail
      for (const it of itemsToInsert) {
        const prod = productMap.get(it.product_id.toString());
        if (!prod || (prod as any).allow_backorder) continue;
        recordInventoryMovement({
          vendorId: vendorDoc._id,
          productId: prod._id,
          type: "reserve",
          quantity: -it.quantity, // hold reduces available
          refId: reqDoc._id.toString(),
          note: "Request reservation",
        });
      }

      return NextResponse.json({ requestId: reqDoc._id.toString() });
    } catch (err) {
      for (const r of reserved) {
        await Product.updateOne({ _id: r.id }, { $inc: { reserved_stock: -r.qty } });
      }
      throw err;
    }
  } catch (err) {
    console.error("Create request error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
