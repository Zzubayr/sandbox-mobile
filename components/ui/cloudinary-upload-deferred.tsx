"use client"

import { useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Upload, X, Image as ImageIcon } from "lucide-react"

export interface PendingFile {
  file: File
  previewUrl: string
}

interface Props {
  onSelect: (files: PendingFile[]) => void
  onRemove?: (previewUrl: string) => void
  pending: PendingFile[]
  maxFiles?: number
  label?: string
  description?: string
  className?: string
}

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024 // 5MB

export default function CloudinaryUploadDeferred({
  onSelect,
  onRemove,
  pending,
  maxFiles = 5,
  label = "Select Images",
  description = "Preview now; upload on save. (JPG, PNG, WebP, GIF up to 5MB each)",
  className = "",
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null)

  // Cleanup blob URLs on component unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      pending.forEach((p) => {
        try {
          URL.revokeObjectURL(p.previewUrl)
        } catch (e) {
          // Ignore errors if URL was already revoked
        }
      })
    }
  }, [pending])

  const openDialog = () => inputRef.current?.click()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    const remaining = Math.max(0, maxFiles - pending.length)
    const take = files.slice(0, remaining).filter((file) => {
      if (!ALLOWED_TYPES.includes(file.type)) {
        alert('Please select valid image files (JPG, PNG, WebP, or GIF).')
        return false
      }
      if (file.size > MAX_FILE_SIZE_BYTES) {
        alert('Each image must be smaller than 5MB.')
        return false
      }
      return true
    })
    if (take.length === 0) {
      if (inputRef.current) inputRef.current.value = ""
      return
    }
    const mapped: PendingFile[] = take.map((file) => ({ file, previewUrl: URL.createObjectURL(file) }))
    onSelect(mapped)
    if (inputRef.current) inputRef.current.value = ""
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleChange}
          className="hidden"
          multiple
          disabled={pending.length >= maxFiles}
        />
        <Button onClick={openDialog} variant="outline" className="w-full sm:w-auto">
          <Upload className="w-4 h-4 mr-2" />
          {label}
        </Button>
        <span className="text-sm text-slate-600 text-center sm:text-left">{pending.length}/{maxFiles} images</span>
      </div>

      <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded-lg border">{description}</div>

      {pending.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {pending.map((p, idx) => (
            <div key={idx} className="relative group">
              <Card className="overflow-hidden border-0 shadow-lg">
                <div className="aspect-square relative">
                  <img src={p.previewUrl} alt={`Pending ${idx + 1}`} className="w-full h-full object-cover" />
                  {onRemove && (
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity h-8 w-8"
                      onClick={() => onRemove(p.previewUrl)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                  <div className="absolute bottom-2 left-2">
                    <div className="flex items-center gap-1 bg-amber-500 text-white px-2 py-1 rounded-full text-xs">
                      Pending
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          ))}
        </div>
      ) : (
        <Card className="border-dashed border-2 border-slate-300">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="p-4 rounded-full bg-slate-100 mb-4">
              <ImageIcon className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800 mb-2">No images selected</h3>
            <p className="text-slate-600 text-center mb-4">Select images to preview before saving</p>
            <Button onClick={openDialog} variant="outline" className="border-slate-300 hover:border-slate-400">
              <Upload className="w-4 h-4 mr-2" />
              Choose Images
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
