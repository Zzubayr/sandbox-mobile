"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Upload, X, Image as ImageIcon, Check, AlertCircle, RotateCcw } from "lucide-react"
import { uploadImage } from "@/lib/cloudinary"
import Image from "next/image"

interface CloudinaryUploadProps {
  onUpload: (url: string) => void
  onRemove?: (url: string) => void
  existingImages?: string[]
  maxImages?: number
  folder?: string
  className?: string
  label?: string
  description?: string
}

export function CloudinaryUpload({
  onUpload,
  onRemove,
  existingImages = [],
  maxImages = 5,
  folder = 'ummah-square',
  className = "",
  label = "Upload Images",
  description = "Upload high-quality images (JPG, PNG, WebP, GIF). Max 5MB per image."
}: CloudinaryUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    const file = files[0]
    
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      setError('Please select a valid image file (JPG, PNG, WebP, or GIF)')
      return
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB')
      return
    }

    // Check if we've reached the max number of images
    if (existingImages.length >= maxImages) {
      setError(`Maximum ${maxImages} images allowed`)
      return
    }

    setError(null)
    setUploading(true)
    setUploadProgress(0)

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 100)

      const result = await uploadImage(file, folder)
      
      clearInterval(progressInterval)
      setUploadProgress(100)
      
      setTimeout(() => {
        onUpload(result)
        setUploading(false)
        setUploadProgress(0)
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      }, 500)

    } catch (error) {
      console.error('Upload error:', error)
      setError('Failed to upload image. Please try again.')
      setUploading(false)
      setUploadProgress(0)
    }
  }

  const handleRemoveImage = (url: string) => {
    if (onRemove) {
      onRemove(url)
    }
  }

  const openFileDialog = () => {
    setError(null) // Clear any previous errors
    fileInputRef.current?.click()
  }

  const retryUpload = () => {
    setError(null)
    openFileDialog()
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Button */}
      <div className="flex items-center gap-4">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
          onChange={handleFileSelect}
          className="hidden"
          disabled={uploading || existingImages.length >= maxImages}
        />
        
        <Button
          type="button"
          onClick={openFileDialog}
          disabled={uploading || existingImages.length >= maxImages}
          className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
        >
          <Upload className="w-4 h-4 mr-2" />
          {uploading ? 'Uploading...' : label}
        </Button>

        <span className="text-sm text-slate-600">
          {existingImages.length}/{maxImages} images
        </span>
      </div>

      {/* File Type Information */}
      <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded-lg border">
        <p className="font-medium mb-1">Supported file types:</p>
        <p>{description}</p>
      </div>

      {/* Upload Progress */}
      {uploading && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Upload className="w-4 h-4 text-blue-600 animate-pulse" />
                <span className="text-sm font-medium text-blue-800">Uploading image...</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
              <span className="text-xs text-blue-600">{uploadProgress}%</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Message */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <span className="text-sm text-red-800">{error}</span>
              </div>
              <Button
                onClick={retryUpload}
                variant="outline"
                size="sm"
                className="border-red-300 text-red-700 hover:bg-red-100"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Image Grid */}
      {existingImages.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {existingImages.map((url, index) => (
            <div key={index} className="relative group">
              <Card className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow">
                <div className="aspect-square relative">
                  <Image
                    src={url}
                    alt={`Upload ${index + 1}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                    unoptimized
                  />
                  
                  {/* Remove Button */}
                  {onRemove && (
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                      onClick={() => handleRemoveImage(url)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}

                  {/* Success Indicator */}
                  <div className="absolute bottom-2 left-2">
                    <div className="flex items-center gap-1 bg-green-500 text-white px-2 py-1 rounded-full text-xs">
                      <Check className="h-3 w-3" />
                      Uploaded
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {existingImages.length === 0 && !uploading && (
        <Card className="border-dashed border-2 border-slate-300">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="p-4 rounded-full bg-slate-100 mb-4">
              <ImageIcon className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800 mb-2">No images uploaded</h3>
            <p className="text-slate-600 text-center mb-4">
              Upload images to showcase your products
            </p>
            <Button
              onClick={openFileDialog}
              variant="outline"
              className="border-slate-300 hover:border-slate-400"
            >
              <Upload className="w-4 h-4 mr-2" />
              Choose Images
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
