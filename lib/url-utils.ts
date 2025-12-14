export function getStoreUrl(slug: string, path: string = ""): string {
    // Check if we are in production
    // Note: This relies on NEXT_PUBLIC_BASE_DOMAIN env var or defaults
    // Since we don't have easy access to window on server components, this is tricky.
    // But for client-side links, we can check window.

    const isProduction = process.env.NODE_ENV === "production";
    const baseDomain = "ummahsquare.com.ng"; // Hardcoded as per user request for now

    if (isProduction) {
        // Return subdomain URL
        // Ensure path starts with / if it exists
        const cleanPath = path.startsWith("/") ? path : `/${path}`;
        const finalPath = path ? cleanPath : "";
        return `https://${slug}.${baseDomain}${finalPath}`;
    } else {
        // Return path-based URL for localhost
        // We assume relative path if running on client, or absolute if needed?
        // Let's return relative root path for simplicity in Next.js Link
        // Wait, absolute URL is safer for "Copy Link" features.
        // For navigation within the app, Next.js <Link> handles relative paths fine.
        // But we are switching domains in prod.

        // If we are strictly on localhost, we can use /store/slug
        return `/store/${slug}${path ? (path.startsWith("/") ? path : `/${path}`) : ""}`;
    }
}

export function getAbsoluteStoreUrl(slug: string, path: string = ""): string {
    const isBrowser = typeof window !== 'undefined';
    const isProduction = process.env.NODE_ENV === "production";
    const baseDomain = "ummahsquare.com.ng";

    if (isProduction) {
        return `https://${slug}.${baseDomain}${path.startsWith("/") ? path : `/${path}`}`;
    }

    // Localhost
    const origin = isBrowser ? window.location.origin : "http://localhost:3000";
    return `${origin}/store/${slug}${path.startsWith("/") ? path : `/${path}`}`;
}

export function getStorePath(slug: string, path: string = ""): string {
    const isProduction = process.env.NODE_ENV === "production";
    const cleanPath = path.startsWith("/") ? path : `/${path}`;

    if (isProduction) {
        // In production (subdomain), the store root is /.
        return cleanPath || "/";
    } else {
        // In dev (path-based), the store root is /store/slug.
        return `/store/${slug}${cleanPath}`;
    }
}
