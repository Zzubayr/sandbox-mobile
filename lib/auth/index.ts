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

export const auth = betterAuth({
  database: client ? mongodbAdapter(db, { client }) : mongodbAdapter(db),
  // Ensure Better Auth trusts your app origins for redirects and CSRF
  trustedOrigins: [
    process.env.NEXT_PUBLIC_SITE_URL || '',
    process.env.BETTER_AUTH_URL || '',
  ].filter(Boolean),
  emailAndPassword: {
    enabled: true,
    // Require users to verify email before auto sign-in on signup
    requireEmailVerification: true,
    // autoSignIn: true, // default when not requiring verification
    // Password reset email sender
    sendResetPassword: async ({ user, url }: { user: { email: string }; url: string }) => {
      if (!resend) return;
      await resend.emails.send({
        from: process.env.MAIL_FROM || 'no-reply@localhost',
        to: user.email,
        subject: 'Reset your Ummah Square password',
        html: `<p>We received a request to reset your password.</p><p><a href="${url}">Click here to reset your password</a></p><p>If you did not request this, you can ignore this email.</p>`
      });
    },
  },
  emailVerification: {
    // Optionally send verification on sign up; also triggered when requireEmailVerification is true
    sendOnSignUp: true,
    sendVerificationEmail: async ({ user, url }: { user: { email: string }; url: string }) => {
      if (!resend) return;
      await resend.emails.send({
        from: process.env.MAIL_FROM || 'no-reply@localhost',
        to: user.email,
        subject: 'Verify your Ummah Square email',
        html: `<p>Welcome to Ummah Square!</p><p><a href="${url}">Click here to verify your email</a></p>`
      });
    },
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
});
