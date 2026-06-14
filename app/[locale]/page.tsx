'use client'
import { Link, useRouter } from "@/i18n/navigation"
import { useState, useEffect, useRef } from "react"
import { useTranslations } from 'next-intl'
import {
  ArrowRight,
  GraduationCap,
  FileText,
  Globe,
  Smartphone,
  Presentation,
  FileUser,
  Languages,
  Bug,
  Star,
  Zap,
  Clock,
  ArrowUpRight,
  Bot,
  Palette,
  ArrowLeft,
  ArrowUpLeft,
} from "lucide-react"
import StatsSection from '@/components/StatsSection'
import FAQSection from '@/components/FAQSection'
import { useLocale } from 'next-intl'
export default function Home() {
  const router = useRouter()
  const t = useTranslations('Home')
  const locale = useLocale()
  const isRTL = locale === 'ar'
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [isMounted, setIsMounted] = useState(false)
  const [selectedService, setSelectedService] = useState<string | null>(null)
  const isVisible = useRef(false)
  const [isMobile, setIsMobile] = useState(false)

useEffect(() => {
  const checkMobile = () => {
    setIsMobile(window.innerWidth < 1024)
  }

  checkMobile()
  window.addEventListener('resize', checkMobile)

  return () => window.removeEventListener('resize', checkMobile)
}, [])

useEffect(() => {
  let rafId: number

  const handleMouseMove = (e: MouseEvent) => {
    rafId = requestAnimationFrame(() => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    })
  }

  requestAnimationFrame(() => {
    setIsMounted(true)
    isVisible.current = true
  })

  window.addEventListener('mousemove', handleMouseMove, { passive: true })

  return () => {
    window.removeEventListener('mousemove', handleMouseMove)
    if (rafId) cancelAnimationFrame(rafId)
  }
}, [])

  const services = [
    {
      title: t('services.graduationProjects.title'),
      description: t('services.graduationProjects.description'),
      tag: t('services.graduationProjects.tag'),
      priceRange: "$250 – $1200",
      icon: GraduationCap,
      slug: "graduation-projects",
      color: "from-blue-500 to-cyan-500",
      darkColor: "from-blue-400 to-cyan-400",
    },
    {
      title: t('services.academicReports.title'),
      description: t('services.academicReports.description'),
      priceRange: "$40 – $250",
      icon: FileText,
      slug: "academic-reports",
      tag: null,
      color: "from-purple-500 to-pink-500",
      darkColor: "from-purple-400 to-pink-400",
    },
    {
      title: t('services.customWebsites.title'),
      description: t('services.customWebsites.description'),
      priceRange: "$500 – $3,000",
      icon: Globe,
      slug: "custom-websites",
      tag: null,
      color: "from-emerald-500 to-teal-500",
      darkColor: "from-emerald-400 to-teal-400",
    },
    {
      title: t('services.mobileApps.title'),
      description: t('services.mobileApps.description'),
      tag: t('services.mobileApps.tag'),
      priceRange: "$1000 – $8,000",
      icon: Smartphone,
      slug: "mobile-apps",
      color: "from-orange-500 to-red-500",
      darkColor: "from-orange-400 to-red-400",
    },
    {
      title: t('services.powerpoint.title'),
      description: t('services.powerpoint.description'),
      priceRange: "$40 – $300",
      icon: Presentation,
      slug: "powerpoint-presentations",
      tag: null,
      color: "from-rose-500 to-pink-600",
      darkColor: "from-rose-400 to-pink-500",
    },
    {
      title: t('services.cv.title'),
      description: t('services.cv.description'),
      priceRange: "$30 – $120",
      icon: FileUser,
      slug: "cv-resume-writing",
      tag: null,
      color: "from-amber-500 to-yellow-600",
      darkColor: "from-amber-400 to-yellow-500",
    },
    {
      title: t('services.translation.title'),
      description: t('services.translation.description'),
      priceRange: "$15 – $200",
      icon: Languages,
      slug: "translation",
      tag: null,
      color: "from-indigo-500 to-violet-600",
      darkColor: "from-indigo-400 to-violet-500",
    },
    {
      title: t('services.debugging.title'),
      description: t('services.debugging.description'),
      priceRange: "$50 – $500",
      icon: Bug,
      slug: "code-debugging",
      tag: null,
      color: "from-cyan-500 to-blue-600",
      darkColor: "from-cyan-400 to-blue-500",
    },
    {
  title: t('services.ai.title'),
  description: t('services.ai.description'),
  priceRange: "$300 – $5,000",
  icon: Bot,
  slug: "ai-automation",
  tag: null,
  color: "from-fuchsia-500 to-purple-600",
  darkColor: "from-fuchsia-400 to-purple-500",
},
{
  title: t('services.uiux.title'),
  description: t('services.uiux.description'),
  priceRange: "$150 – $1500",
  icon: Palette,
  slug: "ui-ux-design",
  tag: null,
  color: "from-pink-500 to-rose-600",
  darkColor: "from-pink-400 to-rose-500",
},
  ]

