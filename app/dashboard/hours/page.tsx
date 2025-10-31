"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toastHelpers } from "@/lib/toast-helpers";
import { Save, Clock, AlertCircle } from "lucide-react";

type Hours = { day: string; open: string; close: string; closed?: boolean };
const DAYS: Hours[] = [
  { day: 'monday', open: '09:00', close: '17:00', closed: false },
  { day: 'tuesday', open: '09:00', close: '17:00', closed: false },
  { day: 'wednesday', open: '09:00', close: '17:00', closed: false },
  { day: 'thursday', open: '09:00', close: '17:00', closed: false },
  { day: 'friday', open: '09:00', close: '17:00', closed: false },
  { day: 'saturday', open: '10:00', close: '15:00', closed: true },
  { day: 'sunday', open: '10:00', close: '15:00', closed: true },
];

export default function HoursPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [vendor, setVendor] = useState<any | null>(null);
  const [hours, setHours] = useState<Hours[]>(DAYS);

  useEffect(() => { (async () => {
    const res = await fetch('/api/dashboard/vendor', { cache: 'no-store' });
    const json = await res.json();
    if (json?.vendor) {
      setVendor(json.vendor);
      setHours(Array.isArray(json.vendor.business_hours) && json.vendor.business_hours.length ? json.vendor.business_hours : DAYS);
    }
    setLoading(false);
  })(); }, []);

  const update = (idx: number, patch: Partial<Hours>) => setHours(prev => prev.map((h, i) => i === idx ? { ...h, ...patch } : h));
  const onSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/dashboard/vendor', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ business_hours: hours }) });
      if (!res.ok) throw new Error(await res.text());
      toastHelpers.settingsSaved();
    } catch (e: any) { toastHelpers.saveError(e?.message || 'Failed to save'); } finally { setSaving(false); }
  };

  if (loading) return <div className="flex items-center justify-center py-12">Loading...</div>;
  if (!vendor) return null;

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Business Hours</h1>
          <p className="text-muted-foreground mt-1">Let customers know when you're available</p>
        </div>
        <Button onClick={onSave} disabled={saving} size="lg" className="bg-[#2B6DA9] hover:bg-[#20527F] text-white shadow-md">
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
      
      <Card className="shadow-lg border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-[#2B6DA9]" />
            Weekly Schedule
          </CardTitle>
          <CardDescription>Configure your opening and closing times for each day</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {hours.map((h, i) => (
            <div key={i} className="flex items-center gap-4 p-4 rounded-lg border hover:border-[#2B6DA9] transition-colors">
              <div className="w-32 flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={!h.closed}
                    onCheckedChange={(checked) => update(i, { closed: !checked })}
                  />
                  <span className="capitalize font-medium text-sm">{h.day}</span>
                </div>
              </div>
              
              {!h.closed ? (
                <div className="flex-1 grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Opening Time</Label>
                    <Input 
                      type="time" 
                      value={h.open} 
                      onChange={e => update(i, { open: e.target.value })} 
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Closing Time</Label>
                    <Input 
                      type="time" 
                      value={h.close} 
                      onChange={e => update(i, { close: e.target.value })} 
                      className="h-10"
                    />
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center gap-2 text-muted-foreground">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm">Closed on this day</span>
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
