/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    // Disable all Next.js image optimization/processing for instant loads
    unoptimized: true,
    // Allow common remote sources used across the app
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'picsum.photos' },
    ],
    // Keep SVG allowance since UI may render SVGs
    dangerouslyAllowSVG: true,
  },
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  poweredByHeader: false,
  compress: true,
  // Fix module system conflicts
  webpack: (config) => {
    config.resolve = {
      ...config.resolve,
      fallback: {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      },
      alias: {
        ...(config.resolve?.alias || {}),
        // Prevent optional native bindings from being bundled
        'mongodb-client-encryption': false,
        '@mongodb-js/zstd': false,
        snappy: false,
        kerberos: false,
      },
    }
    // Also mark native module as external to avoid resolution
    config.externals = [...(config.externals || []), 'mongodb-client-encryption']
    return config
  },
}

export default nextConfig
