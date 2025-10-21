import { Schema, model, models } from 'mongoose';

// Minimal, flexible schema for Better Auth users collection.
// Designed for reads; do not mutate unless you control the auth storage.
export interface AuthUser {
  // Better Auth public user id (string). May also be stored as Mongo _id.
  id?: string;
  email?: string;
  name?: string;
  image?: string;
  emailVerified?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
  // Allow arbitrary extra fields from auth provider
  [key: string]: any;
}

const UserSchema = new Schema<AuthUser>(
  {
    id: { type: String, index: true },
    email: { type: String, index: true },
    name: { type: String },
    image: { type: String },
    emailVerified: { type: Date },
  },
  {
    collection: 'user',
    strict: false, // auth adapter may add fields; keep flexible
    timestamps: false, // Better Auth manages its own timestamps
    toJSON: {
      virtuals: true,
      versionKey: false,
      transform(_doc, ret) {
        // Normalize id so callers can always read ret.id
        if (!ret.id && ret._id) ret.id = ret._id.toString();
        if (ret._id) delete ret._id;
      },
    },
  }
);

const User = models.User || model<AuthUser>('User', UserSchema);
export default User;

