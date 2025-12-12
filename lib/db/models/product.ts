import mongoose, { Schema, model, models, Types } from "mongoose";

export type ProductStatus = "active" | "inactive" | "draft";

export interface ProductVariant {
  id?: string;
  sku?: string;
  attributes?: Record<string, any>;
  price?: number;
  cost?: number;
  stock?: number;
  weight?: string;
  images?: any[];
  status?: ProductStatus;
}

export interface Product {
  vendor_id: Types.ObjectId;
  category_id?: Types.ObjectId;
  sku?: string;
  title: string;
  description?: string;
  price: number;
  compare_at_price?: number;
  cost?: number;
  stock: number;
  stock_unit?: "units" | "kg" | "lb" | "meter" | "yard" | "piece" | "set" | "box" | "pack" | "dozen";
  safety_stock?: number;
  reorder_point?: number;
  allow_backorder?: boolean;
  max_per_order?: number;
  reserved_stock?: number;
  images: any[];
  colors?: string[];
  sizes?: string[];
  weight?: string; // e.g., "1.2 kg"
  attributes: Record<string, any>;
  variants?: ProductVariant[];
  status: ProductStatus;
  is_archived?: boolean;
  created_at?: Date;
  updated_at?: Date;
}

const VariantSchema = new Schema<ProductVariant>(
  {
    id: { type: String },
    sku: { type: String },
    attributes: { type: Schema.Types.Mixed },
    price: { type: Number },
    cost: { type: Number },
    stock: { type: Number, default: 0 },
    weight: { type: String },
    images: { type: [Schema.Types.Mixed], default: [] },
    status: { type: String, enum: ["active", "inactive", "draft"], default: "active" },
  },
  { _id: false }
);

const ProductSchema = new Schema<Product>(
  {
    vendor_id: { type: Schema.Types.ObjectId, ref: "Vendor", required: true, index: true },
    category_id: { type: Schema.Types.ObjectId, ref: "Category" },
    sku: { type: String, trim: true },
    title: { type: String, required: true, trim: true },
    description: { type: String },
    price: { type: Number, required: true },
    compare_at_price: { type: Number },
    cost: { type: Number },
    stock: { type: Number, default: 0, min: 0 },
    stock_unit: {
      type: String,
      enum: ["units", "kg", "lb", "meter", "yard", "piece", "set", "box", "pack", "dozen"],
      default: "units",
    },
    safety_stock: { type: Number, default: 0, min: 0 },
    reorder_point: { type: Number, default: 0, min: 0 },
    allow_backorder: { type: Boolean, default: false },
    max_per_order: { type: Number, default: 50, min: 1 },
    reserved_stock: { type: Number, default: 0, min: 0 },
    images: { type: [Schema.Types.Mixed], default: [] },
    colors: { type: [String], default: [] },
    sizes: { type: [String], default: [] },
    weight: { type: String },
    attributes: { type: Schema.Types.Mixed, default: {} },
    variants: { type: [VariantSchema], default: [] },
    status: { type: String, enum: ["active", "inactive", "draft"], default: "active" },
    is_archived: { type: Boolean, default: false },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    toJSON: {
      versionKey: false,
      virtuals: true,
      transform(_doc, ret) {
        if (ret._id) {
          ret.id = ret._id.toString();
          delete ret._id;
        }
        if (ret.vendor_id) ret.vendor_id = ret.vendor_id.toString();
        if (ret.category_id) ret.category_id = ret.category_id.toString();
        if (Array.isArray(ret.variants)) {
          ret.variants = ret.variants.map((v: any) => ({
            ...v,
            id: v.id || v._id?.toString?.(),
            _id: undefined,
          }));
        }
      },
    },
  }
);

ProductSchema.index({ vendor_id: 1, sku: 1 }, { unique: true, sparse: true });
ProductSchema.index({ vendor_id: 1, status: 1 });
ProductSchema.index({ vendor_id: 1, title: 1 });

// Ensure the latest schema is used in dev (Next.js hot reload)
if (mongoose.models.Product) {
  try { mongoose.deleteModel('Product') } catch {}
}
const ProductModel = model<Product>("Product", ProductSchema);
export default ProductModel;
