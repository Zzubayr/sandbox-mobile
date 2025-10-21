export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/connection';
import Vendor from '@/lib/db/models/vendor';

export async function GET() {
await connectToDatabase();
const count = await Vendor.countDocuments();
return NextResponse.json({ ok: true, count });
}