"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Phone, Mail, MapPin, Facebook, Instagram, Twitter, Linkedin, MessageCircle, Clock, DollarSign, ImageIcon as GalleryIcon, Info } from "lucide-react";
import { getThemeColors } from "@/lib/theme-colors";
import { ImageLightbox } from "@/components/ui/image-lightbox";

type Hours = { day: string; open: string; close: string; closed?: boolean };

export default function ServiceStorefront({ vendor }: { vendor: any }) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const hours: Hours[] = Array.isArray(vendor.business_hours) ? vendor.business_hours : [];
  // Normalize gallery to objects with url only
  const gallery: Array<{ url: string }> = Array.isArray(vendor.services_gallery)
    ? vendor.services_gallery.map((g: any) => (typeof g === 'string' ? { url: g } : { url: g.url })).filter((g: any) => g && g.url)
    : [];
  const rates: Array<{ name: string; description?: string; price: number; unit?: string }> = Array.isArray(vendor.service_rates) ? vendor.service_rates : [];
  const colors = getThemeColors(vendor.theme_color);

  // No debug logs in production UI

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const waLink = vendor.whatsapp || (vendor.whatsapp_number ? `https://wa.me/${String(vendor.whatsapp_number).replace(/\D/g, "")}` : null);

  const dayOrder: Record<string, number> = { monday:1,tuesday:2,wednesday:3,thursday:4,friday:5,saturday:6,sunday:7 };
  const normalizedHours = [...hours].sort((a,b) => (dayOrder[a.day?.toLowerCase?.()]||99) - (dayOrder[b.day?.toLowerCase?.()]||99));

  return (
    <div className="space-y-8">
      {/* Hero Banner with Gradient Overlay */}
      {(vendor.banner_url || vendor.logo_url) && (
        <div className="relative h-56 md:h-72 lg:h-96 overflow-hidden rounded-2xl shadow-2xl">
          <Image src={vendor.banner_url || vendor.logo_url} alt={vendor.store_name} fill className="object-cover" priority />
          <div 
            className="absolute inset-0 flex items-center justify-center"
            style={{
              background: `linear-gradient(135deg, ${colors.primary}E6 0%, ${colors.dark}E6 100%)`
            }}
          >
            <div className="text-center text-white px-6 max-w-4xl">
              {vendor.logo_url && vendor.banner_url && (
                <div className="mb-4 flex justify-center">
                  <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-full border-4 border-white shadow-xl overflow-hidden">
                    <Image src={vendor.logo_url} alt={vendor.store_name} fill className="object-cover" />
                  </div>
                </div>
              )}
              <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-3 text-balance drop-shadow-lg">{vendor.store_name}</h1>
              {vendor.description && (
                <p className="text-base md:text-xl opacity-95 text-pretty max-w-2xl mx-auto leading-relaxed">{vendor.description}</p>
              )}
              {waLink && (
                <div className="mt-6">
                  <a href={waLink} target="_blank" rel="noopener noreferrer">
                    <Button size="lg" className="bg-white hover:bg-gray-100 shadow-lg" style={{ color: colors.primary }}>
                      <MessageCircle className="w-5 h-5 mr-2" />
                      Contact Us on WhatsApp
                    </Button>
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Contact & Hours Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contact Information Card */}
        {(vendor.contact_email || vendor.whatsapp_number || vendor.address) && (
          <Card className="lg:col-span-2 shadow-lg border-0 hover:shadow-xl transition-shadow">
            <CardContent className="p-6 md:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-xl" style={{ backgroundColor: `${colors.light}40` }}>
                  <Info className="w-6 h-6" style={{ color: colors.primary }} />
                </div>
                <h2 className="text-2xl font-bold" style={{ color: colors.dark }}>Contact Information</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {vendor.contact_email && (
                  <div className="flex items-start gap-3 p-4 rounded-lg hover:bg-slate-50 transition-colors">
                    <div className="p-2 rounded-lg" style={{ backgroundColor: colors.light }}>
                      <Mail className="w-5 h-5" style={{ color: colors.primary }} />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-medium uppercase mb-1">Email</p>
                      <a href={`mailto:${vendor.contact_email}`} className="text-sm font-medium hover:underline" style={{ color: colors.dark }}>
                        {vendor.contact_email}
                      </a>
                    </div>
                  </div>
                )}
                
                {waLink && (
                  <div className="flex items-start gap-3 p-4 rounded-lg hover:bg-slate-50 transition-colors">
                    <div className="p-2 rounded-lg bg-green-100">
                      <Phone className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-medium uppercase mb-1">WhatsApp</p>
                      <a href={waLink} target="_blank" rel="noopener noreferrer" className="text-sm font-medium hover:underline text-green-600">
                        {vendor.whatsapp_number || 'Message Us'}
                      </a>
                    </div>
                  </div>
                )}
                
                {vendor.address && (
                  <div className="flex items-start gap-3 p-4 rounded-lg hover:bg-slate-50 transition-colors md:col-span-2">
                    <div className="p-2 rounded-lg" style={{ backgroundColor: colors.light }}>
                      <MapPin className="w-5 h-5" style={{ color: colors.primary }} />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-medium uppercase mb-1">Address</p>
                      <p className="text-sm font-medium" style={{ color: colors.dark }}>{vendor.address}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Social Media Links */}
              {(vendor.facebook || vendor.instagram || vendor.twitter || vendor.linkedin) && (
                <div className="mt-6 pt-6 border-t">
                  <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase">Follow Us</h3>
                  <div className="flex items-center gap-2">
                    {vendor.facebook && (
                      <Link href={vendor.facebook} target="_blank" className="p-3 rounded-full hover:bg-blue-50 transition-colors">
                        <Facebook className="w-5 h-5 text-blue-600" />
                      </Link>
                    )}
                    {vendor.instagram && (
                      <Link href={vendor.instagram} target="_blank" className="p-3 rounded-full hover:bg-pink-50 transition-colors">
                        <Instagram className="w-5 h-5 text-pink-600" />
                      </Link>
                    )}
                    {vendor.twitter && (
                      <Link href={vendor.twitter} target="_blank" className="p-3 rounded-full hover:bg-sky-50 transition-colors">
                        <Twitter className="w-5 h-5 text-sky-500" />
                      </Link>
                    )}
                    {vendor.linkedin && (
                      <Link href={vendor.linkedin} target="_blank" className="p-3 rounded-full hover:bg-blue-50 transition-colors">
                        <Linkedin className="w-5 h-5 text-blue-700" />
                      </Link>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Business Hours Card */}
        {normalizedHours?.length > 0 && (
          <Card className="shadow-lg border-0 hover:shadow-xl transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-xl" style={{ backgroundColor: `${colors.light}40` }}>
                  <Clock className="w-6 h-6" style={{ color: colors.primary }} />
                </div>
                <h2 className="text-xl font-bold" style={{ color: colors.dark }}>Hours</h2>
              </div>
              
              <div className="space-y-2">
                {normalizedHours.map((h, i) => (
                  <div 
                    key={i} 
                    className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <span className="capitalize font-medium text-sm" style={{ color: colors.dark }}>{h.day}</span>
                    <span className={`text-sm font-medium ${h.closed ? 'text-red-500' : 'text-green-600'}`}>
                      {h.closed ? 'Closed' : `${h.open} – ${h.close}`}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Services & Rates */}
      {rates?.length > 0 && (
        <Card className="shadow-lg border-0 hover:shadow-xl transition-shadow">
          <CardContent className="p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-xl" style={{ backgroundColor: `${colors.light}40` }}>
                <DollarSign className="w-6 h-6" style={{ color: colors.primary }} />
              </div>
              <h2 className="text-2xl font-bold" style={{ color: colors.dark }}>Our Services</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {rates.map((r, i) => (
                <div 
                  key={i} 
                  className="group relative p-6 rounded-xl border-2 hover:border-transparent hover:shadow-lg transition-all"
                  style={{ 
                    borderColor: colors.light,
                    background: `linear-gradient(135deg, white 0%, ${colors.light}15 100%)`
                  }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg mb-2" style={{ color: colors.dark }}>{r.name}</h3>
                      {r.description && (
                        <p className="text-sm text-muted-foreground leading-relaxed">{r.description}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold" style={{ color: colors.primary }}>
                        {Intl.NumberFormat(undefined, { style: 'currency', currency: 'NGN' }).format(Number(r.price||0))}
                      </div>
                      {r.unit && (
                        <span className="text-xs text-muted-foreground">per {r.unit}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Gallery */}
      {gallery?.length > 0 && (
        <Card className="shadow-lg border-0 hover:shadow-xl transition-shadow">
          <CardContent className="p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-xl" style={{ backgroundColor: `${colors.light}40` }}>
                <GalleryIcon className="w-6 h-6" style={{ color: colors.primary }} />
              </div>
              <h2 className="text-2xl font-bold" style={{ color: colors.dark }}>Our Work</h2>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {gallery.map((g, i) => (
                <div 
                  key={i} 
                  onClick={() => openLightbox(i)}
                  className="group relative aspect-square overflow-hidden rounded-xl shadow-md hover:shadow-xl transition-all cursor-pointer"
                >
                  <Image 
                    src={g.url} 
                    alt={`Gallery ${i+1}`} 
                    fill 
                    unoptimized
                    className="object-cover group-hover:scale-110 transition-transform duration-300" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
                        <GalleryIcon className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    {/* captions intentionally omitted */}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Image Lightbox */}
            <ImageLightbox 
              images={gallery}
              initialIndex={lightboxIndex}
              isOpen={lightboxOpen}
              onClose={() => setLightboxOpen(false)}
            />
          </CardContent>
        </Card>
      )}

      {/* Footer */}
      <div className="mt-12 pt-8 border-t text-center">
        <p className="text-sm text-muted-foreground">
          Powered by <span className="font-semibold bg-gradient-to-r from-[#2B6DA9] to-[#20527F] bg-clip-text text-transparent">Ummah Square</span>
        </p>
      </div>
    </div>
  );
}
