"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import CloudinaryUploadDeferred, { type PendingFile } from "@/components/ui/cloudinary-upload-deferred";
import { uploadImageWithMeta, deleteImage as deleteCloudinaryImage } from "@/lib/cloudinary";
import { toastHelpers } from "@/lib/toast-helpers";
import { Trash2, Image as ImageIcon, Save, Loader2, Eye } from "lucide-react";
import { ImageLightbox } from "@/components/ui/image-lightbox";

type GalleryItem = { url: string; public_id?: string; caption?: string };

export default function ServiceGalleryPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
  const [vendor, setVendor] = useState<any | null>(null);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [pending, setPending] = useState<PendingFile[]>([]);
  const [toRemove, setToRemove] = useState<string[]>([]); // public_ids to remove on save
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const MAX_IMAGES = 15;

  useEffect(() => { (async () => {
    const res = await fetch('/api/dashboard/vendor', { cache: 'no-store' });
    const json = await res.json();
    console.log('Dashboard - Vendor loaded:', json.vendor);
    console.log('Dashboard - services_gallery:', json.vendor?.services_gallery);
    if (json?.vendor) { 
      setVendor(json.vendor); 
      const loadedGallery = Array.isArray(json.vendor.services_gallery) ? json.vendor.services_gallery : [];
      console.log('Dashboard - Setting gallery to:', loadedGallery);
      setGallery(loadedGallery); 
    }
    setLoading(false);
  })(); }, []);

  const onSelectPending = (files: PendingFile[]) => {
    const currentTotal = gallery.length + pending.length;
    const remaining = Math.max(0, MAX_IMAGES - currentTotal);
    const toAdd = remaining > 0 ? files.slice(0, remaining) : [];
    if (toAdd.length < files.length) {
      toastHelpers.uploadError(`You can upload up to ${MAX_IMAGES} images in the gallery.`);
    }
    if (toAdd.length) setPending(prev => [...prev, ...toAdd]);
  };
  const onRemovePending = (previewUrl: string) => {
    setPending(prev => prev.filter(p => p.previewUrl !== previewUrl));
  };
  const removeExisting = (idx: number) => {
    const item = gallery[idx];
    setGallery(prev => prev.filter((_, i) => i !== idx));
    if (item?.public_id) setToRemove(prev => [...prev, item.public_id!]);
  };

  const handleSave = async () => {
    if (!vendor) return;
    setSaving(true);
    setUploading(pending.length > 0);
    
    try {
      // Upload pending files with progress tracking
      const uploaded: { url: string; public_id: string }[] = [];
      setUploadProgress({ current: 0, total: pending.length });
      
      if (pending.length > 0) {
        for (let i = 0; i < pending.length; i++) {
          const p = pending[i];
          setUploadProgress({ current: i + 1, total: pending.length });
          const up = await uploadImageWithMeta(
            p.file, 
            `vendors/${vendor.id}/services-gallery`, 
            `gallery-${Date.now()}-${i + 1}`
          );
          uploaded.push(up);
        }
      }
      
      setUploading(false);
      const nextGallery = [...gallery, ...uploaded];
      
      console.log('Saving gallery to database:', nextGallery);

      // Persist vendor gallery
      const res = await fetch('/api/dashboard/vendor', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ services_gallery: nextGallery, deleted_image_ids: toRemove })
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error('API Error:', errorText);
        throw new Error(errorText || 'Failed to save');
      }

      const json = await res.json();
      console.log('API Response:', json);

      // Update local state with server response
      if (json?.vendor?.services_gallery) {
        console.log('Gallery saved successfully:', json.vendor.services_gallery);
        setVendor(json.vendor);
        setGallery(json.vendor.services_gallery);
      } else {
        console.warn('No services_gallery in response, using local state');
        setGallery(nextGallery);
      }

      // Server handles deletion via deleted_image_ids; no client cleanup needed

      setPending([]);
      setToRemove([]);
      setUploadProgress({ current: 0, total: 0 });
      toastHelpers.settingsSaved();
    } catch (e: any) {
      console.error('Save error:', e);
      toastHelpers.saveError(e?.message || 'Failed to save');
    } finally { 
      setSaving(false); 
      setUploading(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center py-12">Loading...</div>;
  if (!vendor) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gallery</h1>
          <p className="text-muted-foreground mt-1">Upload images to showcase your work</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            onClick={handleSave} 
            disabled={saving || (pending.length === 0 && toRemove.length === 0)} 
            size="lg"
            className="bg-[#2B6DA9] hover:bg-[#20527F] text-white shadow-md"
          >
            {uploading ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Uploading {uploadProgress.current}/{uploadProgress.total}...</>
            ) : saving ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</>
            ) : (
              <><Save className="w-4 h-4 mr-2" />Save Changes</>
            )}
          </Button>
        </div>
      </div>

      <Card className="shadow-lg border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-[#2B6DA9]" />
            Service Images
          </CardTitle>
          <CardDescription>
            Select images to preview, then click Save to upload them to your gallery. ({gallery.length + pending.length} / {MAX_IMAGES})
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <CloudinaryUploadDeferred
            onSelect={onSelectPending}
            onRemove={onRemovePending}
            pending={pending}
            maxFiles={Math.max(0, MAX_IMAGES - (gallery.length + pending.length))}
            label="Select Images"
            description="Choose multiple images to preview before uploading."
            className="w-full"
          />

          {gallery.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {/* Existing images (removable) */}
              {gallery.map((g, i) => (
                <div key={`ex-${i}`} className="group relative rounded-lg overflow-hidden border border-slate-200 hover:border-[#2B6DA9] transition-all shadow-sm hover:shadow-md">
                  <div className="aspect-square relative">
                    <Image src={g.url} alt={g.caption || `Gallery ${i+1}`} fill unoptimized className="object-cover" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center gap-2">
                      <Button 
                        size="icon" 
                        variant="secondary"
                        onClick={() => {
                          setLightboxIndex(i);
                          setLightboxOpen(true);
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button 
                        size="icon" 
                        variant="destructive" 
                        onClick={() => removeExisting(i)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ImageIcon className="w-16 h-16 text-slate-300 mb-3" />
              <p className="text-sm text-muted-foreground">No images yet. Use the selector above to add images.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Image Lightbox for Preview */}
      <ImageLightbox 
        images={gallery}
        initialIndex={lightboxIndex}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />
    </div>
  );
}
