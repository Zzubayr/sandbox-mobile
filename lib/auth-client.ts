import { createAuthClient } from 'better-auth/react';

// Prefer relative URLs in the browser to avoid hardcoded localhost in
// packaged/mobile-webview builds. If an explicit public base URL is
// provided, we use it (e.g., on SSR-only contexts).
const explicitBaseURL = process.env.NEXT_PUBLIC_SITE_URL;

export const authClient = createAuthClient({
  baseURL: explicitBaseURL || undefined,
});
