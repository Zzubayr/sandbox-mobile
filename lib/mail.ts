import { Resend } from "resend"

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null
const mailFrom = process.env.MAIL_FROM || "Ummah Square <no-reply@ummahsquare.com>"

function getBaseUrl() {
  const fromEnv =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.BETTER_AUTH_URL ||
    process.env.SITE_URL
  if (fromEnv) return fromEnv.replace(/\/$/, "")
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return "http://localhost:3000"
}

async function sendMail(to: string | string[], subject: string, html: string) {
  if (!resend) {
    console.warn("[mail] RESEND_API_KEY is not set; email skipped", { to, subject })
    return
  }
  try {
    await resend.emails.send({
      from: mailFrom,
      to,
      subject,
      html,
    })
  } catch (err) {
    console.error("[mail] Failed to send email", { to, subject, err })
  }
}

export async function sendVendorWelcomeEmail({
  to,
  storeName,
  businessType = "products",
}: {
  to?: string | null
  storeName: string
  businessType?: "products" | "services"
}) {
  if (!to) return
  const dashboardLink = `${getBaseUrl()}/dashboard`
  const settingsLink = `${getBaseUrl()}/dashboard/settings`
  const addLink =
    businessType === "services"
      ? `${getBaseUrl()}/dashboard/rates`
      : `${getBaseUrl()}/dashboard/products/new`
  const addLabel = businessType === "services" ? "add your first service" : "add your first product"
  const subject = `Welcome to Ummah Square, ${storeName}!`
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6">
      <h2 style="margin: 0 0 12px;">Assalamu Alaikum ${storeName}, welcome aboard!</h2>
      <p>Your vendor profile has been created. To get approved faster, please:</p>
      <ol style="padding-left:20px; margin: 8px 0 12px;">
        <li>Upload your business logo and banner in <a href="${settingsLink}">Settings</a>.</li>
        <li>Visit your dashboard and ${addLabel}.</li>
      </ol>
      <p>Once these are in place, our team will review and approve your business.</p>
      <p>
        <a href="${dashboardLink}" style="background:#0f172a;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none;">Go to your dashboard</a>
      </p>
      <p style="margin-top:16px;">Need help? Reply to this email and our team will assist you.</p>
    </div>
  `
  await sendMail(to, subject, html)
}

export async function sendRequestNotificationEmail({
  to,
  storeName,
  requestId,
  customerName,
  customerPhone,
  customerNote,
  items,
  total,
}: {
  to?: string | null
  storeName: string
  requestId: string
  customerName: string
  customerPhone: string
  customerNote?: string | null
  items: Array<{ name: string; quantity: number; price: number }>
  total: number
}) {
  if (!to) return
  const requestLink = `${getBaseUrl()}/dashboard/requests/${requestId}`
  const itemsHtml = items
    .map(
      (it) =>
        `<li><strong>${it.name}</strong> — Qty: ${it.quantity} • Price: ${it.price}</li>`
    )
    .join("")

  const subject = `New request from ${customerName} for ${storeName}`
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6">
      <h2 style="margin:0 0 12px;">You received a new request</h2>
      <p><strong>Customer:</strong> ${customerName}</p>
      <p><strong>Phone:</strong> ${customerPhone}</p>
      ${customerNote ? `<p><strong>Note:</strong> ${customerNote}</p>` : ""}
      <p><strong>Items:</strong></p>
      <ul>${itemsHtml}</ul>
      <p><strong>Total:</strong> ${total}</p>
      <p>
        <a href="${requestLink}" style="background:#0f172a;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none;">View request</a>
      </p>
    </div>
  `
  await sendMail(to, subject, html)
}

export async function sendVendorApprovalEmail({
  to,
  storeName,
}: {
  to?: string | null
  storeName: string
}) {
  if (!to) return
  const dashboardLink = `${getBaseUrl()}/dashboard`
  const subject = `${storeName} has been approved`
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6">
      <h2 style="margin:0 0 12px;">Great news, ${storeName}!</h2>
      <p>Your business has been approved. You can now start selling and responding to customer requests.</p>
      <p>
        <a href="${dashboardLink}" style="background:#0f172a;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none;">Open dashboard</a>
      </p>
    </div>
  `
  await sendMail(to, subject, html)
}
