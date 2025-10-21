import { Schema, model, models, Types } from "mongoose";

export interface RequestItem {
  request_id: Types.ObjectId;
  product_id: Types.ObjectId;
  quantity: number;
  price: number;
  created_at?: Date;
  updated_at?: Date;
}

const RequestItemSchema = new Schema<RequestItem>(
  {
    request_id: { type: Schema.Types.ObjectId, ref: "Request", required: true, index: true },
    product_id: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true },
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
        if (ret.request_id) ret.request_id = ret.request_id.toString();
        if (ret.product_id) ret.product_id = ret.product_id.toString();
      },
    },
  }
);

const RequestItemModel = models.RequestItem || model<RequestItem>("RequestItem", RequestItemSchema);
export default RequestItemModel;

