export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/session";
import { connectToDatabase } from "@/lib/db/connection";
import Vendor from "@/lib/db/models/vendor";
import { sendVendorApprovalEmail } from "@/lib/mail";

function shapeId<T extends { _id?: any }>(doc: T) {
if (!doc) return doc as any;
const { _id, ...rest } = doc as any;
return { ...rest, id: _id?.toString?.() };
}

export async function POST(
request: NextRequest,
{ params }: { params: { id: string } }
) {
try {
const { session } = await requireAdmin();
await connectToDatabase();

const { adminNotes } = (await request.json().catch(() => ({}))) as {
  adminNotes?: string;
};

const updated = await Vendor.findByIdAndUpdate(
  params.id,
  {
    approval_status: "approved",
    approved_at: new Date(),
    approved_by: session.user.id,
    admin_notes: adminNotes || null,
  },
  { new: true }
).lean();

if (!updated) {
  return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
}

const toEmail = updated.contact_email || updated.email;
sendVendorApprovalEmail({
  to: toEmail,
  storeName: updated.store_name,
}).catch((err) => console.error("Send approval email failed", err));

return NextResponse.json({ vendor: shapeId(updated) });
} catch (err) {
console.error("Approve vendor error:", err);
// If requireAdmin threw (no session or not admin), return 403
return NextResponse.json(
{ error: "Forbidden or server error" },
{ status: 403 }
);
}
}
