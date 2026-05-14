'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { showToast } from '@/components/ui/toast'
import {  LogIn, Mail, Lock } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/components/auth-context'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
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
      showToast(result.error || 'Login failed', 'error')
    }

    setLoading(false)
  }

  return (
    <main className="min-h-screen py-24 px-4 bg-gradient-to-br from-background to-muted">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-100 mb-4">
            <LogIn className="h-8 w-8 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Welcome Back</h1>
          <p className="text-muted-foreground mt-2">Sign in to your account</p>
        </div>

        <Card>
          <CardContent className="pt-6">
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
                  className="w-full px-4 py-3 border border-input bg-background text-foreground rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
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
                  className="w-full px-4 py-3 border border-input bg-background text-foreground rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <Button type="submit" disabled={loading} className="w-full" size="lg">
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground mt-6">
              Dont have an account?{' '}
              <Link href="/register" className="text-blue-600 hover:underline font-medium">
                Create one
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}