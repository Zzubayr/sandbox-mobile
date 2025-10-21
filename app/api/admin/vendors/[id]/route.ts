export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
// Use centralized Cloudinary cleanup endpoint
import { requireAdmin } from "@/lib/auth/session";
import { connectToDatabase } from "@/lib/db/connection";
import Vendor from "@/lib/db/models/vendor";
import Category from "@/lib/db/models/category";
import Product from "@/lib/db/models/product";
import Request from "@/lib/db/models/request";
import RequestItem from "@/lib/db/models/request-item";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();
    await connectToDatabase();

    const vendorId = params.id;
    try {
      const origin = new URL(_request.url).origin
      const prefix = `vendors/${vendorId}`
      await fetch(`${origin}/api/cloudinary/delete-prefix`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prefix }),
        cache: 'no-store',
      })
    } catch {}
    // Cascade delete like /api/admin/vendors DELETE
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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in delete vendor API:", error);
    return NextResponse.json({ error: "Forbidden or server error" }, { status: 403 });
  }
}
