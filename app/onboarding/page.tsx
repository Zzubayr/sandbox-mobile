"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { authClient } from "@/lib/auth-client";
import { useTheme } from "@/lib/theme-context";
import { toastHelpers } from "@/lib/toast-helpers";
import logo from "@/public/logo.svg";
import Image from "next/image";
import { Loader2, Store, Palette, Phone, ArrowRight, Check, Sparkles, MapPin, Briefcase, Globe, Building2, Zap, Star } from "lucide-react";
import LocationPicker from "@/components/ui/location-picker";

const THEME_OPTIONS = [
  { value: "blue", label: "Ocean Blue", description: "Professional and trustworthy", color: "bg-blue-500", gradient: "from-blue-400 to-blue-600", preview: "bg-gradient-to-br from-blue-50 to-blue-100", icon: Globe },
  { value: "green", label: "Forest Green", description: "Natural and growth-focused", color: "bg-green-500", gradient: "from-green-400 to-green-600", preview: "bg-gradient-to-br from-green-50 to-green-100", icon: Building2 },
  { value: "purple", label: "Royal Purple", description: "Creative and premium", color: "bg-purple-500", gradient: "from-purple-400 to-purple-600", preview: "bg-gradient-to-br from-purple-50 to-purple-100", icon: Star },
];

const BUSINESS_TYPES = [
  { value: "products", label: "Products", description: "Sell physical or digital products", icon: Store },
  { value: "services", label: "Services", description: "Offer professional services", icon: Zap },
];

