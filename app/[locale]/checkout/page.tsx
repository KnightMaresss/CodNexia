'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import QRCode from 'react-qr-code'
import {
  ArrowLeft,
  CheckCircle2,
  Copy,
  CreditCard,
  Loader2,
  ShieldCheck,
  Wallet,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { showToast } from '@/components/ui/toast'
import PremiumPageShell from '@/components/PremiumPageShell'
import { useTranslations } from 'next-intl'
interface Order {
  _id: string
  service: string
  status: string
  paymentStatus?: string
  finalPrice?: number
  depositAmount?: number
  remainingAmount?: number
}



function CheckoutContent() {
  const t = useTranslations('Checkout')
  const getServiceName = (service: string) => {
  const services: Record<string, string> = {
    'graduation-projects': t('services.graduationProjects'),
    'academic-reports': t('services.academicReports'),
    'custom-websites': t('services.customWebsites'),
    'mobile-apps': t('services.mobileApps'),
    'logo-design': t('services.powerpoint'),
    'cv-resume-writing': t('services.cv'),
    translation: t('services.translation'),
    'code-debugging': t('services.debugging'),
    'ai-automation': t('services.ai'),
    'ui-ux-design': t('services.uiux'),
  }

  return services[service] || service
}
  const router = useRouter()
  const searchParams = useSearchParams()

  const orderId = searchParams.get('orderId') || ''
  const paymentType = searchParams.get('type') === 'final' ? 'final' : 'deposit'

  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedMethod, setSelectedMethod] = useState<'manual_crypto' | 'nowpayments'>('manual_crypto')
  const [txHash, setTxHash] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const coin = process.env.NEXT_PUBLIC_CRYPTO_COIN || 'USDT'
  const network = process.env.NEXT_PUBLIC_CRYPTO_NETWORK || 'TRC20'
  const walletAddress = process.env.NEXT_PUBLIC_CRYPTO_WALLET_ADDRESS || ''
  const [creatingNowPayment, setCreatingNowPayment] = useState(false)
  const amount = useMemo(() => {
    if (!order) return 0
    return paymentType === 'deposit'
      ? Number(order.depositAmount || 0)
      : Number(order.remainingAmount || 0)
  }, [order, paymentType])

const nowPaymentsRecommended = amount >= 15


const fetchOrder = async () => {
  setLoading(true)
  try {
    const res = await fetch('/api/my-orders', {
      cache: 'no-store',
    })

    const data = await res.json()

    if (!data.success) {
      showToast(data.error || t('toasts.loadOrderFailed'), 'error')
      router.replace('/my-orders')
      return
    }

    const found = data.orders.find((item: Order) => item._id === orderId)

    if (!found) {
      showToast(t('toasts.orderNotFound'), 'error')
      router.replace('/my-orders')
      return
    }

    setOrder(found)
  } catch {
    showToast(t('toasts.checkoutLoadFailed'), 'error')
    router.replace('/my-orders')
  } finally {
    setLoading(false)
  }
}

useEffect(() => {
  if (!orderId) {
    router.push('/my-orders')
    return
  }

  const timeout = setTimeout(() => {
    fetchOrder()
  }, 0)

  return () => clearTimeout(timeout)
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [orderId])
useEffect(() => {
  const handlePageShow = () => {
    if (orderId) {
      fetchOrder()
    }
  }

  window.addEventListener('pageshow', handlePageShow)

  return () => {
    window.removeEventListener('pageshow', handlePageShow)
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [orderId])
  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(walletAddress)
      showToast(t('toasts.walletCopied'), 'success')
    } catch {
     showToast(t('toasts.copyFailed'), 'error')
    }
  }

  const submitPayment = async () => {
    if (!order) return

    if (!txHash.trim()) {
     showToast(t('toasts.enterHash'), 'error')
      return
    }

    setSubmitting(true)

    try {
      const res = await fetch('/api/crypto/submit-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order._id,
          paymentType,
          txHash: txHash.trim(),
          amount,
          currency: coin,
          network,
        }),
      })

      const data = await res.json()
      if (data.success) {
       showToast(t('toasts.paymentSubmitted'), 'success')
        router.push('/my-orders')
      } else {
       showToast(t('toasts.invalidTxHash'), 'error')
      }
    } catch {
      showToast(t('toasts.submitFailed'), 'error')
    }
    setSubmitting(false)
  }
