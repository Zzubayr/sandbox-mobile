export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/session";
import { connectToDatabase } from "@/lib/db/connection";
import Vendor from "@/lib/db/models/vendor";
import Product from "@/lib/db/models/product";
import Request from "@/lib/db/models/request";

export async function GET() {
  try {
    await requireAdmin();
    await connectToDatabase();

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalVendors,
      pendingVendors,
      approvedVendors,
      rejectedVendors,
      activeVendors,
      totalProducts,
      activeProducts,
      totalRequests,
      pendingRequests,
      completedRequests,
      recentVendors,
      recentProducts,
      recentRequests,
    ] = await Promise.all([
      Vendor.countDocuments({}),
      Vendor.countDocuments({ approval_status: "pending" }),
      Vendor.countDocuments({ approval_status: "approved" }),
      Vendor.countDocuments({ approval_status: "rejected" }),
      Vendor.countDocuments({ is_active: true, approval_status: "approved" }),
      Product.countDocuments({}),
      Product.countDocuments({ status: "active" }),
      Request.countDocuments({}),
      Request.countDocuments({ status: "pending" }),
      Request.countDocuments({ status: "completed" }),
      Vendor.countDocuments({ created_at: { $gte: sevenDaysAgo } }),
      Product.countDocuments({ created_at: { $gte: sevenDaysAgo } }),
      Request.countDocuments({ created_at: { $gte: sevenDaysAgo } }),
    ]);

    const stats = {
      vendors: {
        total: totalVendors,
        pending: pendingVendors,
        approved: approvedVendors,
        rejected: rejectedVendors,
        active: activeVendors,
      },
      products: {
        total: totalProducts,
        active: activeProducts,
      },
      requests: {
        total: totalRequests,
        pending: pendingRequests,
        completed: completedRequests,
      },
      recentActivity: {
        vendors: recentVendors,
        products: recentProducts,
        requests: recentRequests,
      },
    };

    return NextResponse.json({ stats });
  } catch (error) {
    console.error("Admin stats API error:", error);
    return NextResponse.json({ error: "Forbidden or server error" }, { status: 403 });
  }
}
