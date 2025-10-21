export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from 'cloudinary'
import { requireUser } from "@/lib/auth/session";
import { connectToDatabase } from "@/lib/db/connection";
import Vendor from "@/lib/db/models/vendor";
import Product from "@/lib/db/models/product";

function ensureOwned(product: any, vendorId: any) {
  return product && product.vendor_id?.toString() === vendorId.toString();
}

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { user } = await requireUser();
    await connectToDatabase();
    const vendor = await Vendor.findOne({ user_id: user.id }).lean();
    if (!vendor) return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
    const existing = await Product.findById(params.id);
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (!ensureOwned(existing, vendor._id)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const product = existing.toJSON();
    return NextResponse.json({ product });
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
    const existing = await Product.findById(params.id).lean();
    if (!ensureOwned(existing, vendor._id)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    try {
      const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env
      if (CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET) {
        cloudinary.config({ cloud_name: CLOUDINARY_CLOUD_NAME, api_key: CLOUDINARY_API_KEY, api_secret: CLOUDINARY_API_SECRET })
        const prefix = `vendors/${vendor._id.toString()}/products/${params.id}`
        await cloudinary.api.delete_resources_by_prefix(prefix)
        try { await cloudinary.api.delete_folder(prefix) } catch {}
      }
    } catch {}
    await Product.findByIdAndDelete(params.id);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { user } = await requireUser();
    await connectToDatabase();
    const vendor = await Vendor.findOne({ user_id: user.id }).lean();
    if (!vendor) return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
    const existing = await Product.findById(params.id).lean();
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (!ensureOwned(existing, vendor._id)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const body = await request.json();
    // Back-compat: allow status-only updates
    if (Object.keys(body).length === 1 && 'status' in body) {
      const { status } = body;
      if (!['active','inactive','draft'].includes(status)) return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
      const updated = await Product.findByIdAndUpdate(params.id, { status }, { new: true }).lean();
      return NextResponse.json({ product: { ...updated, id: updated?._id?.toString() } });
    }

    // General update path used by the edit page
    const update: any = {};
    for (const key of ['title','description','price','stock','category_id','images','attributes','status','colors','sizes','weight']) {
      if (key in body) update[key] = body[key];
    }
    if ('category_id' in update && (!update.category_id || update.category_id === '')) update.category_id = undefined;
    if ('description' in update && (update.description === null || update.description === '')) update.description = undefined;
    if ('status' in update && !['active','inactive','draft'].includes(update.status)) return NextResponse.json({ error: 'Invalid status' }, { status: 400 });

    // If client provided deleted_image_ids, attempt to delete them in Cloudinary in one go
    if (Array.isArray(body.deleted_image_ids) && body.deleted_image_ids.length > 0) {
      try {
        const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env
        if (CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET) {
          cloudinary.config({ cloud_name: CLOUDINARY_CLOUD_NAME, api_key: CLOUDINARY_API_KEY, api_secret: CLOUDINARY_API_SECRET })
          // Use admin API to delete multiple by public_ids
          await cloudinary.api.delete_resources(body.deleted_image_ids)
        }
      } catch (e) {
        console.error('Cloudinary bulk delete error:', e)
        // Continue even if deletion fails; DB will still update images array
      }
    }

    try {
      const updated = await Product.findByIdAndUpdate(params.id, update, { new: true }).lean();
      if (!updated) return NextResponse.json({ error: 'Update failed' }, { status: 500 });
      return NextResponse.json({ product: { ...updated, id: updated?._id?.toString() } });
    } catch (e: any) {
      console.error('Product update error:', e)
      const message = e?.message || 'Update error'
      return NextResponse.json({ error: message }, { status: 400 });
    }
  } catch (err) {
    console.error('PATCH auth/db error:', err)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function PUT(request: NextRequest, ctx: { params: { id: string } }) {
  // Alias to the general update logic for clients preferring PUT
  return PATCH(request, ctx as any);
}