const generateStoreSlug = (storeName: string): string => (
  storeName.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "") || "store"
);

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [formData, setFormData] = useState({
    store_name: "",
    description: "",
    whatsapp_number: "",
    theme_color: "blue" as "blue" | "green" | "purple",
    business_type: "products" as "products" | "services",
  });
  const [nameAvailable, setNameAvailable] = useState<boolean | null>(null);
  const [nameChecking, setNameChecking] = useState(false);
  const [location, setLocation] = useState<{
    location: { type: 'Point'; coordinates: [number, number] };
    address?: string; placeId?: string; components?: any;
  } | null>(null);
  const router = useRouter();
  const { setTheme } = useTheme();

  useEffect(() => { void checkUser(); }, []);

  // Debounced store name availability
  useEffect(() => {
    const name = formData.store_name.trim();
    if (!name) { setNameAvailable(null); return; }
    setNameChecking(true);
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/dashboard/vendor/check-name?name=${encodeURIComponent(name)}`, { cache: 'no-store' });
        if (!res.ok) throw new Error('check failed');
        const json = await res.json();
        setNameAvailable(!!json.available);
      } catch { setNameAvailable(null); } finally { setNameChecking(false); }
    }, 400);
    return () => clearTimeout(t);
  }, [formData.store_name]);

  async function checkUser() {
    try {
      const { data: session } = await authClient.getSession();
      const u = session?.user; if (!u) { router.push('/auth/login'); return; }
      setUser(u);
      const res = await fetch('/api/dashboard/vendor', { cache: 'no-store' });
      if (res.ok) {
        const { vendor } = await res.json();
        if (vendor) {
          setFormData({
            store_name: vendor.store_name || "",
            description: vendor.description || "",
            whatsapp_number: vendor.whatsapp_number || "",
            theme_color: vendor.theme_color || "blue",
            business_type: vendor.business_type || 'products',
          });
          if (vendor.whatsapp_number && vendor.store_name) { router.push('/dashboard'); return; }
          setStep(5);
        }
      }
    } finally { setInitialLoading(false); }
  }

  const handleNext = () => {
    if (step < 5) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async () => {
    if (!user) {
      alert("No user found. Please try logging in again.");
      return;
    }

    if (!formData.store_name || !formData.whatsapp_number) {
      alert("Please fill in all required fields");
      return;
    }
    if (nameAvailable === false) {
      toastHelpers.error("Name Taken", "This business name is already taken. Please choose another.")
      return;
    }

    setLoading(true);
    try {
      // Upsert vendor via API
      const vendRes = await fetch('/api/dashboard/vendor', { cache: 'no-store' });
      const existing = vendRes.ok ? (await vendRes.json()).vendor : null;
      const payload: any = {
        store_name: formData.store_name,
        store_slug: generateStoreSlug(formData.store_name),
        description: formData.description || undefined,
        whatsapp_number: formData.whatsapp_number || undefined,
        theme_color: formData.theme_color,
      };
      payload.business_type = formData.business_type;
      if (location?.location) {
        payload.location = location.location
        if (location.address) payload.address = location.address
        if (location.placeId) payload.placeId = location.placeId
        if (location.components) payload.components = location.components
      }
      const saveRes = await fetch('/api/dashboard/vendor', {
        method: existing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!saveRes.ok) {
        let msg = 'Failed to save vendor'
        try {
          const err = await saveRes.json()
          if (saveRes.status === 409 && err?.error?.toLowerCase?.().includes('name')) {
            msg = 'Business name is already taken'
          } else if (typeof err?.error === 'string') {
            msg = err.error
          }
        } catch {}
        throw new Error(msg)
      }

      // Apply theme immediately
      setTheme(formData.theme_color);
      toastHelpers.success(
        "Store Created!",
        "Your store has been set up successfully"
      );
      router.push("/dashboard");
    } catch (error) {
      console.error("Error in handleSubmit:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : typeof error === "string"
          ? error
          : "Unknown error";
      toastHelpers.error(
        "Setup Failed",
        `Error creating your store: ${errorMessage}. Please try again.`
      );
    } finally {
      setLoading(false);
    }
  };

  const isStepValid = () => {
    switch (step) {
      case 1:
        return formData.store_name.trim().length > 0 && nameAvailable !== false;
      case 2:
        return !!location?.location && Number.isFinite(location.location.coordinates[0]) && Number.isFinite(location.location.coordinates[1]);
      case 3:
        return formData.business_type === 'products' || formData.business_type === 'services';
      case 4:
        return formData.whatsapp_number.trim().length > 0;
      case 5:
        return true;
      default:
        return false;
    }
  };

  if (initialLoading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-6 relative z-10">
        <div className="max-w-2xl mx-auto">
          {/* Apple-style Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-slate-100">
                <Image src={logo} className="h-6 w-6" alt="logo" />
              </div>
              <h1 className="text-2xl font-semibold text-slate-900">
                Sandbox
              </h1>
            </div>
            <h2 className="text-3xl font-bold text-slate-900 mb-2">
              Create your store
            </h2>
            <p className="text-lg text-slate-600">
              Set up your business in a few simple steps
            </p>
          </div>

          {/* Apple-style Progress */}
          <div className="flex justify-center mb-8">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-200 ${
                      i <= step
                        ? "bg-blue-500 text-white"
                        : "bg-slate-200 text-slate-500"
                    }`}
                  >
                    {i < step ? <Check className="w-4 h-4" /> : i}
                  </div>
                  {i < 5 && (
                    <div
                      className={`w-8 h-0.5 transition-all duration-200 ${
                        i < step ? "bg-blue-500" : "bg-slate-200"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Apple-style Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-8">
              {/* Step Header */}
              <div className="text-center mb-8">
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  {step === 1 && <Store className="w-6 h-6 text-white" />}
                  {step === 2 && <MapPin className="w-6 h-6 text-white" />}
                  {step === 3 && <Briefcase className="w-6 h-6 text-white" />}
                  {step === 4 && <Phone className="w-6 h-6 text-white" />}
                  {step === 5 && <Palette className="w-6 h-6 text-white" />}
                </div>
                <h3 className="text-2xl font-semibold text-slate-900 mb-2">
                  {step === 1 && "What's your store name?"}
                  {step === 2 && "Where is your business located?"}
                  {step === 3 && "What does your business offer?"}
                  {step === 4 && "How can customers reach you?"}
                  {step === 5 && "Choose your brand theme"}
                </h3>
                <p className="text-slate-600">
                  {step === 1 && "This is how customers will find your store"}
                  {step === 2 && "Help customers find you and understand your service area"}
                  {step === 3 && "Choose the type that best describes your business"}
                  {step === 4 && "We'll use this for order notifications and support"}
                  {step === 5 && "Pick a color that represents your brand personality"}
                </p>
              </div>
              {/* Step 1: Store Name */}
              {step === 1 && (
                <div className="space-y-6">
                  <div className="space-y-4">
                    <Label htmlFor="store_name" className="text-base font-medium text-slate-700">Store Name</Label>
                    <Input
                      id="store_name"
                      placeholder="Enter your store name"
                      value={formData.store_name}
                      onChange={(e) =>
                        setFormData({ ...formData, store_name: e.target.value })
                      }
                      className="h-12 text-base border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl"
                    />
                    {formData.store_name && (
                      <p className={`text-sm ${nameAvailable === false ? 'text-red-600' : 'text-slate-500'}`}>
                        {nameChecking ? 'Checking availability...' : nameAvailable === false ? 'This name is already taken.' : 'Store name available'}
                      </p>
                    )}
                  </div>
                  <div className="space-y-4">
                    <Label htmlFor="description" className="text-base font-medium text-slate-700">Store Description (Optional)</Label>
                    <Textarea
                      id="description"
                      placeholder="Tell customers what makes your store special..."
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                      rows={3}
                      className="border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl"
                    />
                  </div>
                </div>
              )}

              {/* Step 2: Location */}
              {step === 2 && (
                <div className="space-y-6">
                  <div className="space-y-4">
                    <Label className="text-base font-medium text-slate-700">Business Location</Label>
                    <LocationPicker 
                      value={location ?? undefined} 
                      onChange={setLocation as any} 
                      placeholder="Search for your business location..."
                    />
                  </div>
                </div>
              )}

              {/* Step 3: Business Type */}
              {step === 3 && (
                <div className="space-y-6">
                  <div className="grid gap-4">
                    {BUSINESS_TYPES.map((type) => {
                      const IconComponent = type.icon;
                      return (
                        <div
                          key={type.value}
                          className={`relative p-4 rounded-xl border cursor-pointer transition-all duration-200 ${
                            formData.business_type === type.value
                              ? "border-blue-500 bg-blue-50"
                              : "border-slate-200 hover:border-slate-300 bg-white"
                          }`}
                          onClick={() => setFormData({ ...formData, business_type: type.value })}
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center">
                              <IconComponent className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-medium text-slate-900">{type.label}</h3>
                              <p className="text-sm text-slate-600">{type.description}</p>
                            </div>
                            {formData.business_type === type.value && (
                              <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                                <Check className="w-3 h-3 text-white" />
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Step 4: Contact Details */}
              {step === 4 && (
                <div className="space-y-6">
                  <div className="space-y-4">
                    <Label htmlFor="whatsapp" className="text-base font-medium text-slate-700">WhatsApp Number</Label>
                    <Input
                      id="whatsapp"
                      placeholder="+1234567890"
                      value={formData.whatsapp_number}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          whatsapp_number: e.target.value,
                        })
                      }
                      className="h-12 text-base border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl"
                    />
                    <p className="text-sm text-slate-500">
                      Include country code (e.g., +1 for US, +44 for UK)
                    </p>
                  </div>
                </div>
              )}

              {/* Step 5: Theme Selection */}
              {step === 5 && (
                <div className="space-y-6">
                  <div className="grid gap-4">
                    {THEME_OPTIONS.map((theme) => {
                      const IconComponent = theme.icon;
                      return (
                        <div
                          key={theme.value}
                          className={`relative p-4 rounded-xl border cursor-pointer transition-all duration-200 ${
                            formData.theme_color === theme.value
                              ? "border-blue-500 bg-blue-50"
                              : "border-slate-200 hover:border-slate-300 bg-white"
                          }`}
                          onClick={() => {
                            setFormData({
                              ...formData,
                              theme_color: theme.value,
                            });
                            setTheme(theme.value);
                          }}
                        >
                          <div className="flex items-center gap-4">
                            <div
                              className={`w-10 h-10 rounded-lg bg-gradient-to-br ${theme.gradient} flex items-center justify-center`}
                            >
                              <IconComponent className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-medium text-slate-900">{theme.label}</h3>
                              <p className="text-sm text-slate-600">{theme.description}</p>
                            </div>
                            {formData.theme_color === theme.value && (
                              <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                                <Check className="w-3 h-3 text-white" />
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Navigation */}
              <div className="flex gap-3 pt-6 border-t border-slate-200">
                {step > 1 && (
                  <Button
                    variant="outline"
                    onClick={handleBack}
                    className="flex-1 h-12 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl font-medium"
                  >
                    Back
                  </Button>
                )}
                {step < 5 ? (
                  <Button
                    onClick={handleNext}
                    disabled={!isStepValid()}
                    className="flex-1 h-12 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Continue
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="flex-1 h-12 bg-green-500 hover:bg-green-600 text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating store...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Complete Setup
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}











