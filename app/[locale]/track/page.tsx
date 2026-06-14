'use client'
import { useState, useEffect, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useRouter } from '@/i18n/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { showToast } from '@/components/ui/toast'
import { CardSkeleton } from '@/components/ui/skeleton'
import { useTranslations,useLocale } from 'next-intl'

import {
  ArrowRight,
  Search,
  Package,
  Clock,
  CheckCircle2,
  FileText,
  Calendar,
  DollarSign,
  ChevronRight,
  Loader2,
  ArrowLeft,
   ChevronLeft
} from 'lucide-react'
import { Link } from '@/i18n/navigation'
import PremiumPageShell from '@/components/PremiumPageShell'

const getServiceName = (service: string, t: ReturnType<typeof useTranslations>) => {
  const services: Record<string, string> = {
    'graduation-projects': t('services.graduationProjects'),
    'academic-reports': t('services.academicReports'),
    'custom-websites': t('services.customWebsites'),
    'mobile-apps': t('services.mobileApps'),
    'powerpoint-presentations': t('services.powerpoint'),
    'cv-resume-writing': t('services.cv'),
    'translation': t('services.translation'),
    'code-debugging': t('services.debugging'),
    'ai-automation': t('services.ai'),
    'ui-ux-design': t('services.uiux'),
  }

  return services[service] || service
}

interface OrderData {
  _id: string
  service: string
  requirements: string
  status: string
  price: number
  finalPrice?: number
  paymentStatus?: string
  depositAmount?: number
  remainingAmount?: number
  createdAt: string
  updatedAt: string
}

