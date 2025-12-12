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

export async function GET(request: NextRequest) {
  try {
    const { user } = await requireUser();
    await connectToDatabase();
    const vendor = await Vendor.findOne({ user_id: user.id }).lean();
    if (!vendor) return NextResponse.json({ products: [] });
    const includeArchived = request.nextUrl.searchParams.get("includeArchived") === "true";
    const prods = await Product.find({
      vendor_id: vendor._id,
      ...(includeArchived ? {} : { is_archived: { $ne: true } }),
    })
      .sort({ created_at: -1 })
      .lean();
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
      sku,
      compare_at_price,
      cost,
      stock_unit,
      safety_stock,
      reorder_point,
      allow_backorder,
      max_per_order,
      variants,
    } = body || {};

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    // Allow draft/minimal creation: default numbers when missing or invalid
    const safePrice = typeof price === 'number' && !Number.isNaN(price) ? price : 0;
    const safeStock = typeof stock === 'number' && !Number.isNaN(stock) ? Math.max(0, Math.floor(stock)) : 0;
    const safeCompareAt = typeof compare_at_price === 'number' && !Number.isNaN(compare_at_price) ? compare_at_price : undefined;
    const safeCost = typeof cost === 'number' && !Number.isNaN(cost) ? cost : undefined;
    const safeSafetyStock = typeof safety_stock === 'number' && !Number.isNaN(safety_stock) ? Math.max(0, Math.floor(safety_stock)) : 0;
    const safeReorderPoint = typeof reorder_point === 'number' && !Number.isNaN(reorder_point) ? Math.max(0, Math.floor(reorder_point)) : 0;
    const safeMaxPerOrder = typeof max_per_order === 'number' && max_per_order > 0 ? Math.floor(max_per_order) : 50;
    const normalizedVariants = Array.isArray(variants)
      ? variants
          .map((v: any) => ({
            id: typeof v?.id === 'string' ? v.id : undefined,
            sku: typeof v?.sku === 'string' ? v.sku.trim() : undefined,
            attributes: v?.attributes && typeof v.attributes === 'object' ? v.attributes : undefined,
            price: typeof v?.price === 'number' && !Number.isNaN(v.price) ? v.price : undefined,
            cost: typeof v?.cost === 'number' && !Number.isNaN(v.cost) ? v.cost : undefined,
            stock: typeof v?.stock === 'number' && !Number.isNaN(v.stock) ? Math.max(0, Math.floor(v.stock)) : 0,
            weight: typeof v?.weight === 'string' ? v.weight : undefined,
            images: Array.isArray(v?.images) ? v.images : [],
            status: ['active','inactive','draft'].includes(v?.status) ? v.status : 'active',
          }))
          .slice(0, 100)
      : [];

    const created = await Product.create({
      vendor_id: vendor._id,
      sku: typeof sku === 'string' ? sku.trim() : undefined,
      title,
      description: description || undefined,
      price: safePrice,
      compare_at_price: safeCompareAt,
      cost: safeCost,
      stock: safeStock,
      stock_unit: typeof stock_unit === 'string' ? stock_unit : 'units',
      safety_stock: safeSafetyStock,
      reorder_point: safeReorderPoint,
      allow_backorder: Boolean(allow_backorder),
      max_per_order: safeMaxPerOrder,
      category_id: category_id || undefined,
      images: Array.isArray(images) ? images : [],
      colors: Array.isArray(colors) ? colors : (Array.isArray(attributes?.colors) ? attributes.colors : []),
      sizes: Array.isArray(sizes) ? sizes : (Array.isArray(attributes?.sizes) ? attributes.sizes : []),
      weight: typeof weight === 'string' ? weight : (typeof attributes?.weight === 'string' ? attributes.weight : undefined),
      attributes: attributes || {},
      variants: normalizedVariants,
      status: status || 'draft',
    });

    // created.toJSON() already contains id via schema transform; do not re-shape
    return NextResponse.json({ product: created.toJSON() });
  } catch (err) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
