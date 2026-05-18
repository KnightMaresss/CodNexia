'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { showToast } from '@/components/ui/toast'
import {  UserPlus, Mail, Lock, User } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/components/auth-context'
import { useRouter } from 'next/navigation'
import PremiumPageShell from '@/components/PremiumPageShell'
export default function RegisterPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { register, login } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const result = await register(name, email, password)

    if (result.success) {
      const loginResult = await login(email, password)
      if (loginResult.success) {
        showToast('Account created successfully!', 'success')
        router.push('/profile')
      } else {
        showToast('Account created! Please log in.', 'success')
        router.push('/login')
      }
    } else {
      showToast(result.error || 'Registration failed', 'error')
    }

    setLoading(false)
  }

  return (
    <PremiumPageShell className="py-24 px-4">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
         <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl border border-blue-500/20 bg-white/80 shadow-[0_10px_40px_rgba(37,99,235,0.15)] backdrop-blur-xl dark:bg-black/40 dark:border-white/10">
      <UserPlus className="h-9 w-9 text-blue-500" />
         </div>
        <h1 className="text-5xl font-black tracking-tight text-slate-900 dark:text-white">
          Create Account
        </h1>
        <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
         Join Codnexia and manage your projects professionally.
         </p>
        </div>

     <Card className="premium-card border-white/20 bg-white/70 shadow-[0_20px_80px_rgba(59,130,246,0.15)] backdrop-blur-2xl dark:bg-black/40">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                  <User className="h-4 w-4 text-blue-600" />
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="John Doe"
                  className="w-full rounded-2xl border border-slate-200/80 bg-white/80 px-4 py-3 text-slate-900 shadow-sm outline-none transition-all duration-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 dark:border-white/10 dark:bg-black/30 dark:text-white dark:focus:border-blue-400"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

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
                  placeholder="Min. 6 characters"
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
                {loading ? 'Creating Account...' : 'Create Account'}
              </Button>
            </form>

            <p className="mt-8 text-center text-sm text-slate-600 dark:text-slate-400">
              Already have an account?{' '}
              <Link href="/login" className="font-semibold text-blue-500 transition-colors hover:text-cyan-400">
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
   </PremiumPageShell>
  )
}