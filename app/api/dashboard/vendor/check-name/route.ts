export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { connectToDatabase } from "@/lib/db/connection";
import Vendor from "@/lib/db/models/vendor";

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function GET(request: NextRequest) {
  try {
    await requireUser();
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const name = (searchParams.get("name") || "").trim();
    if (!name) return NextResponse.json({ available: false, error: 'Name is required' }, { status: 400 });
    const exists = await Vendor.exists({
      store_name: { $regex: new RegExp(`^${escapeRegExp(name)}$`, 'i') },
    });
    return NextResponse.json({ available: !exists });
  } catch {
    return NextResponse.json({ available: false }, { status: 200 });
  }
}

