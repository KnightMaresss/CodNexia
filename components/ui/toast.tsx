'use client'
import { useEffect, useState, useCallback } from 'react'
import { X, CheckCircle, AlertCircle, XCircle } from 'lucide-react'

type ToastType = 'success' | 'error' | 'warning'

interface Toast {
  id: string
  message: string
  type: ToastType
}

let addToastFn: ((message: string, type: ToastType) => void) | null = null

export function showToast(message: string, type: ToastType = 'error') {
  if (addToastFn) {
    addToastFn(message, type)
  }
}

const icons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertCircle,
}

const colors = {
  success: 'border-green-500 bg-green-50 text-green-800',
  error: 'border-red-500 bg-red-50 text-red-800',
  warning: 'border-yellow-500 bg-yellow-50 text-yellow-800',
}

const iconColors = {
  success: 'text-green-500',
  error: 'text-red-500',
  warning: 'text-yellow-500',
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((message: string, type: ToastType) => {
    const id = Math.random().toString(36).substring(2, 9)
    setToasts((prev) => [...prev, { id, message, type }])

    // Auto remove after 5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 5000)
  }, [])

  useEffect(() => {
    addToastFn = addToast
    return () => {
      addToastFn = null
    }
  }, [addToast])

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  if (toasts.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full">
      {toasts.map((toast) => {
        const Icon = icons[toast.type]
        return (
          <div
            key={toast.id}
            className={`flex items-start gap-3 p-4 rounded-lg border shadow-lg animate-in slide-in-from-right-full duration-300 ${colors[toast.type]}`}
          >
            <Icon className={`h-5 w-5 shrink-0 mt-0.5 ${iconColors[toast.type]}`} />
            <p className="text-sm font-medium flex-1">{toast.message}</p>
            <button
              onClick={() => removeToast(toast.id)}
              className="shrink-0 hover:opacity-70 transition-opacity"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )
      })}
    </div>
  )
}