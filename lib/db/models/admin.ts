import { Schema, model, models } from 'mongoose';

export type AdminRole = 'admin' | 'super_admin';

export interface Admin {
user_id: string; // Better Auth user id
role: AdminRole;
permissions?: Record<string, any>;
created_at?: Date;
updated_at?: Date;
}

const AdminSchema = new Schema<Admin>(
{
user_id: { type: String, required: true, unique: true, index: true },
role: { type: String, enum: ['admin', 'super_admin'], default: 'admin' },
permissions: { type: Schema.Types.Mixed, default: {} },
},
{
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
}
);

const AdminModel = models.Admin || model<Admin>('Admin', AdminSchema);
export default AdminModel;