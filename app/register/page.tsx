'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { showToast } from '@/components/ui/toast'
import {  UserPlus, Mail, Lock, User } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/components/auth-context'
import { useRouter } from 'next/navigation'

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
    <main className="min-h-screen py-24 px-4 bg-gradient-to-br from-background to-muted">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-100 mb-4">
            <UserPlus className="h-8 w-8 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Create Account</h1>
          <p className="text-muted-foreground mt-2">Join Student Services today</p>
        </div>

        <Card>
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
                  className="w-full px-4 py-3 border border-input bg-background text-foreground rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
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
                  placeholder="Min. 6 characters"
                  className="w-full px-4 py-3 border border-input bg-background text-foreground rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <Button type="submit" disabled={loading} className="w-full" size="lg">
                {loading ? 'Creating Account...' : 'Create Account'}
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground mt-6">
              Already have an account?{' '}
              <Link href="/login" className="text-blue-600 hover:underline font-medium">
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}