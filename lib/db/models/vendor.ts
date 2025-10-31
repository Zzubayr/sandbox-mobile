import { Schema, model, models } from 'mongoose';

export type ThemeColor = 'blue' | 'green' | 'purple';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface Vendor {
  user_id: string; // Better Auth user id (string)
  email?: string;
  store_name: string;
  store_slug: string;
  description?: string;
  logo_url?: string;
  banner_url?: string;
  logo?: { url: string; public_id: string } | null;
  banner?: { url: string; public_id: string } | null;
  theme_color: ThemeColor;
  whatsapp_number?: string;
  // Social links
  facebook?: string;
  instagram?: string;
  twitter?: string;
  linkedin?: string;
  whatsapp?: string; // deeplink like https://wa.me/...
  is_active: boolean;
  approval_status: ApprovalStatus;
  admin_notes?: string;
  approved_by?: string; // admin user id (string)
  approved_at?: Date;
  business_type?: 'products' | 'services';
  // Business classification (industry taxonomy, not product categories)
  business_categories?: string[];
  business_subcategories?: string[];
  // Location
  location?: { type: 'Point'; coordinates: [number, number] };
  address?: string;
  placeId?: string;
  components?: {
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
    [key: string]: any;
  };
  // Service business specific
  contact_email?: string;
  business_hours?: Array<{
    day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
    open: string; // HH:mm
    close: string; // HH:mm
    closed?: boolean;
  }>;
  services_gallery?: Array<{ url: string; public_id?: string; caption?: string }>;
  service_rates?: Array<{ name: string; description?: string; price: number; unit?: string }>;
  created_at?: Date;
  updated_at?: Date;
}

const VendorSchema = new Schema<Vendor>({
  user_id: { type: String, required: true, index: true },
  email: { type: String, index: true },
  store_name: { type: String, required: true, trim: true },
  store_slug: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
  description: { type: String },
  logo_url: { type: String },
  banner_url: { type: String },
  logo: { type: Object, default: null },
  banner: { type: Object, default: null },
  theme_color: { type: String, enum: ['blue', 'green', 'purple'], default: 'blue' },
  whatsapp_number: { type: String },
  // Socials
  facebook: { type: String },
  instagram: { type: String },
  twitter: { type: String },
  linkedin: { type: String },
  whatsapp: { type: String },
  is_active: { type: Boolean, default: true },
  approval_status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  admin_notes: { type: String },
  approved_by: { type: String },
  approved_at: { type: Date },
  business_type: { type: String, enum: ['products', 'services'], default: 'products' },
  business_categories: { type: [String], default: undefined },
  business_subcategories: { type: [String], default: undefined },
  // GeoJSON Point [lng, lat]
  location: {
    type: { type: String as unknown as () => 'Point', enum: ['Point'], default: 'Point' } as any,
    coordinates: { type: [Number], default: undefined },
  } as any,
  address: { type: String },
  placeId: { type: String },
  components: { type: Object },
  contact_email: { type: String },
  business_hours: { type: [Object], default: undefined },
  services_gallery: { type: [Object], default: undefined },
  service_rates: { type: [Object], default: undefined },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  toJSON: {
    versionKey: false,
    virtuals: true,
    transform(_doc, ret) {
      if (ret._id) {
        ret.id = ret._id.toString();
        delete ret._id;
      }
    },
  },
});

// Geospatial index for location
VendorSchema.index({ location: '2dsphere' });

const Vendor = models.Vendor || model<Vendor>('Vendor', VendorSchema);
export default Vendor;

