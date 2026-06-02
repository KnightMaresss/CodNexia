'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useTranslations } from 'next-intl'
export default function MarkAllNotificationsButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const t = useTranslations('Notifications')
  async function handleClick() {
    try {
      setLoading(true)

      await fetch('/api/notifications/read-all', {
        method: 'PATCH',
      })

      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-600 transition hover:bg-emerald-500/20 dark:text-emerald-300"
    >
      {loading ? '...' : t('markAllRead')}
    </button>
  )
}