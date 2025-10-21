export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/connection";
import Vendor from "@/lib/db/models/vendor";
import Product from "@/lib/db/models/product";
import Category from "@/lib/db/models/category";

function shapeId<T extends { _id?: any }>(doc: T) {
  if (!doc) return doc as any;
  const { _id, ...rest } = doc as any;
  return { ...rest, id: _id?.toString?.() };
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { slug: string; productId: string } }
) {
  try {
    await connectToDatabase();
    const vendorDoc = await Vendor.findOne({ store_slug: params.slug, is_active: true }).lean();
    if (!vendorDoc) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const productDoc = await Product.findOne({ _id: params.productId, vendor_id: vendorDoc._id, status: "active" }).lean();
    if (!productDoc) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    let categoryInfo: { name: string } | undefined;
    if (productDoc.category_id) {
      const cat = await Category.findById(productDoc.category_id).select({ name: 1 }).lean();
      if (cat) categoryInfo = { name: cat.name } as any;
    }

    const vendor = shapeId(vendorDoc);
    const shaped = shapeId(productDoc) as any;
    const mergedAttrs = { ...(shaped.attributes || {}) };
    if (Array.isArray(shaped.colors) && shaped.colors.length) mergedAttrs.colors = shaped.colors;
    if (Array.isArray(shaped.sizes) && shaped.sizes.length) mergedAttrs.sizes = shaped.sizes;
    if (typeof shaped.weight === 'string' && shaped.weight) mergedAttrs.weight = shaped.weight;
    const product = { ...shaped, attributes: mergedAttrs, ...(categoryInfo ? { category: categoryInfo } : {}) };
    return NextResponse.json({ vendor, product });
  } catch (err) {
    console.error("Get product error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
