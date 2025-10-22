"use client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowRight, Check, Shield, ShoppingBag, BarChart3, Search, Quote, Globe, Eye, Target, Zap, Users, TrendingUp, Star, Sparkles, Rocket, Crown, Flame, Heart, Brain, ShieldCheck } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import logo2 from "@/public/logo2.svg"
import { Reveal } from "@/components/reveal"
import { useState } from "react"
import { useRouter } from "next/navigation"

// color tokens inlined directly to avoid template strings in JSX

export default function HomePage() {
  const [storeName, setStoreName] = useState("")
  const router = useRouter()

  const handleStoreNameSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (storeName.trim()) {
      router.push("/auth/signup")
    }
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans overflow-x-hidden">
      <style
        dangerouslySetInnerHTML={{
          __html: `
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600;700;800;900&family=Space+Grotesk:wght@300;400;500;600;700&family=JetBrains+Mono:wght@100;200;300;400;500;600;700;800&display=swap');
          
          .font-display { font-family: 'Space Grotesk', sans-serif; }
          .font-mono { font-family: 'JetBrains Mono', monospace; }
          
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-20px); }
          }
          
          @keyframes pulse-glow {
            0%, 100% { box-shadow: 0 0 20px rgba(59, 130, 246, 0.3); }
            50% { box-shadow: 0 0 40px rgba(59, 130, 246, 0.6); }
          }
          
          @keyframes gradient-shift {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          
          @keyframes text-shimmer {
            0% { background-position: -200% center; }
            100% { background-position: 200% center; }
          }
          
          @keyframes bounce-in {
            0% { transform: scale(0.3) rotate(-10deg); opacity: 0; }
            50% { transform: scale(1.05) rotate(5deg); }
            70% { transform: scale(0.9) rotate(-2deg); }
            100% { transform: scale(1) rotate(0deg); opacity: 1; }
          }
          
          @keyframes slide-up-fade {
            0% { transform: translateY(50px); opacity: 0; }
            100% { transform: translateY(0); opacity: 1; }
          }
          
          @keyframes wiggle {
            0%, 7%, 93%, 100% { transform: rotate(0deg); }
            15% { transform: rotate(5deg); }
            20% { transform: rotate(-4deg); }
            25% { transform: rotate(3deg); }
            30% { transform: rotate(-2deg); }
            35% { transform: rotate(1deg); }
          }
          
          .animate-float { animation: float 6s ease-in-out infinite; }
          .animate-pulse-glow { animation: pulse-glow 2s ease-in-out infinite; }
          .animate-gradient { animation: gradient-shift 3s ease infinite; }
          .animate-shimmer { 
            background: linear-gradient(90deg, #3b82f6, #8b5cf6, #3b82f6);
            background-size: 200% auto;
            animation: text-shimmer 2s linear infinite;
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
          }
          .animate-bounce-in { animation: bounce-in 0.8s ease-out; }
          .animate-slide-up { animation: slide-up-fade 0.6s ease-out; }
          .animate-wiggle { animation: wiggle 2s ease-in-out infinite; }
          
          .glass-effect {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
          }
          
          .neon-glow {
            box-shadow: 0 0 5px #3b82f6, 0 0 10px #3b82f6, 0 0 15px #3b82f6;
          }
          
          .text-gradient {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }
          
          .hover-lift {
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          }
          
          .hover-lift:hover {
            transform: translateY(-8px) scale(1.02);
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
          }
          html { scroll-behavior: smooth; }
        `,
        }}
      />

      <header className="fixed top-0 left-0 right-0 z-50 p-4">
        <div className="mx-auto w-full max-w-6xl">
          <div className="bg-white/95 backdrop-blur-sm rounded-full px-8 py-4 shadow-lg border border-white/20">
            <div className="flex items-center justify-between">
              <Link href="/" className="flex items-center">
                <Image src={logo2} alt="Logo" width={110} height={110} />
              </Link>
              <nav className="hidden md:flex items-center gap-8 text-sm">
                <Link
                  href="#about"
                  className="text-slate-700 hover:text-blue-600 transition-colors"
                >
                  About
                </Link>
                <Link
                  href="#features"
                  className="text-slate-700 hover:text-blue-600 transition-colors"
                >
                  Features
                </Link>
                <Link
                  href="#analytics"
                  className="text-slate-700 hover:text-blue-600 transition-colors"
                >
                  Projections
                </Link>
              </nav>
              <div className="flex items-center gap-4">
                <Link
                  href="/auth/login"
                  className="text-slate-700 hover:text-blue-600 transition-colors"
                >
                  Login
                </Link>
                <Link href="/auth/signup">
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-6 py-2">
                    Start selling
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section with Video Background */}
      <section className="relative min-h-screen overflow-hidden">
        {/* Video Background */}
        <div className="absolute inset-0 z-0">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
          >
            <source src="/umsq.mp4" type="video/mp4" />
          </video>
          {/* Subtle overlay to improve text readability */}
          <div className="absolute inset-0 bg-black/30" />
        </div>

        {/* Content positioned at bottom left */}
        <div className="absolute bottom-0 left-0 z-10 w-full">
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 pb-24 md:pb-12">
            <div className="max-w-2xl">
              <Reveal>
                <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight tracking-tight text-white mb-5 sm:mb-6 text-left">
                  Launch a premium storefront that looks sharp - and sells
                </h1>
                <p className="text-lg sm:text-xl md:text-xl text-white/95 max-w-2xl mb-7 sm:mb-8 text-left">
                  Turn browsers into buyers with a fast, thoughtfully designed
                  store. Clean visuals, clear UX, and just the tools you need to
                  grow.
                </p>

                {/* Store Name Input */}
                <div className="max-w-xl w-full">
                  <form onSubmit={handleStoreNameSubmit} className="relative">
                    <div className="relative bg-white rounded-full px-5 sm:px-6 py-3.5 sm:py-4 shadow-xl ring-1 ring-white/30">
                      <div className="flex items-center gap-3 sm:gap-4">
                        {/* Store icon */}
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 sm:w-7 sm:h-7 bg-blue-600 rounded-sm flex items-center justify-center">
                            <div className="w-3 h-2.5 sm:w-3.5 sm:h-3 bg-white rounded-sm"></div>
                          </div>
                          <span className="text-slate-700 text-base sm:text-lg font-medium">
                            My store
                          </span>
                        </div>

                        {/* Separator */}
                        <div className="hidden sm:block w-px h-6 bg-slate-300"></div>

                        {/* Input field */}
                        <input
                          type="text"
                          placeholder="Enter your store name"
                          value={storeName}
                          onChange={(e) => setStoreName(e.target.value)}
                          className="flex-1 min-w-0 outline-none text-slate-900 placeholder-slate-500 text-base sm:text-lg"
                        />

                        {/* Submit button */}
                        <button
                          type="submit"
                          className="w-10 h-10 sm:w-11 sm:h-11 bg-blue-600 hover:bg-blue-700 rounded-full flex items-center justify-center transition-colors"
                        >
                          <ArrowRight className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* Storefront Feature (Alt layout) */}
      <section
        className="py-20 bg-gradient-to-b from-slate-50 to-white scroll-mt-32 md:scroll-mt-20"
        id="features"
      >
        <div className="container mx-auto px-4 max-w-6xl grid md:grid-cols-2 gap-12 items-center">
          <Reveal>
            <div className="order-2 md:order-1 space-y-6">
              <span className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700 bg-blue-50 px-3 py-1 rounded-full">
                <ShoppingBag className="h-4 w-4" /> Premium Storefronts
              </span>
              <h2 className="text-3xl md:text-4xl font-display font-bold text-slate-900">
                Beautiful online stores, no design degree needed
              </h2>
              <p className="text-slate-600 text-lg">
                Launch a polished storefront in minutes. Flexible branding,
                modern layouts, and lightning-fast performance baked in.
              </p>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-700">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" /> Custom branding
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" /> Mobile-first
                  design
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" /> SEO-ready
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" /> Blazing fast
                </li>
              </ul>
            </div>
          </Reveal>
          <Reveal>
            <div className="order-1 md:order-2 relative">
              <div className="absolute inset-0 -z-10 blur-3xl opacity-40 bg-gradient-to-tr from-blue-200 via-purple-200 to-pink-200 rounded-[2rem]"></div>
              <div className="relative rounded-2xl overflow-hidden">
                <Image
                  src="/strf.gif"
                  alt="Storefront illustration"
                  width={960}
                  height={720}
                  className="w-full h-auto"
                />
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Reach Section (Inverted) */}
      <section className="py-20 bg-slate-900 text-white scroll-mt-32 ">
        <div className="container mx-auto px-4 max-w-6xl grid md:grid-cols-2 gap-12 items-center">
          <Reveal>
            <div className="relative">
              <div className="absolute inset-0 -z-10 blur-3xl opacity-30 bg-gradient-to-br from-indigo-600/30 via-blue-500/20 to-cyan-400/20 rounded-[2rem]"></div>
              <div className="relative rounded-2xl border border-white/10 bg-white/5 shadow-2xl overflow-hidden">
                <Image
                  src="/visible.gif"
                  alt="Audience reach illustration"
                  width={960}
                  height={720}
                  className="w-full h-auto"
                />
              </div>
            </div>
          </Reveal>
          <Reveal>
            <div className="space-y-6">
              <span className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-300 bg-cyan-400/10 px-3 py-1 rounded-full">
                <Globe className="h-4 w-4" /> Reach More Customers
              </span>
              <h2 className="text-3xl md:text-4xl font-display font-bold">
                Be visible where your customers already are
              </h2>
              <p className="text-slate-300 text-lg">
                Search‑optimized pages and shareable product links help new
                buyers discover you organically across the web.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl bg-white/5 p-4 border border-white/10">
                  <div className="flex items-center gap-2 text-cyan-300">
                    <Search className="h-4 w-4" /> SEO
                  </div>
                  <p className="text-sm text-slate-300 mt-1">
                    Structured data and fast loads.
                  </p>
                </div>
                <div className="rounded-xl bg-white/5 p-4 border border-white/10">
                  <div className="flex items-center gap-2 text-cyan-300">
                    <Users className="h-4 w-4" /> Social
                  </div>
                  <p className="text-sm text-slate-300 mt-1">
                    Shareable product previews.
                  </p>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Analytics Section (Cards) */}
      <section
        className="py-20 bg-white scroll-mt-32 md:scroll-mt-20"
        id="analytics"
      >
        <div className="container mx-auto px-4 max-w-6xl">
          <Reveal>
            <div className="grid lg:grid-cols-2 gap-10 items-center">
              <div className="space-y-6">
                <span className="inline-flex items-center gap-2 text-sm font-semibold text-amber-700 bg-amber-50 px-3 py-1 rounded-full">
                  <BarChart3 className="h-4 w-4" /> Simple Analytics
                </span>
                <h2 className="text-3xl md:text-4xl font-display font-bold text-slate-900">
                  Understand what’s working, not just what happened
                </h2>
                <p className="text-slate-600 text-lg">
                  Clear tracking of visits, requests and conversions helps you
                  focus on the moves that actually grow sales.
                </p>
                <div className="grid sm:grid-cols-3 gap-4">
                  <div className="rounded-xl border border-slate-200 p-4">
                    <div className="text-sm text-slate-500">Visits</div>
                    <div className="text-2xl font-bold text-slate-900">
                      12.4k
                    </div>
                    <div className="text-xs text-green-600 flex items-center gap-1 mt-1">
                      <TrendingUp className="h-3 w-3" /> +8.2%
                    </div>
                  </div>
                  <div className="rounded-xl border border-slate-200 p-4">
                    <div className="text-sm text-slate-500">Requests</div>
                    <div className="text-2xl font-bold text-slate-900">
                      1,089
                    </div>
                    <div className="text-xs text-green-600 flex items-center gap-1 mt-1">
                      <TrendingUp className="h-3 w-3" /> +4.1%
                    </div>
                  </div>
                  <div className="rounded-xl border border-slate-200 p-4">
                    <div className="text-sm text-slate-500">Conversion</div>
                    <div className="text-2xl font-bold text-slate-900">
                      7.9%
                    </div>
                    <div className="text-xs text-green-600 flex items-center gap-1 mt-1">
                      <TrendingUp className="h-3 w-3" /> +0.6%
                    </div>
                  </div>
                </div>
              </div>
              <div className="relative">
                <div className="absolute inset-0 -z-10 blur-3xl opacity-30 bg-gradient-to-tr from-amber-200 via-orange-200 to-pink-200 rounded-[2rem]"></div>
                <div className="relative rounded-2xl overflow-hidden">
                  <Image
                    src="/analytics.gif"
                    alt="Analytics illustration"
                    width={960}
                    height={720}
                    className="w-full h-auto"
                  />
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Final Quote & CTA */}
      <section className="bg-white py-24 md:scroll-mt-20" id="about">
        <div className="mx-auto w-full max-w-4xl px-4">
          <Reveal>
            <div className="text-center mb-16">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-8">
                <Star className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-4xl md:text-5xl font-display font-bold text-slate-800 mb-8 leading-tight">
                Ummah Square gives every brand the visibility and digital
                positioning they deserve
              </h2>
              <p className="text-xl text-slate-600 max-w-3xl mx-auto mb-12 leading-relaxed">
                Join thousands of successful businesses who've transformed their
                digital presence with Ummah Square. Your premium storefront
                awaits.
              </p>
            </div>
          </Reveal>

          <div className="text-center">
            <Reveal>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-12">
                <Link href="/auth/signup">
                  <Button
                    size="lg"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-12 py-6 text-xl font-semibold rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <span className="flex items-center gap-3">
                      <Rocket className="h-6 w-6" />
                      Start Your Journey
                      <ArrowRight className="h-6 w-6" />
                    </span>
                  </Button>
                </Link>
                <Link href="/auth/login">
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white px-12 py-6 text-xl font-semibold rounded-full transition-all duration-300"
                  >
                    <span className="flex items-center gap-3">
                      <Crown className="h-6 w-6" />
                      Sign In
                    </span>
                  </Button>
                </Link>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-slate-600 max-w-4xl mx-auto">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <Check className="h-6 w-6 text-blue-600" />
                  </div>
                  <span className="font-semibold">No Setup Fees</span>
                </div>
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <Crown className="h-6 w-6 text-blue-600" />
                  </div>
                  <span className="font-semibold">Premium Design</span>
                </div>
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <Heart className="h-6 w-6 text-blue-600" />
                  </div>
                  <span className="font-semibold">24/7 Support</span>
                </div>
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <ShieldCheck className="h-6 w-6 text-blue-600" />
                  </div>
                  <span className="font-semibold">Mobile Optimized</span>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>
    </div>
  );
}
