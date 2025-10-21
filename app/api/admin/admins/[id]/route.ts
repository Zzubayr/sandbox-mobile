export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/session";
import { connectToDatabase } from "@/lib/db/connection";
import Admin from "@/lib/db/models/admin";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { session } = await requireAdmin();
    await connectToDatabase();
    const me = await Admin.findOne({ user_id: session.user.id }).lean();
    if (!me || me.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden - Super admin access required' }, { status: 403 });
    }

    const adminToDelete = await Admin.findById(params.id).lean();
    if (!adminToDelete) return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
    if (adminToDelete.user_id === session.user.id) {
      return NextResponse.json({ error: 'Cannot delete your own admin account' }, { status: 400 });
    }

    await Admin.findByIdAndDelete(params.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in delete admin API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
