'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Link } from '@/i18n/navigation'
import { CheckCircle2, Loader2, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import PremiumPageShell from '@/components/PremiumPageShell'
import { useTranslations } from 'next-intl'
function VerifyEmailContent() {
  const t = useTranslations('VerifyEmail')
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')
  const hasVerifiedRef = useRef(false)

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>(
    'loading'
  )
  const [message, setMessage] = useState(t('verifyingMessage'))

  useEffect(() => {
    if (hasVerifiedRef.current) return

    if (!token) {
      window.setTimeout(() => {
        setStatus('error')
        setMessage(t('missingToken'))
      }, 0)

      return
    }

    hasVerifiedRef.current = true

    async function verifyEmail() {
      try {
        const res = await fetch('/api/auth/verify-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        })

        const data = await res.json()

        if (data.success) {
          setStatus('success')
          setMessage(data.message || t('verifiedMessage'))

          window.setTimeout(() => {
            router.push('/login')
          }, 2500)

          return
        }

        setStatus('error')
        setMessage(data.error || t('failedMessage'))
      } catch {
        setStatus('error')
        setMessage(t('failedRetry'))
      }
    }

    verifyEmail()
  }, [token, router, t])

  return (
    <PremiumPageShell className="flex min-h-screen items-center justify-center px-4 py-24">
      <Card className="w-full max-w-md rounded-3xl border-border/50 bg-background/70 shadow-2xl backdrop-blur-2xl">
        <CardContent className="px-6 py-10 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-3xl border border-blue-500/20 bg-blue-500/10">
            {status === 'loading' && (
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            )}

            {status === 'success' && (
              <CheckCircle2 className="h-8 w-8 text-emerald-500" />
            )}

            {status === 'error' && (
              <XCircle className="h-8 w-8 text-red-500" />
            )}
          </div>

          <h1 className="text-2xl font-black tracking-tight text-foreground">
          {status === 'loading'
           ? t('verifying')
           : status === 'success'
           ? t('verified')
           : t('failed')}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            {message}
          </p>

          <div className="mt-8">
            {status === 'success' ? (
              <Link href="/login">
                <Button className="w-full bg-blue-600 text-white hover:bg-blue-700">
                  {t('continueLogin')}
                </Button>
              </Link>
            ) : status === 'error' ? (
              <Link href="/login">
                <Button variant="outline" className="w-full">
                  {t('backLogin')}
                </Button>
              </Link>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </PremiumPageShell>
  )
}

function VerifyEmailFallback() {
  const t = useTranslations('VerifyEmail')
  return (
    <PremiumPageShell className="flex min-h-screen items-center justify-center px-4 py-24">
      <Card className="w-full max-w-md rounded-3xl border-border/50 bg-background/70 shadow-2xl backdrop-blur-2xl">
        <CardContent className="px-6 py-10 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-3xl border border-blue-500/20 bg-blue-500/10">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>

          <h1 className="text-2xl font-black tracking-tight text-foreground">
            {t('loadingVerification')}
          </h1>

          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          {t('preparingLink')}
          </p>
        </CardContent>
      </Card>
    </PremiumPageShell>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<VerifyEmailFallback />}>
      <VerifyEmailContent />
    </Suspense>
  )
}