'use client'
import { AlertCircle, RefreshCw, WifiOff, ServerCrash } from 'lucide-react'
import { Button } from './button'
import { Card, CardContent } from './card'

interface ErrorMessageProps {
  type?: 'network' | 'server' | 'general'
  message?: string
  onRetry?: () => void
}

export function ErrorMessage({ type = 'general', message, onRetry }: ErrorMessageProps) {
  const icons = {
    network: WifiOff,
    server: ServerCrash,
    general: AlertCircle,
  }

  const titles = {
    network: 'Network Error',
    server: 'Server Error',
    general: 'Something Went Wrong',
  }

  const defaultMessages = {
    network: 'Please check your internet connection and try again.',
    server: 'Our servers are having trouble. Please try again later.',
    general: 'An unexpected error occurred. Please try again.',
  }

  const Icon = icons[type]

  return (
    <Card className="border-red-200 bg-red-50">
      <CardContent className="py-8 text-center">
        <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
          <Icon className="h-7 w-7 text-red-600" />
        </div>
        <h3 className="text-lg font-semibold text-red-900 mb-2">
          {titles[type]}
        </h3>
        <p className="text-sm text-red-700 mb-6 max-w-md mx-auto">
          {message || defaultMessages[type]}
        </p>
        {onRetry && (
          <Button
            variant="outline"
            onClick={onRetry}
            className="border-red-300 text-red-700 hover:bg-red-100"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        )}
      </CardContent>
    </Card>
  )
}