const trust = [
  { icon: Star, label: t('fiveStar'), sub: t('trustedClients') },
  { icon: Zap, label: t('fastDelivery'), sub: t('onTime') },
  { icon: Clock, label: t('support247'), sub: t('alwaysAvailable') },
]

  return (
    <main className="min-h-screen bg-background text-foreground overflow-x-hidden">
      
      {/* ─── ENHANCED HERO ─── */}
    <section className="relative min-h-[81vh] flex flex-col items-center justify-center px-6 pt-16 pb-10 text-center overflow-hidden">
        
        {/* Premium multi-layered background */}
        <div className="absolute inset-0">
          {/* Primary gradient */}
<div className="absolute inset-0 bg-[radial-gradient(ellipse_110%_80%_at_50%_0%,rgba(59,130,246,0.32),transparent_56%),radial-gradient(ellipse_75%_65%_at_72%_55%,rgba(168,85,247,0.20),transparent_60%),linear-gradient(to_bottom,var(--background),var(--background))]" />
          {/* Animated gradient orbs */}
          <div 
            className="absolute top-0 start-1/4 w-[600px] h-[600px] bg-blue-500/10 dark:bg-blue-400/10 rounded-full blur-[120px] animate-pulse"
            style={{
              transform: `translate(${mousePosition.x * 0.02}px, ${mousePosition.y * 0.02}px)`,
              transition: 'transform 0.8s cubic-bezier(0.17, 0.67, 0.83, 0.67)',
            }}
          />
          <div 
            className="absolute bottom-0 end-1/4 w-[500px] h-[500px] bg-purple-500/10 dark:bg-purple-400/10 rounded-full blur-[120px] animate-pulse delay-1000"
            style={{
              transform: `translate(${mousePosition.x * -0.01}px, ${mousePosition.y * -0.01}px)`,
              transition: 'transform 1s cubic-bezier(0.17, 0.67, 0.83, 0.67)',
            }}
          />
          <div 
            className="absolute top-1/2 start-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-cyan-500/5 dark:bg-cyan-400/10 rounded-full blur-[140px]"
            style={{
              transform: `translate(calc(-50% + ${mousePosition.x * 0.015}px), calc(-50% + ${mousePosition.y * 0.015}px))`,
              transition: 'transform 1.2s cubic-bezier(0.17, 0.67, 0.83, 0.67)',
            }}
          />
        </div>

        {/* Grid overlay with animation */}
        <div className="absolute inset-0">
          
        </div>
        {/* Premium headline with gradient animation */}
        <h1 className={`relative max-w-7xl px-4 text-5xl font-black leading-[1.3] tracking-[-0.025em] md:text-7xl lg:text-8xl transition-all duration-1000 delay-200 ${isMounted ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
          <span className="block text-foreground/90">{t('heroTitle1')}</span>
         <span className="block px-2 pb-3 bg-gradient-to-r from-blue-400 via-sky-400 to-cyan-300 dark:from-blue-400 dark:via-blue-300 dark:to-cyan-400 bg-clip-text text-transparent animate-gradient bg-[length:200%_auto]">
  {t('heroTitle2')}
</span>
        </h1>

         {/* Enhanced description */}
         <p className={`relative mt-8 max-w-3xl text-lg leading-relaxed text-slate-600 dark:text-slate-400 md:text-xl transition-all duration-1000 delay-300 ${isMounted ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
          {t('heroDescription')}
        </p>

        {/* Premium CTAs with enhanced hover effects */}
        <div className={`relative mt-12 flex flex-col items-center gap-4 sm:flex-row transition-all duration-1000 delay-400 ${isMounted ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
          <Link href="/orders">
            <button className="group relative h-14 overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-500 dark:to-blue-600 px-8 text-base font-semibold text-white shadow-[0_8px_32px_rgba(37,99,235,0.3)] dark:shadow-[0_8px_32px_rgba(37,99,235,0.4)] transition-all duration-300 hover:shadow-[0_12px_40px_rgba(37,99,235,0.5)] hover:scale-[1.03] flex items-center gap-2">
              <span className="relative z-10">{t('getStarted')}</span>
              {isRTL ? (
             <ArrowLeft className="relative z-10 h-4 w-4 transition-all duration-300 group-hover:-translate-x-1.5 group-hover:scale-110" />
              ) : (
            <ArrowRight className="relative z-10 h-4 w-4 transition-all duration-300 group-hover:translate-x-1.5 group-hover:scale-110" />
              )}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-400 dark:to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            </button>
          </Link>
          <Link href="/portfolio">
            <button className="group relative h-14 overflow-hidden rounded-2xl border-2 border-border/80 bg-background/50 backdrop-blur-sm px-8 text-base font-semibold text-foreground transition-all duration-300 hover:border-blue-500/50 hover:bg-blue-50/50 dark:hover:bg-blue-950/30 hover:shadow-lg flex items-center gap-2">
             {t('viewPortfolio')}
              {isRTL ? (
             <ArrowUpLeft className="h-4 w-4 text-muted-foreground transition-all duration-300 group-hover:text-foreground group-hover:-translate-x-0.5 group-hover:-translate-y-0.5" />
              ) : (
              <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-all duration-300 group-hover:text-foreground group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            )}
            </button>
          </Link>
        </div>

        {/* Premium trust strip with enhanced styling */}
<div className={`relative mt-14 flex flex-wrap items-center justify-center gap-8 md:gap-16 transition-all duration-1000 delay-500 ${isMounted ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
     {trust.map(({ icon: Icon, label, sub }) => (
            <div 
              key={label} 
              className="group flex flex-col items-center gap-2 p-4 rounded-xl hover:bg-blue-50/50 dark:hover:bg-blue-950/30 transition-all duration-300 hover:scale-105 cursor-default"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-500/10 to-cyan-500/10 dark:from-blue-400/10 dark:to-cyan-400/10 group-hover:from-blue-500/20 group-hover:to-cyan-500/20 transition-all duration-300">
                  <Icon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <span className="text-sm font-bold text-slate-800 dark:text-white/90">
                 {label}
                </span>
              </div>
           <span className="text-xs font-semibold text-slate-700 dark:text-slate-400">
             {sub}
           </span>
            </div>
          ))}
        </div>
      </section>

      {/* ─── ENHANCED STATS ─── */}
<div className="relative border-t-2 border-border/30 bg-gradient-to-r from-blue-50/50 via-background to-purple-50/50 dark:from-blue-950/20 dark:via-background dark:to-purple-950/20 backdrop-blur-xl">
     <StatsSection />
      </div>

      {/* ─── PREMIUM SERVICES ─── */}
    <section className="relative px-6 py-24 bg-[radial-gradient(ellipse_70%_45%_at_50%_0%,rgba(59,130,246,0.10),transparent_65%),linear-gradient(to_bottom,var(--background),color-mix(in_oklch,var(--muted)_45%,var(--background)),var(--background))] dark:bg-gradient-to-b dark:from-background dark:via-muted/20 dark:to-background">
        <div className="absolute inset-0">
          <div className="absolute top-0 start-0 end-0 h-px bg-gradient-to-r from-transparent via-blue-500/20 to-transparent" />
        </div>

       <div className="relative mx-auto max-w-[1500px]">
          {/* Enhanced section header */}
          <div className="mb-8 text-center">
            <h2 className="text-5xl font-black tracking-[-0.04em] text-foreground md:text-6xl bg-gradient-to-r from-foreground via-foreground/90 to-foreground bg-clip-text">
              {t('ourServices')}
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-muted-foreground/70">
             {t('servicesDescription')}
            </p>
          </div>

          {/* Enhanced services grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
            {services.map((service, index) => (
            <div
  key={service.slug}
 onClick={() => {
  if (isMobile) {
    setSelectedService(service.slug)
  }
}}
  className={`group relative flex flex-col rounded-3xl border-2 bg-card/75 dark:bg-card/60 backdrop-blur-xl p-6 transition-all duration-500 hover:-translate-y-2 hover:border-blue-500/30 hover:shadow-[0_20px_60px_rgba(37,99,235,0.15)] dark:hover:shadow-[0_20px_60px_rgba(37,99,235,0.25)] hover:bg-card/80 ${
   selectedService === service.slug && isMobile
  ? 'border-blue-500/30 shadow-[0_20px_60px_rgba(37,99,235,0.15)] dark:shadow-[0_20px_60px_rgba(37,99,235,0.25)] -translate-y-2'
  : 'border-border/40'
  }`}
                style={{
                  transitionDelay: `${index * 50}ms`,
                }}
              >
 {/* Gradient border on hover */}
<div
  className={`absolute inset-0 rounded-3xl bg-gradient-to-r from-blue-500/0 via-purple-500/0 to-cyan-500/0 transition-opacity duration-500 -z-10 blur-xl ${
    selectedService === service.slug && isMobile
      ? 'opacity-100'
      : 'opacity-0 group-hover:opacity-100'
  }`}
/>
                {/* Tag badge */}
                {service.tag && (
                  <span className={`absolute -top-3 end-4 rounded-full bg-gradient-to-r ${service.color} ${service.darkColor} px-4 py-1.5 text-[11px] font-bold uppercase tracking-widest text-white shadow-lg`}>
                    {service.tag}
                  </span>
                )}

                {/* Icon with gradient background */}
                <div className={`mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${service.color} ${service.darkColor} bg-opacity-10 shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-300`}>
                  <service.icon className="h-6 w-6 text-white" />
                </div>

                <h3 className="mb-2 text-lg font-bold text-card-foreground leading-tight group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors duration-300">
                  {service.title}
                </h3>
               <p className="mb-2 text-sm leading-relaxed text-muted-foreground/70 flex-1">
                  {service.description}
                </p>

                <div className="space-y-3">
                <span className="block text-2xl font-black text-foreground bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                  {service.priceRange}
                </span>

                  <Link href={`/orders?service=${service.slug}`}>
                    <button className="group/btn w-full rounded-xl bg-gradient-to-r from-blue-600/5 to-cyan-600/5 dark:from-blue-400/5 dark:to-cyan-400/5 border-2 border-border/50 py-3 text-sm font-semibold text-muted-foreground transition-all duration-300 hover:border-blue-500/40 hover:bg-gradient-to-r hover:from-blue-600/10 hover:to-cyan-600/10 dark:hover:from-blue-400/10 dark:hover:to-cyan-400/10 hover:text-blue-700 dark:hover:text-blue-300 hover:shadow-lg flex items-center justify-center gap-2">
                     {t('orderNow')}
                      {isRTL ? (
                     <ArrowLeft className="h-3.5 w-3.5 transition-all duration-300 group-hover/btn:-translate-x-1.5 group-hover/btn:scale-110" />
                    ) : (
                        <ArrowRight className="h-3.5 w-3.5 transition-all duration-300 group-hover/btn:translate-x-1.5 group-hover/btn:scale-110" />
                       )}
                    </button>
                  </Link>
                </div>

                {/* Subtle bottom gradient line */}
                <div className="absolute bottom-0 start-4 end-4 h-px bg-gradient-to-r from-transparent via-border/30 to-transparent group-hover:via-blue-500/30 transition-all duration-500" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── ENHANCED CTA / TRACK ─── */}
      <section className="relative px-6 py-24 overflow-hidden border-y-2 border-border/30 bg-gradient-to-b from-muted/50 via-background to-muted/50">
        {/* Animated background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-0 start-1/4 w-[400px] h-[400px] bg-blue-500/5 dark:bg-blue-400/5 rounded-full blur-[100px] animate-pulse" />
          <div className="absolute bottom-0 end-1/4 w-[400px] h-[400px] bg-purple-500/5 dark:bg-purple-400/5 rounded-full blur-[100px] animate-pulse delay-1000" />
        </div>

        <div className="relative mx-auto max-w-5xl">
          <div className="grid grid-cols-1 gap-16 md:grid-cols-2 md:gap-20 items-center">

            {/* Enhanced Left CTA */}
            <div className={`transition-all duration-1000 ${isMounted ? 'translate-x-0 opacity-100' : '-translate-x-8 opacity-0'}`}>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-blue-200/50 dark:border-blue-500/20 bg-blue-50/50 dark:bg-blue-950/30 backdrop-blur-sm mb-6">
                <Zap className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                <p className="text-xs font-bold uppercase tracking-[0.25em] text-blue-700 dark:text-blue-300">
                  {t('getStarted')}
                </p>
              </div>
              <h2 className="text-5xl font-black leading-tight tracking-[-0.04em] text-foreground md:text-6xl">
               {t('readyToBegin')}
                <span className="block bg-gradient-to-r from-blue-600 to-cyan-500 dark:from-blue-400 dark:to-cyan-400 bg-clip-text text-transparent">
                </span>
              </h2>
              <p className="mt-6 text-lg text-muted-foreground/70 leading-relaxed">
                {t('ctaDescription')}
              </p>
              <Link href="/orders">
                <button className="group mt-8 inline-flex h-14 items-center gap-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-500 dark:to-blue-600 px-8 text-base font-semibold text-white shadow-[0_8px_32px_rgba(37,99,235,0.3)] dark:shadow-[0_8px_32px_rgba(37,99,235,0.4)] transition-all duration-300 hover:shadow-[0_12px_40px_rgba(37,99,235,0.5)] hover:scale-[1.03]">
                 {t('startYourOrder')}
                  {isRTL ? (
  <ArrowLeft className="h-5 w-5 transition-all duration-300 group-hover:-translate-x-1.5 group-hover:scale-110" />
) : (
  <ArrowRight className="h-5 w-5 transition-all duration-300 group-hover:translate-x-1.5 group-hover:scale-110" />
)}
                </button>
              </Link>
            </div>

            {/* Enhanced Track Section */}
            <div className={`relative transition-all duration-1000 delay-200 ${isMounted ? 'translate-x-0 opacity-100' : 'translate-x-8 opacity-0'}`}>
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/30 via-purple-500/30 to-cyan-500/30 dark:from-blue-400/20 dark:via-purple-400/20 dark:to-cyan-400/20 rounded-2xl blur opacity-50 group-hover:opacity-75 transition duration-500" />
              <div className="group relative rounded-3xl border-2 border-border/40 bg-card/80 backdrop-blur-xl p-8 shadow-2xl transition-all duration-500 hover:-translate-y-2 hover:border-blue-500/30 hover:shadow-[0_25px_80px_rgba(37,99,235,0.22)] dark:hover:shadow-[0_25px_80px_rgba(37,99,235,0.32)]">
               <div className="pointer-events-none absolute inset-0 -z-10 rounded-3xl bg-gradient-to-r from-blue-500/10 via-cyan-500/10 to-purple-500/10 opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100" />
                <div className="absolute -top-4 start-6 rounded-full border-2 border-blue-200/50 dark:border-blue-500/20 bg-gradient-to-r from-blue-50 to-blue-100/50 dark:from-blue-950/50 dark:to-blue-900/30 backdrop-blur-xl px-4 py-1.5 text-xs font-bold text-blue-700 dark:text-blue-300 uppercase tracking-widest shadow-lg">
                  {t('trackOrder')}
                </div>
                <p className="mb-6 text-muted-foreground/70 text-sm leading-relaxed mt-4">
                  {t('trackDescription')}
                </p>
                <form


                 onSubmit={async (e) => {
  e.preventDefault()

  const input = document.getElementById('home-track-input') as HTMLInputElement
  const errorSpan = document.getElementById('home-track-error')
  const button = e.currentTarget.querySelector('button[type="submit"]') as HTMLButtonElement
  const orderId = input.value.trim()

  if (errorSpan) errorSpan.textContent = ''

  if (!orderId) {
    if (errorSpan) errorSpan.textContent = 'Please enter your Order ID.'
    return
  }

  const isValidObjectId = /^[a-fA-F0-9]{24}$/.test(orderId)

  if (!isValidObjectId) {
    if (errorSpan) errorSpan.textContent = 'Wrong Order ID format.'
    return
  }

  button.disabled = true

  try {
    const res = await fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId }),
    })

    const data = await res.json()

    if (data.success) {
      sessionStorage.setItem('trackResult', JSON.stringify(data))
       router.push(`/track?id=${orderId}&direct=true`)
    } else {
      if (errorSpan) errorSpan.textContent = 'Can’t find an order with this ID.'
    }
  } catch {
    if (errorSpan) errorSpan.textContent = 'Something went wrong. Please try again.'
  } finally {
    button.disabled = false
  }
}}
                  
                  className="space-y-4"
                >
                  <div className="relative">
                    <input
                      id="home-track-input"
                      type="text"
                      placeholder={t('trackPlaceholder')}
                      className="w-full rounded-xl border-2 border-border/50 bg-background/50 transition-all duration-300 hover:border-blue-500/30 hover:bg-background/80 backdrop-blur-sm px-5 py-4 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none transition-all duration-300 focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 focus:bg-background"
                    />
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/5 to-cyan-500/5 opacity-0 focus-within:opacity-100 transition-opacity duration-300 pointer-events-none" />
                  </div>
                  <button
                    type="submit"
                    className="group w-full rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-500 dark:to-blue-600 py-4 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_12px_40px_rgba(37,99,235,0.45)] flex items-center justify-center gap-2"
                  >
                   {t('trackButton')}
                    {isRTL ? (
  <ArrowLeft className="h-4 w-4 transition-all duration-300 group-hover:-translate-x-1.5 group-hover:scale-110" />
) : (
  <ArrowRight className="h-4 w-4 transition-all duration-300 group-hover:translate-x-1.5 group-hover:scale-110" />
)}
                  </button>
                  <span id="home-track-error" className="block text-xs font-medium text-red-500 dark:text-red-400"></span>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── ENHANCED FAQ ─── */}
      <div className="relative bg-gradient-to-b from-background via-muted/10 to-background">
        <div className="absolute top-0 start-0 end-0 h-px bg-gradient-to-r from-transparent via-blue-500/10 to-transparent" />
        <FAQSection />
      </div>

      {/* ─── PREMIUM FOOTER ─── */}
      <footer className="relative border-t-2 border-border/30 bg-gradient-to-b from-muted/50 to-background py-12 px-6 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-blue-500/5 to-transparent dark:from-blue-400/5" />
        <div className="relative">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="h-px w-8 bg-gradient-to-r from-transparent to-blue-500/50" />
            <div className="h-1.5 w-1.5 rounded-full bg-blue-500 dark:bg-blue-400 animate-pulse" />
            <div className="h-px w-8 bg-gradient-to-l from-transparent to-blue-500/50" />
          </div>
          <p className="text-sm font-medium text-muted-foreground/50">{t('footer')}</p>
        </div>
      </footer>

      <style jsx>{`
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient {
          animation: gradient 3s ease infinite;
          background-size: 200% 200%;
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in {
          animation: fade-in 1s ease-out;
        }
      `}</style>
    </main>
  )
}