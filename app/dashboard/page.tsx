import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { connectToDatabase } from "@/lib/db/connection";
import Vendor from "@/lib/db/models/vendor";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, ShoppingCart, BarChart3, Settings, Store, Clock, Sparkles, Image as ImageIcon, ExternalLink } from "lucide-react";
import DashboardContent from "@/components/dashboard/dashboard-content";

export default async function DashboardIndex() {
  try {
    const { user } = await requireUser();
    await connectToDatabase();
    const vendor = await Vendor.findOne({ user_id: user.id }).lean();
    if (!vendor) redirect("/onboarding");

    const storePath = `/store/${vendor.store_slug}`;
    const isService = (vendor as any).business_type === 'services';

    if (isService) {
      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Service Dashboard</h1>
              <p className="text-muted-foreground">Manage your service storefront</p>
            </div>
            <Button asChild variant="outline"><Link href={storePath} target="_blank"><ExternalLink className="w-4 h-4 mr-2" />Preview Store</Link></Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card><CardHeader><CardTitle className="flex items-center gap-2"><Store className="w-4 h-4" />About & Contact</CardTitle><CardDescription>Update contact, address and description</CardDescription></CardHeader><CardContent><Button asChild><Link href="/dashboard/about">Open</Link></Button></CardContent></Card>
            <Card><CardHeader><CardTitle className="flex items-center gap-2"><Clock className="w-4 h-4" />Business Hours</CardTitle><CardDescription>Set opening and closing times</CardDescription></CardHeader><CardContent><Button asChild><Link href="/dashboard/hours">Open</Link></Button></CardContent></Card>
            <Card><CardHeader><CardTitle className="flex items-center gap-2"><Sparkles className="w-4 h-4" />Services & Rates</CardTitle><CardDescription>List your offerings and pricing</CardDescription></CardHeader><CardContent><Button asChild><Link href="/dashboard/rates">Open</Link></Button></CardContent></Card>
            <Card><CardHeader><CardTitle className="flex items-center gap-2"><ImageIcon className="w-4 h-4" />Gallery</CardTitle><CardDescription>Upload service images</CardDescription></CardHeader><CardContent><Button asChild><Link href="/dashboard/gallery">Open</Link></Button></CardContent></Card>
            <Card><CardHeader><CardTitle className="flex items-center gap-2"><Settings className="w-4 h-4" />Settings</CardTitle><CardDescription>Branding, logo, theme and more</CardDescription></CardHeader><CardContent><Button asChild variant="secondary"><Link href="/dashboard/settings">Open</Link></Button></CardContent></Card>
          </div>
        </div>
      )
    }

    // Product vendor rich dashboard content
    return <DashboardContent />
  } catch {
    redirect("/auth/login?next=/dashboard");
  }
}
