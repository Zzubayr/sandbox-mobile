export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/session";
import { connectToDatabase } from "@/lib/db/connection";
import Admin from "@/lib/db/models/admin";
import User from "@/lib/db/models/user";
import { Types } from "mongoose";

export async function GET(_request: NextRequest) {
  try {
    const { session } = await requireAdmin();
    await connectToDatabase();
    const me = await Admin.findOne({ user_id: session.user.id }).lean();
    if (!me || me.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden - Super admin access required' }, { status: 403 });
    }
    const admins = await Admin.find({}).sort({ created_at: -1 }).lean();
    const userIds: string[] = admins.map((a: any) => a.user_id);
    const objIds = userIds
      .filter((s) => typeof s === 'string' && /^[a-fA-F0-9]{24}$/.test(s))
      .map((s) => new Types.ObjectId(s));

    const users = await User.find(
      {
        $or: [
          { id: { $in: userIds } },
          { _id: { $in: userIds as any } },
          ...(objIds.length ? [{ _id: { $in: objIds as any } }] : []),
        ],
      },
      { id: 1, name: 1, email: 1 }
    ).lean();

    const vmap = new Map(
      users.map((v: any) => [v.id || (typeof v._id === 'string' ? v._id : v._id?.toString()), v])
    );
    const adminsWithUsers = admins.map((a: any) => ({
      ...a,
      id: a._id?.toString(),
      _id: undefined,
      user: { email: vmap.get(a.user_id)?.email || `${vmap.get(a.user_id)?.name || 'Unknown'} (No email)` }
    }));
    return NextResponse.json({ admins: adminsWithUsers });
  } catch (error) {
    console.error('Error in admins API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { session } = await requireAdmin();
    await connectToDatabase();
    const me = await Admin.findOne({ user_id: session.user.id }).lean();
    if (!me || me.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden - Super admin access required' }, { status: 403 });
    }

    const { userId, role } = await request.json();
    if (!userId || !role) {
      return NextResponse.json({ error: 'User ID and role are required' }, { status: 400 });
    }

    const maybeObjId = typeof userId === 'string' && /^[a-fA-F0-9]{24}$/.test(userId)
      ? new Types.ObjectId(userId)
      : null;
    const user = await User.findOne(
      {
        $or: [
          { id: userId },
          { _id: userId as any },
          ...(maybeObjId ? [{ _id: maybeObjId as any }] : []),
        ],
      },
      { id: 1, name: 1, email: 1 }
    ).lean();
    if (!user) {
      return NextResponse.json({ error: 'User not found ' }, { status: 400 });
    }
    const exists = await Admin.findOne({ user_id: userId }).lean();
    if (exists) {
      return NextResponse.json({ error: 'User is already an admin' }, { status: 400 });
    }

    const created = await Admin.create({ user_id: userId, role, permissions: {} });
    const adminWithUser = {
      ...created.toJSON(),
      id: created._id?.toString(),
      _id: undefined,
      user: { email: user.email || `${user.name} (No email)` },
    };
    return NextResponse.json({ admin: adminWithUser });
  } catch (error) {
    console.error('Error in create admin API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
