import Script from 'next/script'

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  // Mapbox GL JS is loaded from CDN and CSS is linked here.
  const hasToken = !!process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
  return (
    <>
      {/* Mapbox GL CSS */}
      <link
        rel="stylesheet"
        href="https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css"
      />
      {/* Mapbox GL JS */}
      {hasToken ? (
        <Script
          src="https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.js"
          strategy="afterInteractive"
        />
      ) : null}
      {children}
    </>
  )
}
