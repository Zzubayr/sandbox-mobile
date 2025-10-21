"use client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowRight, Check, Shield, ShoppingBag, BarChart3 } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import logo from "@/public/logo.svg"
import { Reveal } from "@/components/reveal"

// color tokens inlined directly to avoid template strings in JSX

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans">
      
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b">
        <div className="mx-auto w-full max-w-7xl px-4">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <Image src={logo} alt="Sandbox" width={28} height={28} />
              <span className="text-lg font-semibold">Sandbox</span>
            </Link>
            <nav className="hidden md:flex items-center gap-8 text-sm">
              <Link href="/auth/login" className="hover:underline">Login</Link>
              <Link href="/auth/signup" className={"text-blue-600 font-medium hover:underline"}>Get Started</Link>
            </nav>
            <div className="md:hidden">
              <Link href="/auth/signup">
                <Button className={"bg-blue-600 hover:bg-blue-700 text-white"}>Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      
      <section className="relative overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-grid opacity-35 animate-grid-slow" />
          <div className="orb orb-blue animate-orb absolute -top-16 -left-16 h-72 w-72 rounded-full" />
          <div className="orb orb-blue animate-orb animate-orb-delay absolute -bottom-12 -right-12 h-80 w-80 rounded-full" />
          {/* drifting shapes */}
          <div className="shape shape-circle shape-drift-1 h-8 w-8 top-10 left-8" />
          <div className="shape shape-square shape-drift-2 h-10 w-10 top-24 right-12" />
          <div className="shape shape-triangle shape-drift-3 h-12 w-12 bottom-16 left-16" />
          <div className="shape shape-circle shape-blur shape-drift-2 h-6 w-6 bottom-24 right-24" />
          <div className="shape shape-square shape-drift-1 h-7 w-7 top-1/2 left-20" />
        </div>
        <div className="mx-auto w-full max-w-7xl px-4">
          <div className="grid items-center gap-10 py-16 md:grid-cols-2 md:py-24">
            <Reveal>
              <h1 className="text-4xl md:text-5xl font-semibold leading-tight tracking-tight">
                Launch a premium storefront that looks sharp - and sells
              </h1>
              <p className="mt-5 text-lg text-slate-600 max-w-xl">
                Turn browsers into buyers with a fast, thoughtfully designed store. Clean visuals, clear UX, and just the tools you need to grow.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <Link href="/auth/signup">
                  <Button size="lg" className={"bg-blue-600 hover:bg-blue-700 text-white"}>
                    Start Free <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/auth/login">
                  <Button size="lg" variant="outline" className="border-slate-300">Sign In</Button>
                </Link>
              </div>
              <ul className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm text-slate-600">
                <li className="flex items-center gap-2"><Check className={"text-blue-600 h-4 w-4"} /> Launch in days, not months</li>
                <li className="flex items-center gap-2"><Check className={"text-blue-600 h-4 w-4"} /> Looks premium, loads fast</li>
                <li className="flex items-center gap-2"><Check className={"text-blue-600 h-4 w-4"} /> Built to convert</li>
              </ul>
            </Reveal>
            <Reveal className="relative" delay={120}>
              <div className="rounded-xl border bg-white shadow-sm">
                <div className="aspect-[16/10] relative">
                  <Image
                    src="/dash.png"
                    alt="Storefront preview"
                    fill
                    unoptimized
                    className="rounded-xl object-cover"
                  />
                </div>
              </div>
              <div className="hidden md:block">
                <div className="absolute -bottom-6 -right-6 w-1/2 rounded-xl border bg-white shadow-sm">
                  <div className="aspect-[16/10] relative">
                    <Image
                      src="/store.png"
                      alt="Dashboard preview"
                      fill
                      unoptimized
                      className="rounded-xl object-cover"
                    />
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      
      <section className="border-y bg-white">
        <div className="mx-auto w-full max-w-7xl px-4 py-12">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <Reveal><Stat icon={ShoppingBag} title="Frictionless Storefront" desc="Clean product grids and fast browsing." /></Reveal>
            <Reveal delay={80}><Stat icon={Shield} title="Secure by Default" desc="Best practices baked in." /></Reveal>
            <Reveal delay={140}><Stat icon={BarChart3} title="Analytics Ready" desc="Insights that guide growth." /></Reveal>
          </div>
        </div>
      </section>

      {/* Product previews + trust strip */}
      <section>
        <div className="mx-auto w-full max-w-7xl px-4 py-16">
          <div className="mb-10 flex items-end justify-between">
            <div>
              <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">See it in action</h2>
              <p className="mt-2 text-slate-600">A focused experience customers understand immediately</p>
            </div>
            <Link href="/auth/signup" className={"text-blue-600 text-sm hover:underline"}>Create your store</Link>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <Reveal><PreviewCard title="Storefront" imageSrc="https://picsum.photos/seed/storefront/1200/800" alt="Storefront mockup" /></Reveal>
            <Reveal delay={80}><PreviewCard title="Dashboard" imageSrc="https://picsum.photos/seed/dashboard/1200/800" alt="Dashboard mockup" /></Reveal>
            <Reveal delay={140}><PreviewCard title="Product Page" imageSrc="https://picsum.photos/seed/product/1200/800" alt="Product page mockup" /></Reveal>
          </div>
          <div className="mt-12 grid grid-cols-2 gap-6 text-slate-500 md:grid-cols-4">
            <div className="text-sm">Trusted by growing retailers</div>
            <div className="text-sm">No setup fees</div>
            <div className="text-sm">Blue & white, no fluff</div>
            <div className="text-sm">Fast support</div>
          </div>
        </div>
      </section>

      
      <section className="border-t">
        <div className="mx-auto w-full max-w-7xl px-4 py-16">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Reveal><Feature title="Launch in days" desc="Skip the visual noise. Ship with a clean, credible brand." /></Reveal>
            <Reveal delay={80}><Feature title="Looks premium" desc="Thoughtful spacing and typography that inspire confidence." /></Reveal>
            <Reveal delay={140}><Feature title="Built to scale" desc="Modern Next.js stack and patterns you can extend." /></Reveal>
            <Reveal delay={200}><Feature title="Mobile-first" desc="Fast, responsive layouts that feel right everywhere." /></Reveal>
          </div>
        </div>
      </section>

      
      <section className="border-t bg-white">
        <div className="mx-auto w-full max-w-7xl px-4 py-16 text-center">
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">Ready to launch?</h2>
          <p className="mt-4 text-slate-600 max-w-2xl mx-auto">Stop wrestling with design. Ship a clean, credible store that sells.</p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Link href="/auth/signup">
              <Button size="lg" className={"bg-blue-600 hover:bg-blue-700 text-white"}>
                Get Started <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button size="lg" variant="outline" className="border-slate-300">Sign In</Button>
            </Link>
          </div>
        </div>
      </section>

      
      <footer className="border-t">
        <div className="mx-auto w-full max-w-7xl px-4 py-10">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center gap-3">
              <Image src={logo} alt="Sandbox" width={20} height={20} />
              <span className="text-sm">© {new Date().getFullYear()} Sandbox</span>
            </div>
            <div className="text-sm text-slate-600">Built with clarity - blue & white.</div>
          </div>
        </div>
      </footer>
    </div>
  )
}

function Stat({ icon: Icon, title, desc }: { icon: any; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className={"h-9 w-9 flex items-center justify-center rounded-md bg-blue-600 text-white"}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <div className="text-sm font-medium">{title}</div>
        <div className="text-sm text-slate-600">{desc}</div>
      </div>
    </div>
  )
}

function PreviewCard({ title, imageSrc, alt }: { title: string; imageSrc: string; alt: string }) {
  return (
    <Card className="overflow-hidden border">
      <div className="aspect-[16/10] relative bg-white">
        <Image src={imageSrc} alt={alt} fill unoptimized className="object-cover" />
      </div>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription className="text-sm text-slate-600">Clean, focused and fast.</CardDescription>
      </CardHeader>
    </Card>
  )
}

function Feature({ title, desc }: { title: string; desc: string }) {
  return (
    <Card className="border">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-slate-600 text-sm">{desc}</p>
      </CardContent>
    </Card>
  )
}
