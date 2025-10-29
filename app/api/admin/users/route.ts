export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/session";
import { connectToDatabase } from "@/lib/db/connection";
import Admin from "@/lib/db/models/admin";
import User from "@/lib/db/models/user";

export async function GET(request: NextRequest) {
  try {
    const { session } = await requireAdmin();
    await connectToDatabase();

    // Only allow super_admin to see this list
    const adminDoc = await Admin.findOne({ user_id: session.user.id }).lean();
    if (!adminDoc || adminDoc.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden - Super admin access required' }, { status: 403 });
    }

    const q = request.nextUrl.searchParams.get('q')?.trim() || '';

    const [usersr, adminUsers] = await Promise.all([
      User.find({}).sort({ _id: -1 }).select({ id: 1, email: 1 }).lean(),
      Admin.find({}).select({ user_id: 1 }).lean(),
    ]);

    const adminSet = new Set((adminUsers || []).map((a: any) => a.user_id));
    const baseUsers = (usersr || [])
      .map((u: any) => ({
        id: u.id || (typeof u._id === 'string' ? u._id : u._id?.toString()),
        email: u.email || 'Unknown',
      }))
      .filter((u: any) => u.id && !adminSet.has(u.id));

    // Attach store_name from Vendor if present
    const ids = baseUsers.map((u) => u.id);
    const Vendor = (await import('@/lib/db/models/vendor')).default;
    const vendors = await Vendor.find({ user_id: { $in: ids } }).select({ user_id: 1, store_name: 1 }).lean();
    const storeByUser: Record<string, string> = {};
    for (const v of vendors || []) {
      storeByUser[(v as any).user_id] = (v as any).store_name;
    }

    let users = baseUsers.map((u) => ({ ...u, store_name: storeByUser[u.id] }));
    if (q) {
      const qLower = q.toLowerCase();
      users = users.filter((u) => (u.email?.toLowerCase().includes(qLower) || u.store_name?.toLowerCase().includes(qLower)));
    }

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Error in users API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
