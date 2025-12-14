"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/lib/theme-context";
import { toastHelpers } from "@/lib/toast-helpers";
import logo from "@/public/logo2.svg";
import Image from "next/image";
import { Loader2, Store, Palette, Phone, ArrowRight, Check, Sparkles, MapPin, Briefcase, Globe, Building2, Zap, Star, ChevronLeft } from "lucide-react";
import LocationPicker from "@/components/ui/location-picker";
import { getCategoryMap } from "@/lib/onboarding-categories";

const THEME_OPTIONS = [
  { value: "blue", label: "Ocean Blue", description: "Professional and trustworthy", color: "bg-[#2B6DA9]", gradient: "from-[#2B6DA9] to-[#20527F]", preview: "bg-gradient-to-br from-[#EBF3FA] to-[#D6E7F5]", icon: Globe },
  { value: "green", label: "Forest Green", description: "Natural and growth-focused", color: "bg-green-500", gradient: "from-green-400 to-green-600", preview: "bg-gradient-to-br from-green-50 to-green-100", icon: Building2 },
  { value: "purple", label: "Royal Purple", description: "Creative and premium", color: "bg-purple-500", gradient: "from-purple-400 to-purple-600", preview: "bg-gradient-to-br from-purple-50 to-purple-100", icon: Star },
];

const BUSINESS_TYPES = [
  { value: "products", label: "Products", description: "Sell physical or digital products", icon: Store },
  { value: "services", label: "Services", description: "Offer professional services", icon: Zap },
];

