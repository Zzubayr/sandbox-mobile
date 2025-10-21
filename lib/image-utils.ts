export type ImageLike =
  | string
  | { url?: string | null; secure_url?: string | null; src?: string | null }

export function toImageUrl(img: ImageLike | null | undefined): string {
  if (!img) return ""
  if (typeof img === 'string') return img
  return img.url || img.secure_url || img.src || ""
}

