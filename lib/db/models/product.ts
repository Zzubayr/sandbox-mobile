import mongoose, { Schema, model, models, Types } from "mongoose";

export type ProductStatus = "active" | "inactive" | "draft";

export interface Product {
  vendor_id: Types.ObjectId;
  category_id?: Types.ObjectId;
  title: string;
  description?: string;
  price: number;
  stock: number;
  images: any[];
  colors?: string[];
  sizes?: string[];
  weight?: string; // e.g., "1.2 kg"
  attributes: Record<string, any>;
  status: ProductStatus;
  created_at?: Date;
  updated_at?: Date;
}

const ProductSchema = new Schema<Product>(
  {
    vendor_id: { type: Schema.Types.ObjectId, ref: "Vendor", required: true, index: true },
    category_id: { type: Schema.Types.ObjectId, ref: "Category" },
    title: { type: String, required: true, trim: true },
    description: { type: String },
    price: { type: Number, required: true },
    stock: { type: Number, default: 0 },
    images: { type: [Schema.Types.Mixed], default: [] },
    colors: { type: [String], default: [] },
    sizes: { type: [String], default: [] },
    weight: { type: String },
    attributes: { type: Schema.Types.Mixed, default: {} },
    status: { type: String, enum: ["active", "inactive", "draft"], default: "active" },
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
      },
    },
  }
);

// Ensure the latest schema is used in dev (Next.js hot reload)
if (mongoose.models.Product) {
  try { mongoose.deleteModel('Product') } catch {}
}
const ProductModel = model<Product>("Product", ProductSchema);
export default ProductModel;