function TrackOrderContent() {
  const t = useTranslations('Track')
  const STATUS_STEPS = [
  {
    key: 'pending',
    label: t('status.pending'),
    icon: Clock,
  },
  {
    key: 'in-progress',
    label: t('status.inProgress'),
    icon: FileText,
  },
  {
    key: 'completed',
    label: t('status.completed'),
    icon: CheckCircle2,
  },
]
  const searchParams = useSearchParams()
  const router = useRouter()
  const prefilledId = searchParams.get('id') || ''
  const [orderId, setOrderId] = useState(prefilledId)
  const [loading, setLoading] = useState(false)
  const locale = useLocale()
  const isRTL = locale === 'ar'
  const [order, setOrder] = useState<OrderData | null>(null)
  const [initialCheckDone, setInitialCheckDone] = useState(false)
  // Check sessionStorage on mount (client-side only)

  const hasAutoTracked = useRef(false)
  const handleAutoTrack = async (id: string) => {
    setLoading(true)
    try {
      const res = await fetch('/api/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: id }),
      })
      const data = await res.json()
      if (data.success) {
        setOrder(data.order)
      } else {
        showToast(data.error || t('errors.notFound'), 'error')
      }
    } catch {
      showToast(t('errors.generic'), 'error')
    }
    setLoading(false)
  }

  useEffect(() => {
    const isDirect = searchParams.get('direct')
    if (isDirect === 'true') {
      const stored = sessionStorage.getItem('trackResult')
      if (stored) {
        try {
          const data = JSON.parse(stored)
          sessionStorage.removeItem('trackResult')
          if (data.success) {
             // eslint-disable-next-line react-hooks/set-state-in-effect
            setOrder(data.order)
            setInitialCheckDone(true)
            return
          }
        } catch {}
      }
      // If no cached result, auto-fetch
      const id = searchParams.get('id')
      if (id && !hasAutoTracked.current) {
        hasAutoTracked.current = true
        handleAutoTrack(id)
      }
    }
    setInitialCheckDone(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])





  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setOrder(null)

    try {
      const res = await fetch('/api/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      })

      const data = await res.json()

      if (data.success) {
        setOrder(data.order)
        router.replace(`/track?id=${orderId}&direct=true`)
      } 
      else {
      showToast(data.error || t('errors.notFound'), 'error')
      }
    } catch {
      showToast(t('errors.generic'), 'error')
    }

    setLoading(false)
  }

  const getStatusIndex = (status: string) => {
    return STATUS_STEPS.findIndex((s) => s.key === status)
  }

  // Show loading while auto-tracking
    if ((loading && !order) || (!initialCheckDone && searchParams.get('direct') === 'true')) {
    return (
    <PremiumPageShell className="pt-18 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600 mx-auto mb-4" />
         <p className="text-muted-foreground">{t('actions.loading')}</p>
        </div>
 </PremiumPageShell>
    )
  }

  return (
<PremiumPageShell className="pt-20 py-10 px-3 sm:px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-100 mb-6">
            <Package className="h-8 w-8 text-blue-600" />
          </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-4">
            {t('title')}
          </h1>
         <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            {t('subtitle')}
          </p>
        </div>

        {/* Search Form */}
        {!order && (
              <Card className="group relative overflow-hidden rounded-3xl border-2 border-border/40 bg-white/45 dark:bg-card/60 backdrop-blur-xl shadow-2xl transition-all duration-500 hover:-translate-y-1 hover:border-blue-500/30 hover:shadow-[0_20px_60px_rgba(37,99,235,0.15)] dark:bg-card/60 dark:hover:shadow-[0_20px_60px_rgba(37,99,235,0.25)] before:absolute before:inset-0 before:rounded-3xl before:border before:border-white/5 before:pointer-events-none">
              <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5 text-blue-600" />
                {t('search.title')}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleTrack} className="space-y-5">
                <div>
                 <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                    <FileText className="h-4 w-4 text-blue-600" />
                    {t('search.orderId')}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={`${t('search.placeholder')} (e.g. 69f5f83cd2151c4bf2787d5f)`}
                    className="w-full rounded-xl border-2 border-border/50 bg-background/50 px-4 py-3 font-mono text-sm text-foreground outline-none backdrop-blur-sm transition-all duration-300 hover:border-blue-500/30 hover:bg-background/80 focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10"
                    onChange={(e) => setOrderId(e.target.value)}
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  size="lg"
                 className="w-full rounded-2xl bg-blue-600 py-6 text-lg font-semibold text-white transition-all hover:scale-[1.01] hover:bg-blue-700"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      {t('search.searching')}
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      {t('search.button')}
                  {isRTL ? (
  <ArrowLeft className="h-5 w-5" />
) : (
  <ArrowRight className="h-5 w-5" />
)}
                    </span>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Order Result */}
        {order && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Status Progress */}
          <Card className="group relative overflow-hidden rounded-3xl border-2 border-border/40 bg-white/45 dark:bg-black/45 backdrop-blur-2xl shadow-2xl transition-all duration-500 hover:-translate-y-1 hover:border-blue-500/30 hover:shadow-[0_20px_60px_rgba(37,99,235,0.18)] before:absolute before:inset-0 before:rounded-3xl before:border before:border-white/5 before:pointer-events-none">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.08),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(168,85,247,0.06),transparent_40%)]" />
             <CardContent className="p-5 sm:p-8">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-2">
                 <h2 className="text-xl font-bold text-foreground">{t('status.title')}</h2>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase ${
                    order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                    order.status === 'in-progress' ? 'bg-blue-100 text-blue-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {
  order.status === 'pending'
    ? t('status.pending')
    : order.status === 'in-progress'
    ? t('status.inProgress')
    : t('status.completed')
}
                  </span>
                </div>

  {/* Progress Tracker */}
<div className="mt-6 rounded-2xl sm:rounded-3xl border-2 border-border/40 bg-background/40 px-2 py-4 sm:px-4 sm:py-5 backdrop-blur-xl transition-all duration-500 hover:border-blue-500/30 hover:shadow-[0_12px_40px_rgba(37,99,235,0.12)]">
  <div className="flex items-center justify-between">
    {STATUS_STEPS.map((step, index, arr) => {
      const Icon = step.icon
      const currentIndex = getStatusIndex(order.status)
      const isActive = currentIndex === index
      const isDone = currentIndex > index || order.status === 'completed'

      return (
        <div key={step.key} className="flex flex-1 items-center">
          <div className="flex flex-col items-center gap-2">
            <div
             className={`flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full border transition-all ${
                isDone
                  ? 'border-emerald-500 bg-emerald-500 text-white'
                  : isActive
                    ? 'border-blue-500 bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                    : 'border-border bg-background text-muted-foreground'
              }`}
            >
              <Icon className="h-5 w-5" />
            </div>

           <span className="text-center text-[11px] leading-tight font-medium text-muted-foreground sm:text-xs">
              {step.label}
            </span>
          </div>

          {index < arr.length - 1 && (
            <div
            className={`mx-1 h-px flex-1 sm:mx-3 ${
                isDone ? 'bg-emerald-500' : 'bg-border'
              }`}
            />
          )}
        </div>
      )
    })}
  </div>
