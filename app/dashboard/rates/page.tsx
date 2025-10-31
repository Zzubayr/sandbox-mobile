"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Trash2, Plus, Save, DollarSign, Sparkles } from "lucide-react";
import { toastHelpers } from "@/lib/toast-helpers";

type Rate = { name: string; description?: string; price: number | string; unit?: string };

export default function RatesPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [vendor, setVendor] = useState<any | null>(null);
  const [rates, setRates] = useState<Rate[]>([]);

  useEffect(() => { (async () => {
    const res = await fetch('/api/dashboard/vendor', { cache: 'no-store' });
    const json = await res.json();
    if (json?.vendor) { setVendor(json.vendor); setRates(Array.isArray(json.vendor.service_rates) ? json.vendor.service_rates : []); }
    setLoading(false);
  })(); }, []);

  const addRate = () => setRates(prev => [...prev, { name: '', description: '', price: '', unit: '' }]);
  const removeRate = (i: number) => setRates(prev => prev.filter((_, idx) => idx !== i));
  const updateRate = (i: number, patch: Partial<Rate>) => setRates(prev => prev.map((r, idx) => idx === i ? { ...r, ...patch } : r));

  const onSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/dashboard/vendor', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ service_rates: rates.filter(r => r.name && r.price !== '') }) });
      if (!res.ok) throw new Error(await res.text());
      toastHelpers.settingsSaved();
    } catch (e: any) { toastHelpers.saveError(e?.message || 'Failed to save'); } finally { setSaving(false); }
  };

  if (loading) return <div className="flex items-center justify-center py-12">Loading...</div>;
  if (!vendor) return null;

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Services & Rates</h1>
          <p className="text-muted-foreground mt-1">Define your services and pricing</p>
        </div>
        <Button onClick={onSave} disabled={saving} size="lg" className="bg-[#2B6DA9] hover:bg-[#20527F] text-white shadow-md">
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
      
      <Card className="shadow-lg border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#2B6DA9]" />
            Your Service Offerings
          </CardTitle>
          <CardDescription>Add all the services you provide with their pricing details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {rates.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <DollarSign className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="mb-4">No services added yet</p>
              <Button onClick={addRate} variant="outline" size="lg">
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Service
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {rates.map((r, i) => (
                  <Card key={i} className="shadow-md border-2 border-slate-100 hover:border-[#2B6DA9] transition-colors">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#2B6DA9] text-white text-sm font-bold">
                            {i + 1}
                          </div>
                          <span className="text-sm text-muted-foreground">Service {i + 1}</span>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => removeRate(i)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2 md:col-span-2">
                          <Label className="font-medium">Service Name *</Label>
                          <Input 
                            value={r.name} 
                            onChange={e => updateRate(i, { name: e.target.value })} 
                            placeholder="e.g., Basic Consultation, Premium Package"
                            className="h-11"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label className="font-medium">Price (NGN) *</Label>
                          <div className="relative">
                            <span className="absolute left-3 top-3 text-muted-foreground">₦</span>
                            <Input 
                              type="number" 
                              min={0} 
                              value={r.price} 
                              onChange={e => updateRate(i, { price: e.target.value })} 
                              placeholder="0"
                              className="pl-8 h-11"
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label className="font-medium">Unit (optional)</Label>
                          <Input 
                            value={r.unit || ''} 
                            onChange={e => updateRate(i, { unit: e.target.value })} 
                            placeholder="hour, session, month"
                            className="h-11"
                          />
                        </div>
                        
                        <div className="space-y-2 md:col-span-2">
                          <Label className="font-medium">Description (optional)</Label>
                          <Textarea 
                            value={r.description || ''} 
                            onChange={e => updateRate(i, { description: e.target.value })} 
                            placeholder="Describe what's included in this service..."
                            rows={3}
                            className="resize-none"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              <Button onClick={addRate} variant="outline" size="lg" className="w-full border-dashed border-2">
                <Plus className="w-4 h-4 mr-2" />
                Add Another Service
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
