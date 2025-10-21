export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { connectToDatabase } from "@/lib/db/connection";
import Vendor from "@/lib/db/models/vendor";
import Category from "@/lib/db/models/category";

function ensureOwned(category: any, vendorId: any) {
  return category && category.vendor_id?.toString() === vendorId.toString();
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { user } = await requireUser();
    await connectToDatabase();
    const vendor = await Vendor.findOne({ user_id: user.id }).lean();
    if (!vendor) return NextResponse.json({ error: "Vendor not found" }, { status: 404 });

    const { name } = await request.json();
    if (!name || typeof name !== 'string') return NextResponse.json({ error: 'Invalid name' }, { status: 400 });
    const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

    const existing = await Category.findById(params.id).lean();
    if (!ensureOwned(existing, vendor._id)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const updated = await Category.findByIdAndUpdate(
      params.id,
      { name: name.trim(), slug },
      { new: true }
    ).lean();
    return NextResponse.json({ category: { ...updated, id: updated?._id?.toString() } });
  } catch (err) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { user } = await requireUser();
    await connectToDatabase();
    const vendor = await Vendor.findOne({ user_id: user.id }).lean();
    if (!vendor) return NextResponse.json({ error: "Vendor not found" }, { status: 404 });

    const existing = await Category.findById(params.id).lean();
    if (!ensureOwned(existing, vendor._id)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    await Category.findByIdAndDelete(params.id);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

