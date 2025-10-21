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

export async function DELETE(request: NextRequest) {
  try {
    const { public_id } = await request.json()
    if (!public_id || typeof public_id !== 'string') {
      return NextResponse.json({ error: 'public_id is required' }, { status: 400 })
    }
    ensureConfigured()
    const result = await cloudinary.uploader.destroy(public_id, { invalidate: true })
    if (result.result !== 'ok' && result.result !== 'not found') {
      return NextResponse.json({ error: 'Cloudinary deletion failed', details: result }, { status: 500 })
    }
    return NextResponse.json({ success: true, result })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