const generateStoreSlug = (storeName: string): string => (
  storeName.toLowerCase().trim().replace(/[^a-z0-9]/g, "") || "store"
);

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(false);
  const [formData, setFormData] = useState({
    store_name: "",
    tagline: "",
    description: "",
    whatsapp_number: "",
    theme_color: "blue" as "blue" | "green" | "purple",
    business_type: "products" as "products" | "services",
  });
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [nameAvailable, setNameAvailable] = useState<boolean | null>(null);
  const [nameChecking, setNameChecking] = useState(false);
  const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>([]);
  const [location, setLocation] = useState<{
    location: { type: 'Point'; coordinates: [number, number] };
    address?: string; placeId?: string; components?: any;
  } | null>(null);
  const router = useRouter();
  const { setTheme } = useTheme();

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

  // Reset picked categories when business type changes
  useEffect(() => {
    setSelectedCategories([])
    setSelectedSubcategories([])
  }, [formData.business_type])

  const handleNext = () => {
    if (step < 6) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async () => {
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
        tagline: formData.tagline || undefined,
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
        body: JSON.stringify({
          ...payload,
          business_categories: selectedCategories,
          business_subcategories: selectedSubcategories,
        }),
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
        // Require exactly one business category and at least one subcategory
        return selectedCategories.length === 1 && selectedSubcategories.length > 0;
      case 5:
        return formData.whatsapp_number.trim().length > 0;
      case 6:
        return true;
      default:
        return false;
    }
  };

  if (initialLoading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-slate-50">
        <div className="flex items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-[#2B6DA9]" />
          <span className="text-slate-600">Loading...</span>
        </div>
      </div>
    );
  }

  // Calculate progress percentage
  const progress = Math.round(((step - 1) / 5) * 100);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center py-6 sm:py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="w-full max-w-md space-y-6 sm:space-y-8">
        {/* Header Logo */}
        <div className="flex flex-col items-center justify-center">
            <div className="flex items-center gap-2 mb-6 sm:mb-8 max-w-48">
                <Image src={logo} alt="Ummah Square" />
                 {/* <span className="text-[#2B6DA9] font-semibold text-lg">Ummah Square</span> */}
            </div>
            
            {/* Progress Bar */}
            <div className="w-full mb-6 sm:mb-8">
                <div className="flex justify-between text-xs text-slate-500 mb-2 font-medium">
                    <span>Step {step} of 6</span>
                    <span>{progress}% Complete</span>
                </div>
                <div className="h-1 w-full bg-slate-200 rounded-full overflow-hidden">
                    <div 
                        className="h-full bg-[#2B6DA9] transition-all duration-500 ease-in-out" 
                        style={{ width: `${step === 1 ? 17 : progress}%` }} // Start with a little visible progress
                    />
                </div>
            </div>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-[1.5rem] sm:rounded-[2rem] shadow-[0_4px_24px_rgba(0,0,0,0.02)] p-6 sm:p-10 border border-slate-100 relative overflow-hidden transition-all duration-300">
             {/* Dynamic Icon Header */}
             <div className="flex justify-center mb-6 sm:mb-8 animate-in fade-in duration-300">
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-[#EBF3FA] rounded-2xl flex items-center justify-center">
                  {step === 1 && <Store className="w-7 h-7 sm:w-8 sm:h-8 text-[#2B6DA9]" />}
                  {step === 2 && <MapPin className="w-7 h-7 sm:w-8 sm:h-8 text-[#2B6DA9]" />}
                  {step === 3 && <Briefcase className="w-7 h-7 sm:w-8 sm:h-8 text-[#2B6DA9]" />}
                  {step === 4 && <Star className="w-7 h-7 sm:w-8 sm:h-8 text-[#2B6DA9]" />}
                  {step === 5 && <Phone className="w-7 h-7 sm:w-8 sm:h-8 text-[#2B6DA9]" />}
                  {step === 6 && <Palette className="w-7 h-7 sm:w-8 sm:h-8 text-[#2B6DA9]" />}
                </div>
             </div>

            {/* Step content container */}
            <div className={`text-center space-y-2 mb-6 sm:mb-8 transition-all duration-300 ${step === 1 ? 'mt-4 sm:mt-6' : ''}`}>
                  <h1 className="text-xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                    {step === 1 && "Start your journey"}
                    {step === 2 && "Where is your store located?"}
                    {step === 3 && "Tell us about your business"}
                    {step === 4 && "Select business category"}
                    {step === 5 && "How can customers reach you?"}
                    {step === 6 && "Choose your brand theme"}
                  </h1>
                  <p className="text-slate-500 text-sm sm:text-base font-normal">
                    {step === 1 && "Create your store identity"}
                    {step === 2 && "This helps us show your store to local customers"}
                    {step === 3 && "What describes your business best?"}
                    {step === 4 && "Pick a category that fits your business"}
                    {step === 5 && "We'll use this for order notifications"}
                    {step === 6 && "Pick a color that represents your brand"}
                  </p>
            </div>

            {/* Step 1 Content: Store Name & Tagline */}
            {step === 1 && (
                <div className="space-y-6 sm:space-y-8 min-h-[160px] flex flex-col justify-center">
                    <div className="space-y-2 text-left animate-in slide-in-from-bottom-2 duration-500">
                        <Label htmlFor="store_name" className="text-sm font-semibold text-slate-700 ml-1">Store Name</Label>
                        <Input
                            id="store_name"
                            placeholder="e.g., Nexatage"
                            value={formData.store_name}
                            onChange={(e) => setFormData({ ...formData, store_name: e.target.value })}
                            className="h-12 sm:h-14 px-4 text-base sm:text-lg bg-white border-slate-200 focus:border-[#2B6DA9] focus:ring-[#2B6DA9]/20 rounded-xl transition-all font-bold"
                            autoFocus
                        />
                        {formData.store_name && (
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between ml-1 mt-2 gap-2 sm:gap-0">
                                <p className={`text-sm ${nameAvailable === false ? 'text-red-500' : 'text-slate-400'}`}>
                                    {nameChecking ? 'Checking...' : nameAvailable === false ? 'This name is taken' : 'Good choice!'}
                                </p>
                                {nameAvailable !== false && (
                                    <div className="flex items-center text-sm text-slate-500 bg-slate-100 px-2 py-1 rounded-md max-w-full overflow-x-auto">
                                        <div className="flex items-center whitespace-nowrap">
                                            <span className="font-semibold text-slate-900">
                                                {generateStoreSlug(formData.store_name)}
                                            </span>
                                            <span className="text-slate-400">.ummahsquare.com.ng</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                     <div className="space-y-2 text-left animate-in slide-in-from-bottom-3 duration-500 delay-100">
                        <div className="flex justify-between items-center ml-1">
                            <Label htmlFor="tagline" className="text-sm font-semibold text-slate-700">Tagline <span className="text-slate-400 font-normal"></span></Label>
                            <span className={`text-xs ${formData.tagline.length > 60 ? 'text-red-500' : 'text-slate-400'}`}>
                                {formData.tagline.length}/60
                            </span>
                        </div>
                        <Input
                            id="tagline"
                            placeholder="Your memorable, elevator pitch"
                            value={formData.tagline || ""}
                            onChange={(e) => {
                                if (e.target.value.length <= 60) {
                                    setFormData({ ...formData, tagline: e.target.value })
                                }
                            }}
                            className="h-12 px-4 text-base bg-white border-slate-200 focus:border-[#2B6DA9] focus:ring-[#2B6DA9]/20 rounded-xl transition-all"
                        />
                    </div>

                    <div className="space-y-2 text-left animate-in slide-in-from-bottom-4 duration-500 delay-200">
                        <div className="flex justify-between items-center ml-1">
                            <Label htmlFor="description" className="text-sm font-semibold text-slate-700">Business Description</Label>
                             <span className={`text-xs ${formData.description.length > 120 ? 'text-red-500' : 'text-slate-400'}`}>
                                {formData.description.length}/120
                            </span>
                        </div>
                        <Textarea
                            id="description"
                            placeholder="Briefly describe what you offer..."
                            value={formData.description}
                            onChange={(e) => {
                                if (e.target.value.length <= 120) {
                                    setFormData({ ...formData, description: e.target.value })
                                }
                            }}
                            className="min-h-[80px] px-4 py-3 text-base bg-white border-slate-200 focus:border-[#2B6DA9] focus:ring-[#2B6DA9]/20 rounded-xl resize-none transition-all"
                        />
                    </div>
                </div>
            )}
            

            {/* Step 2: Location */}
            {step === 2 && (
                <div className="space-y-5 sm:space-y-6">
                    <div className="space-y-2 text-left">
                        <Label className="text-sm font-semibold text-slate-700 ml-1">Business Location</Label>
                        <div className="relative">
                           <LocationPicker 
                               value={location ?? undefined} 
                               onChange={setLocation as any} 
                               placeholder="Search for your business location..."
                           />
                        </div>
                         <div className="flex items-center gap-3 p-4 bg-blue-50 text-blue-700 rounded-xl text-sm border border-blue-100 mt-4">
                            <div className="shrink-0">
                                <MapPin className="w-5 h-5" />
                            </div>
                            <p>
                                <span className="font-semibold">Tip:</span> Precise location helps local customers find you easily.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Step 3: Business Type & Description */}
            {step === 3 && (
                <div className="space-y-6">
                     <div className="space-y-4">
                         {BUSINESS_TYPES.map((type) => {
                             const IconComponent = type.icon;
                             const isSelected = formData.business_type === type.value;
                             return (
                                <div
                                    key={type.value}
                                    onClick={() => setFormData({ ...formData, business_type: type.value })}
                                    className={`group relative flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 ease-out
                                        ${isSelected 
                                            ? "border-[#2B6DA9] bg-[#EBF3FA] shadow-sm" 
                                            : "border-slate-100 hover:border-slate-300 bg-white hover:bg-slate-50"
                                        }
                                    `}
                                >
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors
                                         ${isSelected ? "bg-[#2B6DA9] text-white" : "bg-slate-100 text-slate-500 group-hover:bg-slate-200"}
                                    `}>
                                         <IconComponent className="w-6 h-6" />
                                    </div>
                                    <div className="ml-4 text-left flex-1">
                                        <h3 className={`font-semibold text-base mb-0.5 ${isSelected ? "text-slate-900" : "text-slate-700"}`}>
                                            {type.label}
                                        </h3>
                                        <p className="text-sm text-slate-500">
                                            {type.description}
                                        </p>
                                    </div>
                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all
                                        ${isSelected 
                                            ? "border-[#2B6DA9] bg-[#2B6DA9]" 
                                            : "border-slate-300 bg-transparent"
                                        }
                                    `}>
                                        {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                                    </div>
                                </div>
                             );
                         })}
                     </div>
                </div>
            )}

            {/* Step 4: Categories */}
            {step === 4 && (
                <div className="space-y-6 sm:space-y-8 text-left">
                    <div className="space-y-4">
                        <Label className="text-sm font-semibold text-slate-700 ml-1">Business Category</Label>
                        <div className="flex flex-wrap gap-2.5">
                            {Object.keys(getCategoryMap(formData.business_type)).map((cat) => {
                                const active = selectedCategories.includes(cat);
                                return (
                                    <button
                                        key={cat}
                                        type="button"
                                        onClick={() => {
                                            if (active) {
                                                setSelectedCategories([]);
                                                setSelectedSubcategories([]);
                                            } else {
                                                setSelectedCategories([cat]);
                                                setSelectedSubcategories([]);
                                            }
                                        }}
                                        className={`px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-200 border
                                            ${active 
                                                ? "bg-[#2B6DA9] text-white border-[#2B6DA9] shadow-md shadow-blue-500/20" 
                                                : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                                            }
                                        `}
                                    >
                                        {cat}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {selectedCategories.length > 0 && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                            <Label className="text-sm font-semibold text-slate-700 ml-1">
                                Subcategories <span className="text-slate-400 font-normal ml-1 text-xs">select all that apply</span>
                            </Label>
                            <div className="flex flex-wrap gap-2">
                                {selectedCategories.flatMap((cat) => getCategoryMap(formData.business_type)[cat] || []).map((sub) => {
                                    const active = selectedSubcategories.includes(sub);
                                    return (
                                        <button
                                            key={sub}
                                            type="button"
                                            onClick={() => setSelectedSubcategories((prev) => active ? prev.filter(s => s !== sub) : [...prev, sub])}
                                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 border
                                                ${active 
                                                    ? "bg-[#EBF3FA] text-[#2B6DA9] border-[#2B6DA9]" 
                                                    : "bg-slate-50 text-slate-600 border-transparent hover:bg-slate-100"
                                                }
                                            `}
                                        >
                                            {sub}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Step 5: Contact Details */}
            {step === 5 && (
                <div className="space-y-5 sm:space-y-6">
                    <div className="space-y-2 text-left">
                        <Label htmlFor="whatsapp" className="text-sm font-semibold text-slate-700 ml-1">WhatsApp Number</Label>
                        <div className="relative">
                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <Input
                                id="whatsapp"
                                placeholder="+1 (555) 000-0000"
                                value={formData.whatsapp_number}
                                onChange={(e) => setFormData({ ...formData, whatsapp_number: e.target.value })}
                                className="h-12 sm:h-14 pl-12 text-base sm:text-lg bg-white border-slate-200 focus:border-[#2B6DA9] focus:ring-[#2B6DA9]/20 rounded-xl transition-all"
                                autoFocus
                            />
                        </div>
                        <p className="text-sm text-slate-500 ml-1">
                            We'll send order notifications to this number. 
                        </p>
                    </div>
                </div>
            )}

            {/* Step 6: Theme Selection */}
            {step === 6 && (
                <div className="space-y-6">
                    <div className="grid gap-4">
                        {THEME_OPTIONS.map((theme) => {
                            const IconComponent = theme.icon;
                            const isSelected = formData.theme_color === theme.value;
                            return (
                                <div
                                    key={theme.value}
                                    onClick={() => {
                                        setFormData({ ...formData, theme_color: theme.value });
                                        setTheme(theme.value);
                                    }}
                                    className={`group relative flex items-center p-4 rounded-2xl border-2 cursor-pointer transition-all duration-300
                                        ${isSelected 
                                            ? "border-[#2B6DA9] bg-[#EBF3FA] shadow-sm transform scale-[1.01]" 
                                            : "border-slate-100 hover:border-slate-300 bg-white hover:bg-slate-50"
                                        }
                                    `}
                                >
                                    <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center transition-all bg-gradient-to-br ${theme.gradient} shadow-lg shadow-black/5`}>
                                        <IconComponent className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                                    </div>
                                    <div className="ml-4 sm:ml-5 text-left flex-1">
                                        <h3 className="font-bold text-base sm:text-lg text-slate-900 mb-0.5">
                                            {theme.label}
                                        </h3>
                                        <p className="text-xs sm:text-sm text-slate-500 font-medium">
                                            {theme.description}
                                        </p>
                                    </div>
                                    <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full border-2 flex items-center justify-center transition-all
                                        ${isSelected 
                                            ? "border-[#2B6DA9] bg-[#2B6DA9]" 
                                            : "border-slate-300 bg-transparent"
                                        }
                                    `}>
                                        {isSelected && <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Navigation Buttons */}
            <div className="mt-8 sm:mt-10 flex gap-3">
                 {step > 1 && (
                     <Button
                        variant="ghost"
                        onClick={handleBack}
                        className="flex-1 h-12 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-semibold"
                     >
                         Back
                     </Button>
                 )}
                 <Button
                    onClick={step === 6 ? handleSubmit : handleNext}
                    disabled={(!isStepValid() && step === 1) || loading} 
                    className={`flex-1 h-12 rounded-xl font-semibold shadow-lg shadow-blue-900/5 transition-all
                        ${step === 1 ? 'w-full' : ''}
                        ${loading ? 'opacity-70 cursor-wait' : ''}
                    `}
                    style={{ backgroundColor: '#2B6DA9' }}
                 >
                     {loading ? (
                         <Loader2 className="w-5 h-5 animate-spin" />
                     ) : step === 6 ? (
                         "Complete Setup"
                     ) : (
                         step === 1 ? "Continue" : "Continue"
                     )}
                 </Button>
            </div>
             
             {step === 1 && (
                 <p className="mt-6 text-center text-xs text-slate-400">
                    You can always change this later
                 </p>
             )}

        </div>
        
        {/* Footer Support Link */}
        <div className="text-center">
             <p className="text-sm text-slate-400">
                 Need help? <a href="#" className="text-[#2B6DA9] font-medium hover:underline">View guide</a>
             </p>
        </div>
      </div>
    </div>
  );
}

