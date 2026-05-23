'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { showToast } from '@/components/ui/toast'
import { LogIn, Mail, Lock, Send, ShieldAlert } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/components/auth-context'
import { useRouter } from 'next/navigation'
import PremiumPageShell from '@/components/PremiumPageShell'
export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [unverifiedEmail, setUnverifiedEmail] = useState('')
  const [resendLoading, setResendLoading] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const { login } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const result = await login(email, password)

if (result.success) {
  showToast('Welcome back!', 'success')
  router.push('/profile')
} else {
  if (result.code === 'EMAIL_NOT_VERIFIED') {
    setUnverifiedEmail(result.email || email)
  }

  showToast(result.error || 'Login failed', 'error')
}
    setLoading(false)
  }
const handleResendVerification = async () => {
  if (!unverifiedEmail || resendLoading || resendCooldown > 0) return

  setResendLoading(true)

  try {
    const res = await fetch('/api/auth/resend-verification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: unverifiedEmail }),
    })

    const data = await res.json()

    if (data.success) {
      showToast(
        data.message || 'Verification email sent. Please check your inbox.',
        'success'
      )

      setResendCooldown(60)

      const interval = window.setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            window.clearInterval(interval)
            return 0
          }

          return prev - 1
        })
      }, 1000)
    } else {
      showToast(data.error || 'Failed to resend verification email.', 'error')
    }
  } catch {
    showToast('Failed to resend verification email.', 'error')
  }

  setResendLoading(false)
}
  return (
  <PremiumPageShell className="py-24 px-4">
      <div className="max-w-md mx-auto">
       <div className="text-center mb-8">
  <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl border border-blue-500/20 bg-white/80 shadow-[0_10px_40px_rgba(37,99,235,0.15)] backdrop-blur-xl dark:bg-black/40 dark:border-white/10">
  <LogIn className="h-9 w-9 text-blue-500" />
</div>
 <h1 className="text-5xl font-black tracking-tight text-slate-900 dark:text-white">
  Welcome Back
</h1>
   <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
  Sign in to access your orders, chats, and dashboard.
</p>
        </div>

       <Card className="premium-card border-white/20 bg-white/70 shadow-[0_20px_80px_rgba(59,130,246,0.15)] backdrop-blur-2xl dark:bg-black/40">
          <CardContent className="pt-6">
            {unverifiedEmail && (
  <div className="mb-5 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4">
    <div className="flex gap-3">
      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-amber-500/20 bg-amber-500/10">
        <ShieldAlert className="h-4 w-4 text-amber-500" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground">
          Email verification required
        </p>

        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          We sent a verification link to{' '}
          <span className="font-semibold text-foreground">
            {unverifiedEmail}
          </span>
          . Please verify your email before logging in.
        </p>

        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={resendLoading || resendCooldown > 0}
          onClick={handleResendVerification}
          className="mt-3 rounded-xl"
        >
          <Send className="mr-2 h-3.5 w-3.5" />
          {resendLoading
            ? 'Sending...'
            : resendCooldown > 0
              ? `Resend in ${resendCooldown}s`
              : 'Resend verification email'}
        </Button>
      </div>
    </div>
  </div>
)}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                  <Mail className="h-4 w-4 text-blue-600" />
                  Email
                </label>
                <input
                  type="email"
                  required
                  placeholder="student@example.com"
                  className="w-full rounded-2xl border border-slate-200/80 bg-white/80 px-4 py-3 text-slate-900 shadow-sm outline-none transition-all duration-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 dark:border-white/10 dark:bg-black/30 dark:text-white dark:focus:border-blue-400"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                  <Lock className="h-4 w-4 text-blue-600" />
                  Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="Enter your password"
                  className="w-full rounded-2xl border border-slate-200/80 bg-white/80 px-4 py-3 text-slate-900 shadow-sm outline-none transition-all duration-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 dark:border-white/10 dark:bg-black/30 dark:text-white dark:focus:border-blue-400"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

             <Button
              type="submit"
              disabled={loading}
              size="lg"
              className="group h-14 w-full rounded-2xl border border-blue-500/30 bg-gradient-to-r from-blue-600 to-blue-500 text-lg font-semibold text-white shadow-[0_10px_40px_rgba(37,99,235,0.35)] transition-all duration-300 hover:scale-[1.02] hover:from-blue-500 hover:to-cyan-400 hover:shadow-[0_18px_50px_rgba(37,99,235,0.45)]"
                >
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>

           <p className="mt-8 text-center text-sm text-slate-600 dark:text-slate-400">
              Dont have an account?{' '}
              <Link href="/register" className="font-semibold text-blue-500 transition-colors hover:text-cyan-400">
                Create one
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
  </PremiumPageShell>
  )
}