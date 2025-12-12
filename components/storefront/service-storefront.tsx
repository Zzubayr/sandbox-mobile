"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Phone, Mail, MapPin, Facebook, Instagram, Twitter, Linkedin, 
  MessageCircle, Clock, DollarSign, ImageIcon as GalleryIcon, 
  Info, Check, ArrowRight, Star
} from "lucide-react";
import { getThemeColors } from "@/lib/theme-colors";
import { ImageLightbox } from "@/components/ui/image-lightbox";
import { cn } from "@/lib/utils";

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

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const waLink = vendor.whatsapp || (vendor.whatsapp_number ? `https://wa.me/${String(vendor.whatsapp_number).replace(/\D/g, "")}` : null);

  const dayOrder: Record<string, number> = { monday:1,tuesday:2,wednesday:3,thursday:4,friday:5,saturday:6,sunday:7 };
  const normalizedHours = [...hours].sort((a,b) => (dayOrder[a.day?.toLowerCase?.()]||99) - (dayOrder[b.day?.toLowerCase?.()]||99));

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section - Sleek & Immersive */}
      <div className="relative w-full h-[50vh] min-h-[400px] lg:h-[60vh] overflow-hidden rounded-b-[2.5rem] shadow-sm bg-slate-50">
        {vendor.banner_url ? (
          <Image 
            src={vendor.banner_url} 
            alt={vendor.store_name} 
            fill 
            className="object-cover" 
            priority 
          />
        ) : (
          <div className="absolute inset-0 bg-slate-100" />
        )}
        
        {/* Subtle Gradient Overlay with readability tint */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/25 to-transparent" />
        
        {/* Hero Content */}
        <div className="absolute inset-0 flex flex-col justify-end pb-12 px-4 md:px-8 lg:px-12">
          <div className="container mx-auto">
            <div className="flex flex-col md:flex-row items-end gap-6 md:gap-8">
              {/* Logo Card */}
              <div className="relative -mb-16 md:-mb-20 shrink-0">
                <div className="w-32 h-32 md:w-40 md:h-40 rounded-2xl bg-white p-1.5 shadow-xl ring-1 ring-slate-100">
                  <div className="relative w-full h-full rounded-xl overflow-hidden bg-slate-50">
                     {vendor.logo_url ? (
                        <Image src={vendor.logo_url} alt={vendor.store_name} fill className="object-cover" />
                     ) : (
                        <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-400">
                           <Store className="w-12 h-12" />
                        </div>
                     )}
                  </div>
                </div>
              </div>
              
              {/* Text Content */}
              <div className="flex-1 text-white mb-4 md:mb-0">
                 <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-2 text-shadow-sm">
                   {vendor.store_name}
                 </h1>
                 {vendor.description && (
                   <p className="text-base md:text-lg text-slate-200 max-w-2xl line-clamp-2 text-pretty opacity-90">
                     {vendor.description}
                   </p>
                 )}
              </div>

              {/* CTA */}
              {waLink && (
                 <div className="mb-4 md:mb-2">
                    <a href={waLink} target="_blank" rel="noopener noreferrer">
                       <Button size="lg" className="rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105 bg-white text-black hover:bg-slate-50 border-none">
                          <MessageCircle className="w-5 h-5 mr-2 text-green-600" />
                          Chat on WhatsApp
                       </Button>
                    </a>
                 </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="container mx-auto px-4 pt-24 pb-16">
         <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            
            {/* Left Column: Services & Gallery (8 cols) */}
            <div className="lg:col-span-8 space-y-12">
               
               {/* Services Section */}
               {rates?.length > 0 && (
                  <section>
                     <div className="flex items-center justify-between mb-8">
                        <div>
                           <h2 className="text-2xl font-bold tracking-tight text-slate-900">Services</h2>
                           <p className="text-muted-foreground mt-1">Professional services we offer</p>
                        </div>
                        <div className="hidden md:block h-px flex-1 bg-slate-100 ml-6" />
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {rates.map((service, i) => (
                           <div 
                              key={i}
                              className="group relative p-6 rounded-2xl bg-white border border-slate-100 hover:border-slate-200 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col justify-between"
                           >
                              <div>
                                 <h3 className="font-bold text-lg text-slate-900 mb-2 group-hover:text-primary transition-colors" style={{ '--primary': colors.primary } as any}>
                                    {service.name}
                                 </h3>
                                 {service.description && (
                                    <p className="text-sm text-slate-500 mb-4 line-clamp-3 leading-relaxed">
                                       {service.description}
                                    </p>
                                 )}
                              </div>
                              <div className="pt-4 border-t border-slate-50 flex items-center justify-between mt-auto">
                                 <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Starting at</span>
                                 <div className="text-right">
                                    <span className="text-xl font-bold text-slate-900">
                                       {Intl.NumberFormat(undefined, { style: 'currency', currency: 'NGN' }).format(Number(service.price||0))}
                                    </span>
                                    {service.unit && (
                                       <span className="text-xs text-slate-400 ml-1">/ {service.unit}</span>
                                    )}
                                 </div>
                              </div>
                              
                              {/* Subtle hover accent */}
                              <div 
                                 className="absolute left-0 top-6 bottom-6 w-1 rounded-r-full bg-primary/0 group-hover:bg-primary/50 transition-all duration-300"
                                 style={{ backgroundColor: colors.primary }}
                              />
                           </div>
                        ))}
                     </div>
                  </section>
               )}

                {/* Gallery Section */}
                {gallery?.length > 0 && (
                  <section>
                      <div className="flex items-center justify-between mb-8">
                        <div>
                           <h2 className="text-2xl font-bold tracking-tight text-slate-900">Work Gallery</h2>
                           <p className="text-muted-foreground mt-1">A glimpse of our recent work</p>
                        </div>
                        <Link href="#" className="text-sm font-medium text-slate-500 hover:text-slate-900 flex items-center transition-colors">
                           View All <ArrowRight className="w-4 h-4 ml-1" />
                        </Link>
                     </div>

                     <div className="columns-2 md:columns-3 gap-4 space-y-4">
                        {gallery.map((g, i) => (
                           <div 
                              key={i}
                              className="break-inside-avoid relative group rounded-xl overflow-hidden cursor-zoom-in"
                              onClick={() => openLightbox(i)}
                           >
                              <Image
                                 src={g.url}
                                 alt={`Work ${i + 1}`}
                                 width={500}
                                 height={500}
                                 className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-110"
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                           </div>
                        ))}
                     </div>
                      <ImageLightbox 
                        images={gallery}
                        initialIndex={lightboxIndex}
                        isOpen={lightboxOpen}
                        onClose={() => setLightboxOpen(false)}
                      />
                  </section>
                )}

            </div>

             {/* Right Column: Sticky Sidebar (4 cols) */}
             <div className="lg:col-span-4 space-y-6">
                <div className="sticky top-24 space-y-6">
                   
                   {/* Contact Card */}
                   <Card className="border-0 shadow-lg ring-1 ring-slate-100 overflow-hidden rounded-2xl">
                      <div className="h-2 w-full" style={{ backgroundColor: colors.primary }} />
                      <CardContent className="p-6">
                         <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
                           <Info className="w-5 h-5 text-slate-400" />
                           Contact Info
                         </h3>
                         
                         <div className="space-y-5">
                           {vendor.contact_email && (
                              <div className="flex gap-4 group">
                                 <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center shrink-0 group-hover:bg-slate-100 transition-colors">
                                    <Mail className="w-5 h-5 text-slate-600" />
                                 </div>
                                 <div className="min-w-0">
                                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-0.5">Email</p>
                                    <a href={`mailto:${vendor.contact_email}`} className="text-sm font-medium text-slate-900 hover:text-primary truncate block transition-colors" style={{ '--hover-color': colors.primary } as any}>
                                       {vendor.contact_email}
                                    </a>
                                 </div>
                              </div>
                           )}

                           {vendor.address && (
                              <div className="flex gap-4 group">
                                 <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center shrink-0 group-hover:bg-slate-100 transition-colors">
                                    <MapPin className="w-5 h-5 text-slate-600" />
                                 </div>
                                 <div>
                                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-0.5">Address</p>
                                    <p className="text-sm font-medium text-slate-900 leading-relaxed">
                                       {vendor.address}
                                    </p>
                                 </div>
                              </div>
                           )}
                           
                           {/* Socials */}
                           {(vendor.facebook || vendor.instagram || vendor.twitter || vendor.linkedin) && (
                              <div className="pt-4 mt-4 border-t border-slate-50">
                                 <div className="flex justify-start gap-2">
                                    {vendor.facebook && (
                                       <Link href={vendor.facebook} target="_blank" className="p-2.5 rounded-full bg-slate-50 hover:bg-[#1877F2] hover:text-white text-slate-600 transition-all duration-300">
                                          <Facebook className="w-5 h-5" />
                                       </Link>
                                    )}
                                    {vendor.instagram && (
                                       <Link href={vendor.instagram} target="_blank" className="p-2.5 rounded-full bg-slate-50 hover:bg-[#E4405F] hover:text-white text-slate-600 transition-all duration-300">
                                          <Instagram className="w-5 h-5" />
                                       </Link>
                                    )}
                                    {vendor.twitter && (
                                       <Link href={vendor.twitter} target="_blank" className="p-2.5 rounded-full bg-slate-50 hover:bg-[#1DA1F2] hover:text-white text-slate-600 transition-all duration-300">
                                          <Twitter className="w-5 h-5" />
                                       </Link>
                                    )}
                                    {vendor.linkedin && (
                                       <Link href={vendor.linkedin} target="_blank" className="p-2.5 rounded-full bg-slate-50 hover:bg-[#0A66C2] hover:text-white text-slate-600 transition-all duration-300">
                                          <Linkedin className="w-5 h-5" />
                                       </Link>
                                    )}
                                 </div>
                              </div>
                           )}
                         </div>
                      </CardContent>
                   </Card>

                   {/* Hours Card */}
                   {normalizedHours.length > 0 && (
                      <Card className="border-0 shadow-lg ring-1 ring-slate-100 overflow-hidden rounded-2xl">
                         <CardContent className="p-6">
                            <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
                              <Clock className="w-5 h-5 text-slate-400" />
                              Business Hours
                            </h3>
                            <div className="space-y-3">
                               {normalizedHours.map((h, i) => (
                                  <div key={i} className="flex items-center justify-between text-sm group">
                                     <span className="font-medium text-slate-500 capitalize">{h.day}</span>
                                     <div className="flex items-center">
                                       {!h.closed && (
                                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                                       )}
                                       <span className={cn("font-medium", h.closed ? "text-slate-400" : "text-slate-900")}>
                                          {h.closed ? 'Closed' : `${h.open} - ${h.close}`}
                                       </span>
                                     </div>
                                  </div>
                               ))}
                            </div>
                         </CardContent>
                      </Card>
                   )}
                </div>
             </div>

         </div>

         {/* Footer Simple */}
         <div className="mt-20 pt-8 border-t border-slate-100 text-center">
            <p className="text-sm text-slate-400 flex items-center justify-center gap-1.5">
               Powered by <span className="font-bold text-slate-600">Ummah Square</span>
            </p>
         </div>
      </div>
    </div>
  );
}
