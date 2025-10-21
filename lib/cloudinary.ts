// Client-side Cloudinary helpers

// Legacy helper used by existing UI: uploads to local preview endpoint
export async function uploadImage(file: File, folder: string = 'sandbox'): Promise<string> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('folder', folder)

  const response = await fetch('/api/upload', { method: 'POST', body: formData })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || 'Failed to upload image')
  }
  const data = await response.json()
  return data.url
}

// Direct unsigned upload to Cloudinary returning url and public_id
export async function uploadImageWithMeta(
  file: File,
  folder: string,
  publicId?: string,
): Promise<{ url: string; public_id: string }> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET
  if (!cloudName || !uploadPreset) {
    throw new Error('Cloudinary configuration missing on client')
  }

  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', String(uploadPreset))
  if (folder) formData.append('folder', folder)
  const inferred = typeof publicId === 'string' ? publicId : (file && file.name ? file.name.replace(/\.[^/.]+$/, '') : undefined)
  if (inferred) formData.append('public_id', inferred)

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: 'POST',
    body: formData,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error?.message || 'Cloudinary upload failed')
  }
  const json = await res.json()
  return { url: json.secure_url || json.url, public_id: json.public_id }
}

// Delete single asset by public_id or URL (URL will be converted to public_id)
export async function deleteImage(publicIdOrUrl: string): Promise<void> {
  const id = publicIdOrUrl.includes('/') ? extractPublicId(publicIdOrUrl) ?? publicIdOrUrl : publicIdOrUrl
  const response = await fetch('/api/cloudinary/delete', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ public_id: id }),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || 'Failed to delete image')
  }
}

// Delete many by prefix (e.g., vendors/{vendorId}/products/{productId})
export async function deleteByPrefix(prefix: string): Promise<void> {
  const res = await fetch('/api/cloudinary/delete-prefix', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prefix }),
  })
  if (!res.ok) {
    const error = await res.json().catch(() => ({}))
    throw new Error(error.error || 'Failed to delete by prefix')
  }
}

// Build an optimized Cloudinary URL from an existing Cloudinary URL
export function getOptimizedImageUrl(
  url: string,
  _options: {
    width?: number
    height?: number
    quality?: string | number
    format?: string
    crop?: string
    fetch_format?: string
    flags?: string
    transformation?: string
  } = {}
): string {
  // Disable all transformation/processing. Return the original URL unchanged.
  return url
}

// Extract public_id from a Cloudinary URL; returns null if not found
export function extractPublicId(url: string): string | null {
  try {
    const u = new URL(url)
    const parts = u.pathname.split('/')
    const vIndex = parts.findIndex((p) => /^v\d+$/i.test(p))
    const after = vIndex >= 0 ? parts.slice(vIndex + 1) : parts.slice(4)
    if (after.length === 0) return null
    const last = after[after.length - 1]
    const withoutExt = last.replace(/\.[a-zA-Z0-9]+$/, '')
    const path = [...after.slice(0, -1), withoutExt].join('/')
    return path || null
  } catch {
    return url.includes('/') ? null : url
  }
}
