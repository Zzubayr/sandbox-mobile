import { betterAuth } from 'better-auth';
import { mongodbAdapter } from 'better-auth/adapters/mongodb';
import { emailOTP } from 'better-auth/plugins/email-otp';
import mongoose from 'mongoose';
import { Resend } from 'resend';
import { connectToDatabase } from '@/lib/db/connection';

// Ensure Mongoose is connected before wiring the adapter
await connectToDatabase();

// Native Mongo 'Db' from the Mongoose connection
const db = mongoose.connection.db!;
// Optional: pass client to enable transactions if available
const client = (mongoose.connection as any).getClient?.();

// Outbound email (Resend)
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const mailFrom = process.env.MAIL_FROM || 'Ummah Square <no-reply@ummahsquare.com>';

const otpPlugin = emailOTP({
  otpLength: 6,
  expiresIn: 5 * 60,
  disableSignUp: true,
  async sendVerificationOTP({ email, otp, type }) {
    const purpose =
      type === 'sign-in'
        ? 'Sign in to Ummah Square'
        : type === 'forget-password'
          ? 'Reset your Ummah Square password'
          : 'Verify your email';
    const subject = `${otp} is your Ummah Square code`;
    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6">
        <p>${purpose}.</p>
        <p style="font-size: 24px; font-weight: bold; letter-spacing: 8px">${otp}</p>
        <p>This code will expire in 5 minutes. If you didn't request it, you can ignore this email.</p>
      </div>
    `;

    if (!resend) {
      console.warn(`[OTP] ${purpose} for ${email}: ${otp}`);
      return;
    }

    await resend.emails.send({
      from: mailFrom,
      to: email,
      subject,
      html,
    });
  },
});

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
  plugins: [otpPlugin],
});
