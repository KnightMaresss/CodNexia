'use client'

import { useEffect, useState } from 'react'
import { Link } from '@/i18n/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import PremiumPageShell from '@/components/PremiumPageShell'
import { ArrowLeft, Calendar, Mail, MessageSquare, Shield, ShieldAlert, User } from 'lucide-react'

type Feedback = {
  _id: string
  userId: string
  userName: string
  userEmail: string
  subject: string
  description: string
  status: string
  createdAt: string
}

export default function AdminFeedbackPage() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([])
  const [loading, setLoading] = useState(true)
  const [role, setRole] = useState('')
  const [authorized, setAuthorized] = useState(false)

  useEffect(() => {
    async function init() {
      try {
        const authRes = await fetch('/api/auth/student-check')
        const authData = await authRes.json()
        const userRole = authData.user?.role || ''

        setRole(userRole)

        if (!authData.authenticated || userRole !== 'founder') {
          setAuthorized(false)
          return
        }

        setAuthorized(true)

        const res = await fetch('/api/admin/feedback')
        const data = await res.json()

        if (res.ok && data.success) {
          setFeedbacks(data.feedbacks || [])
        }
      } finally {
        setLoading(false)
      }
    }

    init()
  }, [])

  if (loading) {
    return null
  }

if (!authorized) {
  const isModerator = role === 'moderator'

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-xl">
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 rounded-full bg-red-500/10 p-4">
            <ShieldAlert className="h-12 w-12 text-red-500" />
          </div>

          <h1 className="text-3xl font-bold tracking-tight">
            Access Denied
          </h1>

          <p className="mt-3 text-muted-foreground">
            You do not have permission to access this page.
          </p>

          <div className="mt-8 flex w-full flex-col gap-3 sm:flex-row">
            <Link
              href="/"
              className="flex-1 rounded-xl bg-primary px-4 py-3 text-center font-medium text-primary-foreground transition hover:opacity-90"
            >
              Go Home
            </Link>

            <Link
              href={isModerator ? '/admin' : '/my-orders'}
              className="flex-1 rounded-xl border border-border px-4 py-3 text-center font-medium transition hover:bg-muted"
            >
              {isModerator ? 'Dashboard' : 'My Orders'}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

  return (
    <PremiumPageShell className="pt-20 py-8 px-4">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-700 dark:text-blue-300">
              <Shield className="h-3.5 w-3.5" />
              Founder Access
            </div>

            <h1 className="text-4xl font-black tracking-tight text-foreground">
              Feedback Inbox
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Review client feedback, bug reports, suggestions, and improvement requests submitted through Codnexia.
            </p>
          </div>

          <Link href="/admin">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
        </div>

        {feedbacks.length === 0 ? (
          <Card className="rounded-3xl border-border/50 bg-card/70 shadow-xl backdrop-blur-xl">
            <CardContent className="py-16 text-center">
              <MessageSquare className="mx-auto mb-4 h-12 w-12 text-muted-foreground/40" />
              <p className="text-lg font-semibold text-foreground">No feedback yet</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Client feedback will appear here when submitted.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {feedbacks.map((feedback) => (
              <Card key={feedback._id} className="overflow-hidden rounded-3xl border border-border/60 bg-card/75 shadow-sm backdrop-blur-xl transition-all hover:border-blue-500/30 hover:shadow-lg">
                <CardContent className="p-0">
                  <div className="border-b border-border/50 bg-gradient-to-r from-blue-500/[0.04] via-transparent to-purple-500/[0.04] px-6 py-5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-2.5 py-1 text-xs font-semibold text-blue-600 dark:text-blue-300">
                        {feedback.status || 'new'}
                      </span>

                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5" />
                        {new Date(feedback.createdAt).toLocaleString()}
                      </span>
                    </div>

                    <h2 className="mt-3 text-xl font-black text-foreground">
                      {feedback.subject}
                    </h2>
                  </div>

                  <div className="space-y-5 px-6 py-5">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl border border-border/50 bg-background/50 p-4">
                        <p className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          <User className="h-3.5 w-3.5" />
                          Client
                        </p>
                        <p className="font-semibold text-foreground">
                          {feedback.userName || 'Unknown user'}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-border/50 bg-background/50 p-4">
                        <p className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          <Mail className="h-3.5 w-3.5" />
                          Email
                        </p>
                        <p className="break-all font-semibold text-foreground">
                          {feedback.userEmail || 'No email'}
                        </p>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-border/50 bg-background/50 p-4">
                      <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        <MessageSquare className="h-3.5 w-3.5" />
                        Description
                      </p>

                      <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                        {feedback.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </PremiumPageShell>
  )
}