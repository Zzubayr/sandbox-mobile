"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CloudinaryUpload } from "@/components/ui/cloudinary-upload"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function TestUploadPage() {
  const [uploadedImages, setUploadedImages] = useState<string[]>([])

  const handleUpload = (url: string) => {
    setUploadedImages(prev => [...prev, url])
  }

  const handleRemove = (url: string) => {
    setUploadedImages(prev => prev.filter(img => img !== url))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Button variant="ghost" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
        </div>

        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-slate-800">🧪 Upload Test Page</CardTitle>
            <CardDescription>
              Test the image upload functionality. In development mode, you'll see placeholder images.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-800 mb-2">📋 Test Instructions</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Try uploading different file types (JPG, PNG, WebP, GIF)</li>
                <li>• Test file size limits (max 5MB)</li>
                <li>• Try the "Try Again" button if upload fails</li>
                <li>• Check browser console for any warnings</li>
                <li>• In development mode, you'll see placeholder images</li>
              </ul>
            </div>

            <CloudinaryUpload
              onUpload={handleUpload}
              onRemove={handleRemove}
              existingImages={uploadedImages}
              maxImages={3}
              folder="sandbox/test"
              label="Test Image Upload"
              description="Upload test images (JPG, PNG, WebP, GIF). Max 5MB per image. This is for testing the upload functionality."
              className="w-full"
            />

            {uploadedImages.length > 0 && (
              <div className="mt-6">
                <h3 className="font-semibold text-slate-800 mb-3">✅ Uploaded Images ({uploadedImages.length})</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {uploadedImages.map((url, index) => (
                    <div key={index} className="relative">
                      <img
                        src={url}
                        alt={`Uploaded ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg border"
                      />
                      <div className="absolute top-2 right-2">
                        <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                          #{index + 1}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="font-semibold text-yellow-800 mb-2">⚠️ Development Mode</h3>
              <p className="text-sm text-yellow-700">
                If you see placeholder images instead of your uploaded files, this means Cloudinary 
                environment variables are not configured. This is normal for development testing.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
