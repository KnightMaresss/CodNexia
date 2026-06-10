'use client'

import { useState } from 'react'
import { Link } from '@/i18n/navigation'
import { useAuth } from '@/components/auth-context'
import { showToast } from '@/components/ui/toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import PremiumPageShell from '@/components/PremiumPageShell'
import { useTranslations } from 'next-intl'
import {
  ArrowRight,
  CheckCircle,
  FileText,
  Lightbulb,
  LogIn,
  MessageSquare,
  Send,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'

export default function FeedbackPage() {
  const t = useTranslations('Feedback')
  const { user, loading: authLoading } = useAuth()
  const [subject, setSubject] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!user?.email) {
      showToast(t('toasts.signInRequired'), 'error')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, description }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        showToast(data.error || t('toasts.submitFailed'), 'error')
        return
      }

      showToast(t('toasts.submitSuccess'), 'success')
      setSubject('')
      setDescription('')
      setSubmitted(true)
    } catch {
      showToast(t('toasts.genericError'), 'error')
    } finally {
      setLoading(false)
    }
  }

  if (authLoading) {
    return (
      <PremiumPageShell className="flex min-h-screen items-center justify-center px-4 py-24">
        <Card className="w-full max-w-2xl rounded-3xl border-2 border-border/40 bg-card/75 p-8 shadow-2xl backdrop-blur-xl">
          <div className="h-8 w-48 animate-pulse rounded-xl bg-muted" />
          <div className="mt-6 h-12 w-full animate-pulse rounded-xl bg-muted" />
          <div className="mt-4 h-40 w-full animate-pulse rounded-xl bg-muted" />
        </Card>
      </PremiumPageShell>
    )
  }

  if (!user) {
    return (
      <PremiumPageShell className="flex min-h-screen items-center justify-center px-4 py-24">
        <Card className="w-full max-w-lg rounded-3xl border-border/50 bg-background/70 shadow-2xl backdrop-blur-2xl">
          <CardContent className="px-6 py-10 text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-3xl border border-blue-500/20 bg-blue-500/10">
              <ShieldCheck className="h-8 w-8 text-blue-500" />
            </div>

            <h1 className="text-2xl font-black tracking-tight text-foreground">
           {t('auth.title')}
            </h1>

            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
             {t('auth.description')}
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <Link href="/login">
                <Button className="w-full bg-blue-600 text-white hover:bg-blue-700">
                  <LogIn className="mr-2 h-4 w-4" />
                 {t('auth.signIn')}
                </Button>
              </Link>

              <Link href="/register">
                <Button variant="outline" className="w-full">
                 {t('auth.createAccount')}
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </PremiumPageShell>
    )
  }

  if (submitted) {
    return (
      <PremiumPageShell className="flex min-h-screen items-center justify-center px-4 py-24">
        <Card className="w-full max-w-lg rounded-3xl border-2 border-border/40 bg-card/75 text-center shadow-2xl backdrop-blur-xl">
          <CardContent className="space-y-6 px-6 py-12">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10">
              <CheckCircle className="h-10 w-10 text-emerald-500" />
            </div>

            <div>
              <h1 className="text-2xl font-black tracking-tight text-foreground">
              {t('success.title')}
              </h1>

              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {t('success.description')}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Button
                variant="outline"
                onClick={() => setSubmitted(false)}
                className="w-full"
              >
               {t('success.sendAnother')}
              </Button>

              <Link href="/my-orders">
                <Button className="w-full bg-blue-600 text-white hover:bg-blue-700">
                 {t('success.myOrders')}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </PremiumPageShell>
    )
  }

  return (
    <PremiumPageShell className="pt-24 py-16 px-4">
      <div className="mx-auto max-w-5xl">
        <div className="mb-12 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-blue-100 px-4 py-2 text-sm font-medium text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
            <Sparkles className="h-4 w-4" />
          {t('badge')}
          </div>

          <h1 className="mb-4 text-4xl font-black tracking-tight text-foreground md:text-5xl">
           {t('title')}
          </h1>

          <p className="mx-auto max-w-2xl text-lg leading-relaxed text-muted-foreground">
           {t('subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card className="group relative overflow-hidden rounded-3xl border-2 border-border/40 bg-card/75 backdrop-blur-xl shadow-2xl transition-all duration-500 hover:-translate-y-1 hover:border-blue-500/30 hover:shadow-[0_20px_60px_rgba(37,99,235,0.15)] dark:bg-card/60 dark:hover:shadow-[0_20px_60px_rgba(37,99,235,0.25)]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-blue-600" />
                  {t('form.details')}
                </CardTitle>
              </CardHeader>

              <CardContent className="pt-2">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="mb-2 flex items-center gap-2 text-sm font-medium text-foreground">
                      <FileText className="h-4 w-4 text-blue-600" />
                    {t('form.subject')}
                    </label>

                    <input
                      type="text"
                      required
                      maxLength={120}
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder={t('form.subjectPlaceholder')}
                      className="w-full rounded-xl border-2 border-border/50 bg-background/50 px-4 py-3 text-foreground outline-none backdrop-blur-sm transition-all duration-300 hover:border-blue-500/30 hover:bg-background/80 focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10"
                    />

                    <div className="mt-1 text-right text-xs text-muted-foreground">
                      {subject.length}/120
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 flex items-center gap-2 text-sm font-medium text-foreground">
                      <MessageSquare className="h-4 w-4 text-blue-600" />
                     {t('form.description')}
                    </label>

                    <textarea
                      required
                      rows={7}
                      maxLength={2000}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder={t('form.descriptionPlaceholder')}
                      className="w-full resize-none rounded-xl border-2 border-border/50 bg-background/50 px-4 py-3 text-foreground outline-none backdrop-blur-sm transition-all duration-300 hover:border-blue-500/30 hover:bg-background/80 focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10"
                    />

                    <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                      <span>
                       {description.length < 20
                       ? t('form.detailHintShort')
                       : description.length < 100
                       ? t('form.detailHintMedium')
                       : t('form.detailHintGood')}
                      </span>
                      <span>{description.length}/2000</span>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    size="lg"
                    className="w-full bg-blue-600 py-6 text-lg font-semibold text-white shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-700 hover:shadow-blue-600/30"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                       {t('form.submitting')}
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                       {t('form.submit')}
                        <Send className="h-5 w-5" />
                      </span>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              <Card className="group relative overflow-hidden rounded-3xl border-2 border-blue-500/20 bg-white/35 text-foreground backdrop-blur-2xl shadow-[0_20px_60px_rgba(37,99,235,0.12)] transition-all duration-500 hover:-translate-y-1 hover:border-blue-500/40 hover:bg-white/45 dark:border-blue-400/20 dark:bg-slate-950/70 dark:text-white dark:shadow-[0_20px_60px_rgba(37,99,235,0.16)] dark:hover:border-blue-400/35 dark:hover:bg-slate-950/85 dark:hover:shadow-[0_24px_70px_rgba(37,99,235,0.25)]">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Lightbulb className="h-5 w-5 text-blue-400" />
                    {t('sidebar.title')}
                  </CardTitle>
                </CardHeader>

                <CardContent className="space-y-4 text-sm text-muted-foreground">
                  <p className="flex items-start gap-2">
                    <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                   {t('sidebar.bugs')}
                  </p>

                  <p className="flex items-start gap-2">
                    <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                    {t('sidebar.translation')}
                  </p>

                  <p className="flex items-start gap-2">
                    <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                   {t('sidebar.design')}
                  </p>
                  <div className="mt-5 rounded-2xl border border-blue-500/15 bg-blue-500/5 p-4">
                    <div className="flex items-start gap-3">
                      <ShieldCheck className="mt-0.5 h-5 w-5 text-blue-400" />
                      <p className="text-xs leading-relaxed text-muted-foreground">
                        {t('sidebar.privacy')}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </PremiumPageShell>
  )
}