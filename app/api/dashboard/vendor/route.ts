export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { connectToDatabase } from "@/lib/db/connection";
import Vendor from "@/lib/db/models/vendor";

function shapeId<T extends { _id?: any }>(doc: T) {
  if (!doc) return doc as any;
  const { _id, ...rest } = doc as any;
  return { ...rest, id: _id?.toString?.() };
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function slugify(input: string): string {
  const base = (input || "store")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return base || "store";
}

async function generateUniqueSlug(baseSlug: string): Promise<string> {
  let candidate = baseSlug;
  let i = 1;
  while (await Vendor.exists({ store_slug: candidate })) {
    i += 1;
    candidate = `${baseSlug}-${i}`;
  }
  return candidate;
}

function isValidGeoPoint(input: any): input is { type: 'Point'; coordinates: [number, number] } {
  if (!input || input.type !== 'Point' || !Array.isArray(input.coordinates) || input.coordinates.length !== 2) return false;
  const [lng, lat] = input.coordinates;
  return Number.isFinite(lng) && Number.isFinite(lat);
}

export async function GET() {
  try {
    const { user } = await requireUser();
    await connectToDatabase();
    const vendor = await Vendor.findOne({ user_id: user.id }).lean();
    return NextResponse.json({ vendor: vendor ? shapeId(vendor) : null });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user } = await requireUser();
    await connectToDatabase();
    const body = await request.json();
    const {
      store_name,
      business_type,
      description,
      whatsapp_number,
      facebook,
      instagram,
      twitter,
      linkedin,
      whatsapp,
      theme_color,
      logo_url,
      banner_url,
      logo,
      banner,
      store_slug,
      location,
      address,
      placeId,
      components,
      business_categories,
      business_subcategories,
    } = body || {};

    if (!store_name || !theme_color) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    if (business_type && !['products','services'].includes(business_type)) {
      return NextResponse.json({ error: "Invalid business type" }, { status: 400 });
    }

    const existing = await Vendor.findOne({ user_id: user.id }).lean();
    if (existing) {
      return NextResponse.json({ error: "Vendor already exists" }, { status: 400 });
    }

    // Enforce unique business name (case-insensitive)
    const nameToCheck = (store_name || "").trim();
    if (!nameToCheck) {
      return NextResponse.json({ error: "Store name is required" }, { status: 400 });
    }
    const nameExists = await Vendor.exists({
      store_name: { $regex: new RegExp(`^${escapeRegExp(nameToCheck)}$`, 'i') },
    });
    if (nameExists) {
      return NextResponse.json({ error: "Business name is already taken" }, { status: 409 });
    }

    // Ensure a unique slug, even if client provided one
    const baseSlug = slugify(store_slug || store_name);
    const uniqueSlug = await generateUniqueSlug(baseSlug);

    // sanitize categories
    const sanitizeStrArray = (val: any): string[] | undefined => {
      if (!Array.isArray(val)) return undefined
      const out = val
        .filter((v) => typeof v === 'string')
        .map((v) => v.trim())
        .filter(Boolean)
      return out.length ? Array.from(new Set(out)) : undefined
    }

    const created = await Vendor.create({
      user_id: user.id,
      email: (user as any).email || undefined,
      store_name,
      store_slug: uniqueSlug,
      business_type: business_type || 'products',
      description: description || undefined,
      whatsapp_number: whatsapp_number || undefined,
      theme_color,
      logo_url: logo_url || undefined,
      banner_url: banner_url || undefined,
      logo: logo || undefined,
      banner: banner || undefined,
      location: isValidGeoPoint(location) ? location : undefined,
      address: typeof address === 'string' ? address : undefined,
      placeId: typeof placeId === 'string' ? placeId : undefined,
      components: components && typeof components === 'object' ? components : undefined,
      // social links
      facebook: typeof facebook === 'string' ? facebook : undefined,
      instagram: typeof instagram === 'string' ? instagram : undefined,
      twitter: typeof twitter === 'string' ? twitter : undefined,
      linkedin: typeof linkedin === 'string' ? linkedin : undefined,
      whatsapp: typeof whatsapp === 'string' ? whatsapp : undefined,
      business_categories: sanitizeStrArray(business_categories ?? body?.categories),
      business_subcategories: sanitizeStrArray(business_subcategories ?? body?.subcategories),
      is_active: true,
    });
    return NextResponse.json({ vendor: shapeId(created.toJSON()) });
  } catch (err: any) {
    if (err && typeof err.message === 'string' && err.message.toLowerCase().includes('unauthorized')) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (err?.code === 11000 && err?.keyPattern?.store_slug) {
      return NextResponse.json({ error: "Store slug already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { user } = await requireUser();
    await connectToDatabase();
    const body = await request.json();
    const update: any = {};
    const optionalTextFields = ['description', 'facebook', 'instagram', 'twitter', 'linkedin', 'whatsapp'];
    for (const key of [
      "store_name",
      "business_type",
      "description",
      "whatsapp_number",
      "facebook",
      "instagram",
      "twitter",
      "linkedin",
      "whatsapp",
      "theme_color",
      "logo_url",
      "banner_url",
      "logo",
      "banner",
      "store_slug",
      "facebook",
      "instagram",
      "twitter",
      "linkedin",
      "whatsapp",
    ]) {
      if (key in body) {
        // For optional text fields, convert empty strings to undefined
        if (optionalTextFields.includes(key)) {
          update[key] = body[key] || undefined;
        } else {
          update[key] = body[key];
        }
      }
    }
    const normArr = (arr: any) => Array.isArray(arr) ? Array.from(new Set(arr.filter((v: any) => typeof v === 'string').map((s: string) => s.trim()).filter(Boolean))) : undefined
    if ('business_categories' in body || 'categories' in body) {
      const cat = normArr(body.business_categories ?? body.categories)
      if (cat && cat.length) update.business_categories = cat; else if (Array.isArray(body.business_categories) || Array.isArray(body.categories)) update.business_categories = undefined
    }
    if ('business_subcategories' in body || 'subcategories' in body) {
      const sub = normArr(body.business_subcategories ?? body.subcategories)
      if (sub && sub.length) update.business_subcategories = sub; else if (Array.isArray(body.business_subcategories) || Array.isArray(body.subcategories)) update.business_subcategories = undefined
    }
    if ('business_type' in update && !['products','services'].includes(update.business_type)) {
      delete update.business_type;
    }
    // Location fields
    if ('location' in body && isValidGeoPoint(body.location)) update.location = body.location;
    if ('address' in body && typeof body.address === 'string') update.address = body.address;
    if ('placeId' in body && typeof body.placeId === 'string') update.placeId = body.placeId;
    if ('components' in body && body.components && typeof body.components === 'object') update.components = body.components;
    // Backfill email from session if not provided
    if (!('email' in body)) {
      update.email = (user as any).email || undefined;
    }
    // If updating slug, ensure it is unique (excluding my own doc)
    if (typeof update.store_slug === 'string' && update.store_slug.trim() !== '') {
      const base = slugify(update.store_slug);
      let candidate = base;
      let i = 1;
      while (await Vendor.exists({ store_slug: candidate, user_id: { $ne: user.id } })) {
        i += 1;
        candidate = `${base}-${i}`;
      }
      update.store_slug = candidate;
    }

    // If updating name, enforce uniqueness among other vendors (case-insensitive)
    if (typeof update.store_name === 'string' && update.store_name.trim() !== '') {
      const name = update.store_name.trim();
      const taken = await Vendor.exists({
        store_name: { $regex: new RegExp(`^${escapeRegExp(name)}$`, 'i') },
        user_id: { $ne: user.id },
      });
      if (taken) {
        return NextResponse.json({ error: "Business name is already taken" }, { status: 409 });
      }
    }
    update.updated_at = new Date();
    const updated = await Vendor.findOneAndUpdate({ user_id: user.id }, update, { new: true }).lean();
    if (!updated) return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
    return NextResponse.json({ vendor: shapeId(updated) });
  } catch (err: any) {
    if (err && typeof err.message === 'string' && err.message.toLowerCase().includes('unauthorized')) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (err?.code === 11000 && err?.keyPattern?.store_slug) {
      return NextResponse.json({ error: "Store slug already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