const createNowPayment = async () => {
  if (!order) return

  setCreatingNowPayment(true)

  try {
    const res = await fetch('/api/nowpayments/create-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: order._id,
        paymentType,
      }),
    })

    const data = await res.json()

   if (data.success && data.paymentUrl) {
  window.open(data.paymentUrl, '_blank', 'noopener,noreferrer')
  showToast(t('toasts.checkoutOpened'), 'success')
} else {
  showToast(data.error || t('toasts.checkoutFailed'), 'error')
}
  } catch {
    showToast(t('toasts.checkoutFailed'), 'error')
  }

  setCreatingNowPayment(false)
}

if (loading) {
  return (
    <PremiumPageShell className="pt-24 py-16 px-4">
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    </PremiumPageShell>
  )
}
  
 if (!order) {
  return (
    <PremiumPageShell className="pt-24 py-16 px-4">
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <p className="text-sm text-muted-foreground">
          {t('loading')}
        </p>
      </div>
    </PremiumPageShell>
  )
}

  return (
    <PremiumPageShell className="pt-24 py-16 px-4">
      <div className="mx-auto max-w-5xl">
        <Button
          variant="outline"
          onClick={() => router.push('/my-orders')}
          className="mb-6 rounded-xl"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('back')}
        </Button>

        <div className="mb-10 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-500/10">
            <CreditCard className="h-8 w-8 text-blue-500" />
          </div>

          <h1 className="text-4xl font-black tracking-tight text-foreground">
            {t('title')}
          </h1>

          <p className="mt-3 text-muted-foreground">
            {t('subtitle')}
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-4">
            <div className="rounded-3xl border border-border/50 bg-white/45 p-6 shadow-2xl backdrop-blur-2xl dark:bg-black/45">
              <h2 className="text-lg font-bold text-foreground">
               {t('summary')}
              </h2>

              <div className="mt-5 space-y-4 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">{t('service')}</span>
                  <span className="font-semibold text-foreground text-right">
                    {getServiceName(order.service)}
                  </span>
                </div>

                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">{t('paymentType')}</span>
                  <span className="font-semibold text-foreground">
                    {paymentType === 'deposit'
                    ? t('deposit')
                    : t('final')}
                  </span>
                </div>

                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">{t('totalPrice')}</span>
                  <span className="font-semibold text-foreground">
                    ${order.finalPrice || 0}
                  </span>
                </div>

                <div className="rounded-2xl bg-green-500/10 p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-green-700 dark:text-green-300">
                      {t('amountDue')}
                    </span>
                    <span className="text-2xl font-black text-green-600">
                      {amount} {coin}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-border/50 bg-white/45 p-6 shadow-2xl backdrop-blur-2xl dark:bg-black/45">
              <h2 className="text-lg font-bold text-foreground">
                {t('paymentMethods')}
              </h2>

              <div className="mt-4 space-y-3">
                <button
                  onClick={() => setSelectedMethod('manual_crypto')}
                  className={`w-full rounded-2xl border p-4 text-left transition-all ${
                    selectedMethod === 'manual_crypto'
                      ? 'border-green-500 bg-green-500/10'
                      : 'border-border/50 bg-background/40 hover:border-green-500/40'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="rounded-xl bg-green-500/10 p-2">
                      <Wallet className="h-5 w-5 text-green-500" />
                    </div>

                   <div className="flex-1 text-start">
                      <p className="font-bold text-foreground">
                        {t('manualTitle')}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {t('manualDescription', {
                        coin,
                        network
                        })}
                      </p>
                    </div>
                  </div>
                </button>
                <button
                  onClick={() => setSelectedMethod('nowpayments')}
                  className={`w-full rounded-2xl border p-4 text-left transition-all ${
                    selectedMethod === 'nowpayments'
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-border/50 bg-background/40 hover:border-blue-500/40'
                  }`}
                >
                  
                  <div className="flex items-start gap-3">
                    <div className="rounded-xl bg-blue-500/10 p-2">
                      <ShieldCheck className="h-5 w-5 text-blue-500" />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-bold text-foreground">
                          {t('nowTitle')}
                        </p>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {t('nowDescription')}
                      </p>
                      {!nowPaymentsRecommended && (
  <p className="mt-1 text-[11px] font-semibold text-amber-600 dark:text-amber-300">
    {t('nowSmall')}
  </p>
)}
                    </div>
                  </div>
                </button>
                <button
  disabled
  className="w-full cursor-not-allowed rounded-2xl border border-border/40 bg-background/30 p-4 text-left opacity-60"
>
  <div className="flex items-start gap-3">
    <div className="rounded-xl bg-sky-500/10 p-2">
      <CreditCard className="h-5 w-5 text-sky-500" />
    </div>

    <div className="flex-1">
      <div className="flex items-center justify-between gap-2">
        <p className="font-bold text-foreground">
          {t('paypal')}
        </p>

        <span className="rounded-full bg-amber-500/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-600 dark:text-amber-300">
          {t('unavailable')}
        </span>
      </div>

      <p className="mt-1 text-xs text-muted-foreground">
      {t('paypalDescription')}
      </p>
    </div>
  </div>
</button>
<button
  disabled
  className="w-full cursor-not-allowed rounded-2xl border border-border/40 bg-background/30 p-4 text-left opacity-60"
>
  <div className="flex items-start gap-3">
    <div className="rounded-xl bg-purple-500/10 p-2">
      <Wallet className="h-5 w-5 text-purple-500" />
    </div>

    <div className="flex-1">
      <div className="flex items-center justify-between gap-2">
        <p className="font-bold text-foreground">
          {t('bank')}
        </p>

        <span className="rounded-full bg-amber-500/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-600 dark:text-amber-300">
          {t('unavailable')}
        </span>
      </div>

      <p className="mt-1 text-xs text-muted-foreground">
       {t('bankDescription')}
      </p>
    </div>
  </div>
</button>
<div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
  <p className="text-xs leading-relaxed text-amber-700 dark:text-amber-300">
  {t('restrictionNotice')}
  </p>
</div>
              </div>
            </div>
          </div>



          <div className="rounded-3xl border border-border/50 bg-white/45 p-6 shadow-2xl backdrop-blur-2xl dark:bg-black/45">
            {selectedMethod === 'manual_crypto' ? (
              <>
                <div className="mb-6">
                  <h2 className="text-xl font-black text-foreground">
                    {t('manualTitle')}
                  </h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {t('sendExactly', {
                     amount,
                     coin,
                     network
                    })}
                  </p>
                </div>

                <div className="rounded-3xl border border-border/40 bg-background/50 p-5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{t('amountDue')}</span>
                    <span className="text-xl font-black text-green-600">
                      {amount} {coin}
                    </span>
                  </div>

                  <div className="mt-5 flex flex-col items-center">
                    <div className="rounded-2xl bg-white p-3">
                      <QRCode value={walletAddress} size={190} />
                    </div>

                    <p className="mt-3 text-xs text-muted-foreground">
                      {t('scanQr')}
                    </p>
                  </div>

                  <div className="mt-5 rounded-2xl border border-border/40 bg-background/80 p-4">
                    <p className="mb-1 text-xs text-muted-foreground">
                      {t('walletAddress')}
                    </p>

                    <div className="flex items-center gap-2">
                      <p className="flex-1 break-all text-sm font-semibold text-foreground">
                        {walletAddress}
                      </p>

                      <button
                        onClick={copyAddress}
                        className="rounded-lg p-2 transition-colors hover:bg-muted"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-5 rounded-2xl bg-amber-500/10 p-4">
                    <p className="text-xs font-semibold text-amber-700 dark:text-amber-300">
                      {t('warning', {
                      coin,
                      network
                     })}
                    </p>
                  </div>
                </div>

                <div className="mt-6">
                  <label className="mb-2 block text-sm font-semibold text-foreground">
                    {t('txHash')}
                  </label>

                  <textarea
                    value={txHash}
                    onChange={(e) => setTxHash(e.target.value)}
                    placeholder={t('txPlaceholder')}
                    className="min-h-[120px] w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm text-foreground outline-none transition-all focus:border-green-500"
                  />
                </div>

                <Button
                  onClick={submitPayment}
                  disabled={submitting}
                  className="mt-6 w-full rounded-xl bg-green-600 py-6 text-white hover:bg-green-700"
                >
                  {submitting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                  )}
                  {t('submit')}
                </Button>
              </>
            ) : (
              <div className="flex min-h-[500px] flex-col items-center justify-center text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-500/10">
                  <ShieldCheck className="h-8 w-8 text-blue-500" />
                </div>

               <h2 className="text-2xl font-black text-foreground">
  {t('nowTitle')}
</h2>

<p className="mt-3 max-w-sm text-sm text-muted-foreground">
  {t('secureCheckout')}
</p>

<Button
  onClick={createNowPayment}
  disabled={creatingNowPayment}
  className="mt-6 rounded-xl bg-blue-600 px-8 py-6 text-white hover:bg-blue-700"
>
  {creatingNowPayment
  ? t('creating')
  : t('continue')}
</Button>


              </div>
            )}
          </div>
        </div>
      </div>
    </PremiumPageShell>
  )
}
export default function CheckoutPage() {
  return (
    <Suspense fallback={null}>
      <CheckoutContent />
    </Suspense>
  )
}
