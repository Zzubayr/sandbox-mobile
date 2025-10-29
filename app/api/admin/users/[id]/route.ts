export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { requireAdmin } from "@/lib/auth/session";
import { connectToDatabase } from "@/lib/db/connection";
import Admin from "@/lib/db/models/admin";
import User from "@/lib/db/models/user";
import Vendor from "@/lib/db/models/vendor";
import Product from "@/lib/db/models/product";
import Request from "@/lib/db/models/request";
import RequestItem from "@/lib/db/models/request-item";

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { session } = await requireAdmin();
    await connectToDatabase();

    const adminDoc = await Admin.findOne({ user_id: session.user.id }).lean();
    if (!adminDoc || adminDoc.role !== "super_admin") {
      return NextResponse.json({ error: "Forbidden - Super admin access required" }, { status: 403 });
    }

    const id = params.id;
    // Find the user to resolve canonical userId used by auth relations
    const userDoc = await User.findOne({ $or: [ { id }, { _id: id } ] }).lean();
    if (!userDoc) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    const userId = (userDoc as any).id || (userDoc as any)._id?.toString();

    // Prevent deleting admin accounts (including super_admin) via this endpoint
    const targetIsAdmin = await Admin.findOne({ user_id: userId }).lean();
    if (targetIsAdmin) {
      return NextResponse.json({ error: "Cannot delete admin accounts via this endpoint" }, { status: 400 });
    }

    const db = mongoose.connection.db!;
    // Find vendor(s) for this user
    const vendors = await Vendor.find({ user_id: userId }).select({ _id: 1 }).lean();
    const vendorIds = vendors.map((v: any) => v._id?.toString());

    // Best-effort Cloudinary cleanup for each vendor's folder
    if (vendorIds.length) {
      try {
        const origin = new URL(_req.url).origin;
        await Promise.all(
          vendorIds.map((vid) =>
            fetch(`${origin}/api/cloudinary/delete-prefix`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ prefix: `vendors/${vid}` }),
              cache: 'no-store',
            }).catch(() => null)
          )
        );
      } catch {}
    }
    // Find requests for these vendors
    const requests = vendorIds.length ? await Request.find({ vendor_id: { $in: vendorIds } }).select({ _id: 1 }).lean() : [];
    const requestIds = requests.map((r: any) => r._id);
    // Delete related domain data
    const Category = (await import('@/lib/db/models/category')).default;
    const [requestItemsRes, requestsRes, productsRes, categoriesRes, vendorsRes] = await Promise.all([
      requestIds.length ? RequestItem.deleteMany({ request_id: { $in: requestIds } }) : { deletedCount: 0 } as any,
      requestIds.length ? Request.deleteMany({ _id: { $in: requestIds } }) : { deletedCount: 0 } as any,
      vendorIds.length ? Product.deleteMany({ vendor_id: { $in: vendorIds } }) : { deletedCount: 0 } as any,
      vendorIds.length ? Category.deleteMany({ vendor_id: { $in: vendorIds } }) : { deletedCount: 0 } as any,
      vendorIds.length ? Vendor.deleteMany({ _id: { $in: vendorIds } }) : { deletedCount: 0 } as any,
    ]);

    // Cascade delete related auth data
    const accountRes = await db.collection("account").deleteMany({ userId });
    const sessionRes = await db.collection("session").deleteMany({ userId });
    const or: any[] = [{ id: userId }];
    try {
      const asObjectId = new mongoose.Types.ObjectId(userId);
      or.push({ _id: asObjectId });
    } catch {}
    await db.collection("user").deleteOne({ $or: or });

    return NextResponse.json({ status: "ok", deleted: {
      accounts: accountRes.deletedCount,
      sessions: sessionRes.deletedCount,
      vendors: vendorsRes.deletedCount || 0,
      products: productsRes.deletedCount || 0,
      requests: requestsRes.deletedCount || 0,
      requestItems: requestItemsRes.deletedCount || 0,
      categories: categoriesRes.deletedCount || 0,
      userId
    } });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
