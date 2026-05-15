'use client'

import Link from 'next/link'
import { ShieldAlert } from 'lucide-react'

export default function UnauthorizedPage() {
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
              href="/my-orders"
              className="flex-1 rounded-xl border border-border px-4 py-3 text-center font-medium transition hover:bg-muted"
            >
              My Orders
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}