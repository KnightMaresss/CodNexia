'use client'
import { useState, useEffect, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { showToast } from '@/components/ui/toast'
import { CardSkeleton } from '@/components/ui/skeleton'
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
} from 'lucide-react'
import Link from 'next/link'

const SERVICE_NAMES: Record<string, string> = {
  'graduation-projects': 'Graduation Projects',
  'academic-reports': 'Academic Reports',
  'custom-websites': 'Custom Websites',
  'mobile-apps': 'Mobile Apps',
  'powerpoint-presentations': 'PowerPoint Presentations',
  'cv-resume-writing': 'CV/Resume Writing',
  'translation': 'Translation (En↔Ar)',
  'code-debugging': 'Code Debugging',
}

const STATUS_STEPS = [
  { key: 'pending', label: 'Order Received', icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-100' },
  { key: 'in-progress', label: 'In Progress', icon: FileText, color: 'text-blue-600', bg: 'bg-blue-100' },
  { key: 'completed', label: 'Completed', icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-100' },
]

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
  const searchParams = useSearchParams()
  const prefilledId = searchParams.get('id') || ''
  const [orderId, setOrderId] = useState(prefilledId)
  const [loading, setLoading] = useState(false)

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
        showToast(data.error || 'Order not found', 'error')
      }
    } catch {
      showToast('Something went wrong. Please try again.', 'error')
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
      } else {
        showToast(data.error || 'Order not found', 'error')
      }
    } catch {
      showToast('Something went wrong. Please try again.', 'error')
    }

    setLoading(false)
  }

  const getStatusIndex = (status: string) => {
    return STATUS_STEPS.findIndex((s) => s.key === status)
  }

  // Show loading while auto-tracking
    if ((loading && !order) || (!initialCheckDone && searchParams.get('direct') === 'true')) {
    return (
     <main className="min-h-screen pt-18 flex items-center justify-center bg-gradient-to-br from-background to-muted">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600 mx-auto mb-4" />
         <p className="text-muted-foreground">Looking up your order...</p>
        </div>
      </main>
    )
  }

  return (
   <main className="min-h-screen pt-24 py-16 px-4 bg-gradient-to-br from-background to-muted">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-100 mb-6">
            <Package className="h-8 w-8 text-blue-600" />
          </div>
         <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Track Your Order
          </h1>
         <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Enter your Order ID to check the status of your project
          </p>
        </div>

        {/* Search Form */}
        {!order && (
          <Card className="shadow-lg border-0">
              <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5 text-blue-600" />
                Find Your Order
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleTrack} className="space-y-5">
                <div>
                 <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                    <FileText className="h-4 w-4 text-blue-600" />
                    Order ID
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter your Order ID (e.g. 69f5f83cd2151c4bf2787d5f)"
                    className="w-full px-4 py-3 border border-input bg-background text-foreground rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-mono text-sm"
                    value={orderId}
                    onChange={(e) => setOrderId(e.target.value)}
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  size="lg"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 text-lg"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Searching...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      Track Order
                      <ArrowRight className="h-5 w-5" />
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
            <Card className="shadow-lg border-0 overflow-hidden">
              <CardContent className="p-8">
                <div className="flex items-center justify-between mb-2">
                 <h2 className="text-xl font-bold text-foreground">Order Status</h2>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase ${
                    order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                    order.status === 'in-progress' ? 'bg-blue-100 text-blue-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {order.status === 'in-progress' ? 'In Progress' : order.status}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="relative mt-8">
                 <div className="absolute top-5 left-0 right-0 h-1 bg-muted rounded-full">
                    <div
                      className="h-full bg-blue-600 rounded-full transition-all duration-1000"
                      style={{
                        width: `${(getStatusIndex(order.status) / (STATUS_STEPS.length - 1)) * 100}%`,
                      }}
                    />
                  </div>

                  <div className="relative flex justify-between">
                    {STATUS_STEPS.map((step, index) => {
                      const Icon = step.icon
                      const isActive = getStatusIndex(order.status) >= index
                      const isCurrent = step.key === order.status

                      return (
                        <div key={step.key} className="flex flex-col items-center">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                              isActive ? step.bg + ' shadow-md' : 'bg-muted'
                            } ${isCurrent ? 'ring-4 ring-offset-2 ring-blue-400' : ''}`}
                          >
                            <Icon
                              className={`h-5 w-5 transition-colors ${
                                isActive ? step.color : 'text-muted-foreground'
                              }`}
                            />
                          </div>
                          <span
                            className={`mt-3 text-xs font-medium text-center ${
                             isActive ? 'text-foreground' : 'text-muted-foreground'
                            }`}
                          >
                            {step.label}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Order Details */}
            <Card className="shadow-lg border-0">
                <CardHeader>
                 <CardTitle className="flex items-center gap-2 text-lg">
                  <Package className="h-5 w-5 text-blue-600" />
                  Order Details
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                      <FileText className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                    <p className="text-xs text-muted-foreground">Order ID</p>
                      <p className="font-mono text-sm font-medium">{order._id}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                      <Package className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                    <p className="text-xs text-muted-foreground">Service</p>
                     <p className="font-medium text-foreground">{SERVICE_NAMES[order.service] || order.service}</p>
                    </div>
                  </div>

                 <div className="flex items-center gap-3">
  <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
    <DollarSign className="h-5 w-5 text-green-600" />
  </div>
  <div>
    <p className="text-xs text-muted-foreground">Price</p>
    <p className="font-bold text-green-600">
      
      ${order.finalPrice || order.price}
    </p>
    {order.paymentStatus === 'deposit_paid' && (
      <p className="text-xs text-muted-foreground">
        20% deposit paid
      </p>
    )}
   {order.paymentStatus === 'fully_paid' && (
      <p className="text-xs text-emerald-600">
        Fully paid
      </p>
    )}
  </div>
</div>

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                      <Calendar className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                     <p className="text-xs text-muted-foreground">Ordered On</p>
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
                   <p className="text-xs text-muted-foreground mb-2">Your Requirements</p>
                    <p className="text-sm text-foreground bg-muted rounded-lg p-4">
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
                className="px-8 py-6 text-lg"
              >
                Track Another Order
              </Button>
              <Link href="/orders">
                <Button size="lg" className="px-8 py-6 text-lg">
                  Place New Order
                  <ChevronRight className="ml-1 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        )}

        {!order && (
         <p className="text-center text-sm text-muted-foreground mt-8">
            You can find your Order ID in the confirmation email we sent after your order was placed.
          </p>
        )}
      </div>

    
    </main>
    
  )
}

export default function TrackOrderPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen pt-18 flex items-center justify-center bg-gradient-to-br from-background to-muted">
        <CardSkeleton />
      </main>
    }>
      <TrackOrderContent />
    </Suspense>
  )
}