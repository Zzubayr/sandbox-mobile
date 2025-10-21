export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { connectToDatabase } from "@/lib/db/connection";
import Vendor from "@/lib/db/models/vendor";
import Product from "@/lib/db/models/product";

function shapeId<T extends { _id?: any }>(doc: T) {
  if (!doc) return doc as any;
  const { _id, ...rest } = doc as any;
  return { ...rest, id: _id?.toString?.() };
}

export async function GET() {
  try {
    const { user } = await requireUser();
    await connectToDatabase();
    const vendor = await Vendor.findOne({ user_id: user.id }).lean();
    if (!vendor) return NextResponse.json({ products: [] });
    const prods = await Product.find({ vendor_id: vendor._id }).sort({ created_at: -1 }).lean();
    return NextResponse.json({ products: prods.map(shapeId) });
  } catch (err) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user } = await requireUser();
    await connectToDatabase();
    const vendor = await Vendor.findOne({ user_id: user.id }).lean();
    if (!vendor) return NextResponse.json({ error: "Vendor not found" }, { status: 404 });

    const body = await request.json();
    const {
      title,
      description,
      price,
      stock,
      category_id,
      images,
      colors,
      sizes,
      weight,
      attributes,
      status,
    } = body || {};

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    // Allow draft/minimal creation: default numbers when missing or invalid
    const safePrice = typeof price === 'number' && !Number.isNaN(price) ? price : 0;
    const safeStock = typeof stock === 'number' && !Number.isNaN(stock) ? stock : 0;

    const created = await Product.create({
      vendor_id: vendor._id,
      title,
      description: description || undefined,
      price: safePrice,
      stock: safeStock,
      category_id: category_id || undefined,
      images: Array.isArray(images) ? images : [],
      colors: Array.isArray(colors) ? colors : (Array.isArray(attributes?.colors) ? attributes.colors : []),
      sizes: Array.isArray(sizes) ? sizes : (Array.isArray(attributes?.sizes) ? attributes.sizes : []),
      weight: typeof weight === 'string' ? weight : (typeof attributes?.weight === 'string' ? attributes.weight : undefined),
      attributes: attributes || {},
      status: status || 'draft',
    });

    // created.toJSON() already contains id via schema transform; do not re-shape
    return NextResponse.json({ product: created.toJSON() });
  } catch (err) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
