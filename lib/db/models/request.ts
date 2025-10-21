import { Schema, model, models, Types } from "mongoose";

export type RequestStatus = "pending" | "completed" | "cancelled";

export interface RequestDoc {
  vendor_id: Types.ObjectId;
  customer_name: string;
  customer_phone: string;
  customer_note?: string;
  status: RequestStatus;
  total_amount: number;
  created_at?: Date;
  updated_at?: Date;
}

const RequestSchema = new Schema<RequestDoc>(
  {
    vendor_id: { type: Schema.Types.ObjectId, ref: "Vendor", required: true, index: true },
    customer_name: { type: String, required: true },
    customer_phone: { type: String, required: true },
    customer_note: { type: String },
    status: { type: String, enum: ["pending", "completed", "cancelled"], default: "pending" },
    total_amount: { type: Number, required: true },
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

const RequestModel = models.Request || model<RequestDoc>("Request", RequestSchema);
export default RequestModel;

