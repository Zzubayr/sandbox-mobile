export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { v2 as cloudinary } from 'cloudinary'

function ensureConfigured() {
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    throw new Error('Cloudinary server credentials are not configured')
  }
  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
  })
}

export async function POST(request: NextRequest) {
  try {
    const { prefix } = await request.json()
    if (!prefix || typeof prefix !== 'string') {
      return NextResponse.json({ error: 'prefix is required' }, { status: 400 })
    }
    ensureConfigured()

    // Delete resources by prefix; iterate through pages if needed
    // Cloudinary API may require pagination; for simplicity, call admin delete and ignore folder deletion errors
    const del = await cloudinary.api.delete_resources_by_prefix(prefix)

    // Try to remove folders (best effort)
    try {
      await cloudinary.api.delete_folder(prefix)
    } catch {}

    return NextResponse.json({ success: true, result: del })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

