export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { connectToDatabase } from "@/lib/db/connection";
import Vendor from "@/lib/db/models/vendor";
import Request from "@/lib/db/models/request";

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { user } = await requireUser();
    await connectToDatabase();
    const vendor = await Vendor.findOne({ user_id: user.id }).lean();
    if (!vendor) return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    const { status } = await request.json();
    if (!['pending','completed','cancelled'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }
    const updated = await Request.findOneAndUpdate({ _id: params.id, vendor_id: vendor._id }, { status }, { new: true }).lean();
    if (!updated) return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

