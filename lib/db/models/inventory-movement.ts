import { Schema, model, models, Types } from "mongoose";

export type InventoryMovementType =
  | "reserve"
  | "commit"
  | "release"
  | "adjust"
  | "archive"
  | "unarchive";

export interface InventoryMovement {
  vendor_id: Types.ObjectId;
  product_id: Types.ObjectId;
  type: InventoryMovementType;
  quantity: number; // positive for adding to available stock, negative for removing
  ref_id?: string; // e.g., request id
  note?: string;
  created_at?: Date;
  updated_at?: Date;
}

const InventoryMovementSchema = new Schema<InventoryMovement>(
  {
    vendor_id: { type: Schema.Types.ObjectId, ref: "Vendor", required: true, index: true },
    product_id: { type: Schema.Types.ObjectId, ref: "Product", required: true, index: true },
    type: { type: String, enum: ["reserve", "commit", "release", "adjust", "archive", "unarchive"], required: true },
    quantity: { type: Number, required: true },
    ref_id: { type: String },
    note: { type: String },
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
        if (ret.product_id) ret.product_id = ret.product_id.toString();
      },
    },
  }
);

const InventoryMovementModel =
  models.InventoryMovement || model<InventoryMovement>("InventoryMovement", InventoryMovementSchema);

export async function recordInventoryMovement(input: {
  vendorId: Types.ObjectId;
  productId: Types.ObjectId;
  type: InventoryMovementType;
  quantity: number;
  refId?: string;
  note?: string;
}) {
  try {
    await InventoryMovementModel.create({
      vendor_id: input.vendorId,
      product_id: input.productId,
      type: input.type,
      quantity: input.quantity,
      ref_id: input.refId,
      note: input.note,
    });
  } catch (err) {
    console.error("Failed to record inventory movement", err);
  }
}

export default InventoryMovementModel;
