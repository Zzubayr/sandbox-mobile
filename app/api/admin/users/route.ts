export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/session";
import { connectToDatabase } from "@/lib/db/connection";
import Admin from "@/lib/db/models/admin";
import User from "@/lib/db/models/user";

export async function GET(_request: NextRequest) {
  try {
    const { session } = await requireAdmin();
    await connectToDatabase();

    // Only allow super_admin to see this list
    const adminDoc = await Admin.findOne({ user_id: session.user.id }).lean();
    if (!adminDoc || adminDoc.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden - Super admin access required' }, { status: 403 });
    }

    const [usersr, adminUsers] = await Promise.all([
      User.find({}).sort({ _id: -1 }).select({ id: 1, name: 1, email: 1, store_name: 1 }).lean(),
      Admin.find({}).select({ user_id: 1 }).lean(),
    ]);

    const adminSet = new Set((adminUsers || []).map((a: any) => a.user_id));
    const users = (usersr || [])
      .map((u: any) => ({
        id: u.id || (typeof u._id === 'string' ? u._id : u._id?.toString()),
        email: u.email || 'Unknown',
        store_name: u.store_name,
      }))
      .filter((u: any) => u.id && !adminSet.has(u.id));

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Error in users API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
