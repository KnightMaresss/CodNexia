'use client'
import { createContext, useContext, useEffect, useState, useCallback } from 'react'

interface User {
  id: string
  name: string
  email: string
  profilePic: string
  role?: string
  createdAt: string
}

interface AuthResult {
  success: boolean
  error?: string
  code?: string
  email?: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<AuthResult>
  register: (name: string, email: string, password: string) => Promise<AuthResult>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => ({ success: false }),
  register: async () => ({ success: false }),
  logout: async () => {},
  refreshUser: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshUser = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/student-check')
      const data = await res.json()
           if (data.authenticated) {
        // Check if blocked
        if (data.blocked) {
          await fetch('/api/auth/student-logout', { method: 'POST' })
          setUser(null)
          setLoading(false)
          return
        }
        
        // Fetch full profile
        const profileRes = await fetch('/api/profile')
        const profileData = await profileRes.json()
        
        if (profileData.success) {
          setUser(profileData.user)
        }
      } else {
        setUser(null)
      }
    } catch {
      setUser(null)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refreshUser()
  }, [refreshUser])

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch('/api/auth/student-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (data.success) {
        // Fetch full profile to get role
        const profileRes = await fetch('/api/profile')
        const profileData = await profileRes.json()
        if (profileData.success) {
          setUser(profileData.user)
        } else {
          setUser(data.user)
        }
        return { success: true }
      }
      return {
  success: false,
  error: data.error,
  code: data.code,
  email: data.email,
}
    } catch {
      return { success: false, error: 'Login failed' }
    }
  }


  const register = async (name: string, email: string, password: string) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      })
      const data = await res.json()
      if (data.success) {
        return { success: true }
      }
      return { success: false, error: data.error }
    } catch {
      return { success: false, error: 'Registration failed' }
    }
  }

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    setUser(null)
    window.location.href = '/'
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}