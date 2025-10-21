export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/session";
import { connectToDatabase } from "@/lib/db/connection";
import Vendor from "@/lib/db/models/vendor";
import Category from "@/lib/db/models/category";
import Product from "@/lib/db/models/product";
import Request from "@/lib/db/models/request";
import RequestItem from "@/lib/db/models/request-item";

function shapeId<T extends { _id?: any }>(doc: T) {
if (!doc) return doc as any;
const { _id, ...rest } = doc as any;
return { ...rest, id: _id?.toString?.() };
}

export async function GET(_request: NextRequest) {
try {
await requireAdmin(); // RBAC check
await connectToDatabase(); // Mongo connect

const vendors = await Vendor
  .find({})
  .sort({ created_at: -1 })
  .lean();

// Ensure id is a top-level string
const result = vendors.map(shapeId);

return NextResponse.json({ vendors: result });
} catch (err) {
console.error("Admin vendors GET error:", err);
// 403 if not admin, 500 otherwise
if (err instanceof Error && err.message.toLowerCase().includes("forbidden")) {
return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}
return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}
}

export async function DELETE(request: NextRequest) {
  try {
    await requireAdmin();
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const vendorId = searchParams.get("vendorId");
    if (!vendorId) {
      return NextResponse.json({ error: "Vendor ID is required" }, { status: 400 });
    }

    // Best-effort: Delete Cloudinary assets via internal API
    try {
      const origin = new URL(request.url).origin
      const prefix = `vendors/${vendorId}`
      await fetch(`${origin}/api/cloudinary/delete-prefix`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prefix }),
        cache: 'no-store',
      })
    } catch (e) {
      console.warn('Cloudinary vendor cleanup warning:', e)
    }

    // Cascade delete related data in order
    const requestIds = await Request.find({ vendor_id: vendorId }).distinct("_id");
    if (requestIds.length > 0) {
      await RequestItem.deleteMany({ request_id: { $in: requestIds } });
    }
    await Request.deleteMany({ vendor_id: vendorId });
    await Product.deleteMany({ vendor_id: vendorId });
    await Category.deleteMany({ vendor_id: vendorId });

    const deleted = await Vendor.findByIdAndDelete(vendorId).lean();
    if (!deleted) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Vendor deleted successfully" });
  } catch (err) {
    console.error("Admin delete vendor error:", err);
    if (err instanceof Error && err.message.toLowerCase().includes("forbidden")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
