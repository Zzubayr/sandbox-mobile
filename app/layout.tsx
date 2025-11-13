import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Analytics } from '@vercel/analytics/next'
import { ThemeProvider } from '@/lib/theme-context'
import { Toaster } from '@/components/ui/toaster'
import { SpotlightSearchProvider } from '@/components/providers/spotlight-search-provider'
import './globals.css'

export const metadata: Metadata = {
  title: 'Ummah Square - Multi-Vendor Marketplace',
  description: 'Create beautiful online catalogs for your business. Let customers browse and request products through WhatsApp.',
  generator: 'Ummah Square',
  manifest: '/manifest.json',
  themeColor: '#2B6DA9',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <ThemeProvider>
          {children}
          <Analytics />
          <Toaster />
          <SpotlightSearchProvider />
        </ThemeProvider>
      </body>
    </html>
  )
}
