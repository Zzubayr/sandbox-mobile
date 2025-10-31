"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toastHelpers } from "@/lib/toast-helpers";
import { Save, Mail, Phone, MapPin, MessageCircle, FileText, Facebook, Instagram, Twitter, Linkedin } from "lucide-react";

export default function AboutContactPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [vendor, setVendor] = useState<any | null>(null);
  const [form, setForm] = useState({ 
    contact_email: "", 
    whatsapp_number: "", 
    whatsapp: "", 
    address: "", 
    description: "",
    facebook: "",
    instagram: "",
    twitter: "",
    linkedin: ""
  });

  useEffect(() => { (async () => {
    const res = await fetch('/api/dashboard/vendor', { cache: 'no-store' });
    const json = await res.json();
    if (json?.vendor) {
      setVendor(json.vendor);
      setForm({
        contact_email: json.vendor.contact_email || "",
        whatsapp_number: json.vendor.whatsapp_number || "",
        whatsapp: json.vendor.whatsapp || "",
        address: json.vendor.address || "",
        description: json.vendor.description || "",
        facebook: json.vendor.facebook || "",
        instagram: json.vendor.instagram || "",
        twitter: json.vendor.twitter || "",
        linkedin: json.vendor.linkedin || "",
      });
    }
    setLoading(false);
  })(); }, []);

  const onSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/dashboard/vendor', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contact_email: form.contact_email || undefined,
          whatsapp_number: form.whatsapp_number || undefined,
          whatsapp: form.whatsapp || undefined,
          address: form.address || undefined,
          description: form.description || undefined,
          facebook: form.facebook || undefined,
          instagram: form.instagram || undefined,
          twitter: form.twitter || undefined,
          linkedin: form.linkedin || undefined,
        })
      });
      if (!res.ok) throw new Error(await res.text());
      toastHelpers.settingsSaved();
    } catch (e: any) {
      toastHelpers.saveError(e?.message || 'Failed to save');
    } finally { setSaving(false); }
  }

  if (loading) return <div className="flex items-center justify-center py-12">Loading...</div>;
  if (!vendor) return null;

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">About & Contact</h1>
          <p className="text-muted-foreground mt-1">Tell customers about your business</p>
        </div>
        <Button onClick={onSave} disabled={saving} size="lg" className="bg-[#2B6DA9] hover:bg-[#20527F] text-white shadow-md">
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Description Card */}
        <Card className="shadow-lg border-0 lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#2B6DA9]" />
              Business Description
            </CardTitle>
            <CardDescription>Share what makes your business special</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea 
              rows={5} 
              value={form.description} 
              onChange={e => setForm({ ...form, description: e.target.value })} 
              placeholder="Tell customers about your services, experience, and what sets you apart..."
              className="resize-none"
            />
          </CardContent>
        </Card>

        {/* Contact Information Card */}
        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-[#2B6DA9]" />
              Contact Information
            </CardTitle>
            <CardDescription>How customers can reach you</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email Address
              </Label>
              <Input 
                type="email"
                value={form.contact_email} 
                onChange={e => setForm({ ...form, contact_email: e.target.value })} 
                placeholder="you@business.com" 
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                WhatsApp Number
              </Label>
              <Input 
                value={form.whatsapp_number} 
                onChange={e => setForm({ ...form, whatsapp_number: e.target.value })} 
                placeholder="+234..." 
              />
              <p className="text-xs text-muted-foreground">Include country code</p>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4" />
                WhatsApp Link (optional)
              </Label>
              <Input 
                value={form.whatsapp} 
                onChange={e => setForm({ ...form, whatsapp: e.target.value })} 
                placeholder="https://wa.me/..." 
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Business Address
              </Label>
              <Input 
                value={form.address} 
                onChange={e => setForm({ ...form, address: e.target.value })} 
                placeholder="123 Main Street, City, Country" 
              />
            </div>
          </CardContent>
        </Card>

        {/* Social Media Card */}
        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Facebook className="w-5 h-5 text-[#2B6DA9]" />
              Social Media
            </CardTitle>
            <CardDescription>Connect your social profiles</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Facebook className="w-4 h-4 text-blue-600" />
                Facebook
              </Label>
              <Input 
                value={form.facebook} 
                onChange={e => setForm({ ...form, facebook: e.target.value })} 
                placeholder="https://facebook.com/yourpage" 
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Instagram className="w-4 h-4 text-pink-600" />
                Instagram
              </Label>
              <Input 
                value={form.instagram} 
                onChange={e => setForm({ ...form, instagram: e.target.value })} 
                placeholder="https://instagram.com/yourprofile" 
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Twitter className="w-4 h-4 text-sky-500" />
                Twitter / X
              </Label>
              <Input 
                value={form.twitter} 
                onChange={e => setForm({ ...form, twitter: e.target.value })} 
                placeholder="https://twitter.com/yourhandle" 
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Linkedin className="w-4 h-4 text-blue-700" />
                LinkedIn
              </Label>
              <Input 
                value={form.linkedin} 
                onChange={e => setForm({ ...form, linkedin: e.target.value })} 
                placeholder="https://linkedin.com/in/yourprofile" 
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