</div>
              </CardContent>
            </Card>

            {/* Order Details */}
           <Card className="group relative overflow-hidden rounded-3xl border-2 border-border/40 bg-white/45 dark:bg-black/45 backdrop-blur-2xl shadow-2xl transition-all duration-500 hover:-translate-y-1 hover:border-blue-500/30 hover:shadow-[0_20px_60px_rgba(37,99,235,0.18)]">
           <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.08),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(168,85,247,0.06),transparent_40%)]" />
                <CardHeader>
                 <CardTitle className="flex items-center gap-2 text-lg">
                  <Package className="h-5 w-5 text-blue-600" />
                  {t('details.title')}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                      <FileText className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                    <p className="text-xs text-muted-foreground">{t('details.orderId')}</p>
                     <p className="break-all font-mono text-xs font-medium sm:text-sm">{order._id}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                      <Package className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                    <p className="text-xs text-muted-foreground">{t('details.service')}</p>
                     <p className="font-medium text-foreground">{getServiceName(order.service, t)}</p>
                    </div>
                  </div>

                 <div className="flex items-center gap-3">
  <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
    <DollarSign className="h-5 w-5 text-green-600" />
  </div>
  <div>
    <p className="text-xs text-muted-foreground">{t('details.price')}</p>
    <p className="font-bold text-green-600">
      
      ${order.finalPrice || order.price}
    </p>
    {order.paymentStatus === 'deposit_paid' && (
      <p className="text-xs text-muted-foreground">
        {t('details.depositPaid')}
      </p>
    )}
   {order.paymentStatus === 'fully_paid' && (
      <p className="text-xs text-emerald-600">
        {t('details.fullyPaid')}
      </p>
    )}
  </div>
</div>

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                      <Calendar className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                     <p className="text-xs text-muted-foreground">{t('details.orderedOn')}</p>
                     <p className="font-medium text-foreground">
                        {new Date(order.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                </div>

                {order.requirements && (
                  <div className="pt-4 border-t">
                   <p className="text-xs text-muted-foreground mb-2">{t('details.requirements')}</p>
                <p className="rounded-2xl border-2 border-border/40 bg-background/40 p-4 text-sm text-foreground backdrop-blur-sm">
                      {order.requirements}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Actions */}
                <div className="flex gap-4 justify-center flex-wrap">
              <Button
                variant="outline"
                size="lg"
                onClick={() => {
                  setOrder(null)
                  setOrderId('')
                }}
               className="rounded-2xl border-border/60 px-8 py-6 text-lg transition-all hover:scale-[1.02]"
              >
                {t('actions.trackAnother')}
              </Button>
              <Link href="/orders">
                <Button size="lg" className="rounded-2xl bg-blue-600 px-8 py-6 text-lg font-semibold text-white transition-all hover:scale-[1.02] hover:bg-blue-700">
                  {t('actions.placeNew')}
                 {isRTL ? (
  <ChevronLeft className="mr-1 h-5 w-5" />
) : (
  <ChevronRight className="ml-1 h-5 w-5" />
)}
                </Button>
              </Link>
            </div>
          </div>
        )}

        {!order && (
         <p className="text-center text-sm text-muted-foreground mt-8">
           {t('actions.hint')}
          </p>
        )}
      </div>
   </PremiumPageShell>
    
  )
}

export default function TrackOrderPage() {
  return (
    <Suspense fallback={
     <PremiumPageShell className="pt-18 flex items-center justify-center">
        <CardSkeleton />
    </PremiumPageShell>
    }>
      <TrackOrderContent />
    </Suspense>
  )
}