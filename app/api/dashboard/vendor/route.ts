export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { connectToDatabase } from "@/lib/db/connection";
import Vendor from "@/lib/db/models/vendor";
import { v2 as cloudinary } from 'cloudinary'
import { sendVendorWelcomeEmail } from "@/lib/mail";

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

function normalizeGallery(input: any): Array<{ url: string; public_id?: string }> | undefined {
  if (!Array.isArray(input)) return undefined;
  const mapped = input
    .map((item: any) => {
      if (typeof item === 'string') return { url: item };
      if (item && typeof item === 'object') return { url: String(item.url || ''), public_id: item.public_id };
      return null;
    })
    .filter((g: any) => g && typeof g.url === 'string' && g.url.trim().length > 0);
  // de-duplicate by public_id or url
  const seen = new Set<string>();
  const out: any[] = [];
  for (const g of mapped) {
    const key = (g.public_id && String(g.public_id)) || g.url;
    if (!seen.has(key)) {
      seen.add(key);
      out.push(g);
    }
  }
  // enforce max 15 items
  return out.slice(0, 15);
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
      tagline,
      location,
      address,
      placeId,
      components,
      business_categories,
      business_subcategories,
      // services-specific
      contact_email,
      business_hours,
      services_gallery,
      service_rates,
    } = body || {};

    if (!store_name || !theme_color) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    if (business_type && !['products', 'services'].includes(business_type)) {
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
      tagline: tagline || undefined,
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
      contact_email: typeof contact_email === 'string' ? contact_email : undefined,
      business_hours: Array.isArray(business_hours) ? business_hours : undefined,
      services_gallery: normalizeGallery(services_gallery),
      service_rates: Array.isArray(service_rates) ? service_rates : undefined,
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

    const toEmail = created.contact_email || created.email;
    sendVendorWelcomeEmail({
      to: toEmail,
      storeName: created.store_name,
      businessType: created.business_type || 'products',
    }).catch((err) => console.error("Send welcome email failed", err));

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
      "tagline",
      "facebook",
      "instagram",
      "twitter",
      "linkedin",
      "whatsapp",
      // services-specific simple fields
      "contact_email",
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
    if ('business_type' in update && !['products', 'services'].includes(update.business_type)) {
      delete update.business_type;
    }
    // Location fields
    if ('location' in body && isValidGeoPoint(body.location)) update.location = body.location;
    if ('address' in body && typeof body.address === 'string') update.address = body.address;
    if ('placeId' in body && typeof body.placeId === 'string') update.placeId = body.placeId;
    if ('components' in body && body.components && typeof body.components === 'object') update.components = body.components;
    // Arrays for services
    if ('business_hours' in body && Array.isArray(body.business_hours)) update.business_hours = body.business_hours;
    if ('services_gallery' in body) {
      const normalized = normalizeGallery(body.services_gallery);
      console.log('Gallery normalization:', { input: body.services_gallery, output: normalized });
      update.services_gallery = normalized;
    }
    if ('service_rates' in body && Array.isArray(body.service_rates)) update.service_rates = body.service_rates;
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
    // If client provided deleted_image_ids, attempt to delete them in Cloudinary in one go
    if (Array.isArray(body.deleted_image_ids) && body.deleted_image_ids.length > 0) {
      try {
        const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env as any
        if (CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET) {
          cloudinary.config({ cloud_name: CLOUDINARY_CLOUD_NAME, api_key: CLOUDINARY_API_KEY, api_secret: CLOUDINARY_API_SECRET })
          await cloudinary.api.delete_resources(body.deleted_image_ids)
        }
      } catch (e) {
        console.error('Cloudinary bulk delete (vendor gallery) error:', e)
        // Continue even if deletion fails; DB will still update services_gallery array
      }
    }

    // Build Mongo update with $set/$unset to avoid replacement semantics
    update.updated_at = new Date();
    const $set: Record<string, any> = {}
    const $unset: Record<string, any> = {}
    for (const [k, v] of Object.entries(update)) {
      if (v === undefined) $unset[k] = ""; else $set[k] = v
    }
    const mongoUpdate: any = {}
    if (Object.keys($set).length) mongoUpdate.$set = $set
    if (Object.keys($unset).length) mongoUpdate.$unset = $unset

    // Apply update then read fresh to avoid any edge cases with return doc
    await Vendor.updateOne({ user_id: user.id }, mongoUpdate);
    const updated = await Vendor.findOne({ user_id: user.id }).lean();
    if (!updated) return NextResponse.json({ error: "Vendor not found" }, { status: 404 });

    if ('services_gallery' in update) {
      console.log('Gallery saved to DB (length):', Array.isArray((updated as any).services_gallery) ? (updated as any).services_gallery.length : 'undefined');
    }

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
