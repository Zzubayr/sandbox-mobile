import { Schema, model, models, Types } from "mongoose";

export interface Category {
  vendor_id: Types.ObjectId;
  name: string;
  slug: string;
  description?: string;
  created_at?: Date;
  updated_at?: Date;
}

const CategorySchema = new Schema<Category>(
  {
    vendor_id: { type: Schema.Types.ObjectId, ref: "Vendor", required: true, index: true },
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true, lowercase: true },
    description: { type: String },
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
      },
    },
  }
);

CategorySchema.index({ vendor_id: 1, slug: 1 }, { unique: true });

const CategoryModel = models.Category || model<Category>("Category", CategorySchema);
export default CategoryModel;

