export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/session';
import { connectToDatabase } from '@/lib/db/connection';
import Admin from '@/lib/db/models/admin';

export async function GET() {
const { user } = await requireUser();
await connectToDatabase();
const admin = await Admin.findOne({ user_id: user.id }).lean();
const role = admin?.role ?? null;
return NextResponse.json({ role });
}