import { betterAuth } from 'better-auth';
import { mongodbAdapter } from 'better-auth/adapters/mongodb';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/db/connection';

// Ensure Mongoose is connected before wiring the adapter
await connectToDatabase();

// Native Mongo 'Db' from the Mongoose connection
const db = mongoose.connection.db!;
// Optional: pass client to enable transactions if available
const client = (mongoose.connection as any).getClient?.();

export const auth = betterAuth({
database: client ? mongodbAdapter(db, { client }) : mongodbAdapter(db),
emailAndPassword: {
enabled: true,
// autoSignIn: true, // default; set false if you prefer email verification flows
},
socialProviders: { google: { clientId: process.env.GOOGLE_CLIENT_ID!, clientSecret: process.env.GOOGLE_CLIENT_SECRET! } }
});
