import { betterAuth } from 'better-auth';
import { Resend } from 'resend';
import { mongodbAdapter } from 'better-auth/adapters/mongodb';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/db/connection';

// Ensure Mongoose is connected before wiring the adapter
await connectToDatabase();

// Native Mongo 'Db' from the Mongoose connection
const db = mongoose.connection.db!;
// Optional: pass client to enable transactions if available
const client = (mongoose.connection as any).getClient?.();

// Outbound email (Resend)
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const resolvedBaseURL =
  process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
const cookieDomain = process.env.BETTER_AUTH_COOKIE_DOMAIN || undefined;

export const auth = betterAuth({
  database: client ? mongodbAdapter(db, { client }) : mongodbAdapter(db),
  // CRITICAL: baseURL is required for generating valid email verification and password reset links
  baseURL: resolvedBaseURL,
  // CRITICAL: secret is required for signing tokens (password reset, email verification, etc.)
  secret: process.env.BETTER_AUTH_SECRET || process.env.AUTH_SECRET,
  // Ensure Better Auth trusts your app origins for redirects and CSRF
  trustedOrigins: [
    process.env.NEXT_PUBLIC_SITE_URL || '',
    process.env.BETTER_AUTH_URL || '',
  ].filter(Boolean),
  advanced: {
    cookies: {
      sameSite: 'none',
      secure: resolvedBaseURL.startsWith('https://'),
      domain: cookieDomain,
    },
  },
  emailAndPassword: {
    enabled: true,
    // Do NOT require verification; sign in immediately on signup
    requireEmailVerification: false,
    // Disable password reset emails entirely
    sendResetPassword: undefined as any,
  },
  // Disable verification emails entirely
  emailVerification: {
    sendOnSignUp: false,
    sendVerificationEmail: undefined as any,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
});
