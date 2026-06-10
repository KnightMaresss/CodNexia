"use client"

import {
  BadgeCheck,
  Bell,
  CheckCircle,
  ClipboardList,
  CreditCard,
  MessageCircle,
  RefreshCw,
  UploadCloud,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { NotificationItem as NotificationItemType } from "./useNotifications"
import { useTranslations } from 'next-intl'

type Props = {
  notification: NotificationItemType
  onClick: () => void
}

function NotificationIcon({ type }: { type: NotificationItemType["type"] }) {
  const iconClassName = "h-3.5 w-3.5 sm:h-4 sm:w-4"

  switch (type) {
    case "order_created":
      return <ClipboardList className={iconClassName} />
    case "order_accepted":
      return <CheckCircle className={iconClassName} />
    case "new_message":
      return <MessageCircle className={iconClassName} />
    case "payment_confirmed":
      return <CreditCard className={iconClassName} />
    case "payment_submitted":
      return <CreditCard className={iconClassName} />
    case "files_uploaded":
      return <UploadCloud className={iconClassName} />
    case "order_completed":
      return <BadgeCheck className={iconClassName} />
    case "order_updated":
      return <RefreshCw className={iconClassName} />
    default:
      return <Bell className={iconClassName} />
  }
}

function getIconStyle(type: NotificationItemType["type"], isRead: boolean) {
  if (isRead) {
    return "border-white/10 bg-white/5 text-white/45"
  }

  switch (type) {
    case "new_message":
      return "border-blue-400/20 bg-blue-500/15 text-blue-300"
    case "payment_confirmed":
      return "border-emerald-400/20 bg-emerald-500/15 text-emerald-300"
    case "payment_submitted":
      return "border-amber-400/20 bg-amber-500/15 text-amber-300"
    case "files_uploaded":
      return "border-purple-400/20 bg-purple-500/15 text-purple-300"
    case "order_completed":
      return "border-green-400/20 bg-green-500/15 text-green-300"
    case "order_accepted":
      return "border-cyan-400/20 bg-cyan-500/15 text-cyan-300"
    case "order_created":
      return "border-amber-400/20 bg-amber-500/15 text-amber-300"
    default:
      return "border-white/10 bg-white/8 text-white/70"
  }
}

function formatTimeAgo(date: string, t: ReturnType<typeof useTranslations>) {
  const now = Date.now()
  const created = new Date(date).getTime()
  const diff = Math.max(now - created, 0)

  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour
  const week = 7 * day

  if (diff < minute) return t("justNow")
  if (diff < hour) return t("minutesAgo", { count: Math.floor(diff / minute) })
  if (diff < day) return t("hoursAgo", { count: Math.floor(diff / hour) })
  if (diff < week) return t("daysAgo", { count: Math.floor(diff / day) })

  return new Date(date).toLocaleDateString()
}

export function NotificationItem({ notification, onClick }: Props) {
  const t = useTranslations('Notifications')
  
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group relative flex w-full gap-2 sm:gap-3 overflow-hidden rounded-2xl border px-3 py-2.5 sm:py-3 text-left transition-all duration-200",
        notification.isRead
          ? "border-white/5 bg-white/[0.035] hover:border-white/10 hover:bg-white/[0.06]"
          : "border-white/10 bg-white/[0.075] shadow-[0_10px_30px_rgba(0,0,0,0.20)] hover:border-white/15 hover:bg-white/[0.10]"
      )}
    >
      {!notification.isRead && (
        <div className="absolute inset-y-3 left-0 w-1 rounded-r-full bg-blue-400" />
      )}

      <div
        className={cn(
          "mt-0.5 flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl border transition",
          getIconStyle(notification.type, notification.isRead)
        )}
      >
        <NotificationIcon type={notification.type} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2 sm:gap-3">
          <p
            className={cn(
              "line-clamp-1 text-xs sm:text-sm font-semibold",
              notification.isRead ? "text-white/75" : "text-white"
            )}
          >
            {t(`items.${notification.type}.title`)}
          </p>

          {!notification.isRead && (
            <span className="mt-1 h-1.5 w-1.5 sm:h-2 sm:w-2 shrink-0 rounded-full bg-blue-400 shadow-[0_0_14px_rgba(96,165,250,0.8)]" />
          )}
        </div>

        <p
          className={cn(
            "mt-0.5 sm:mt-1 line-clamp-2 text-[11px] sm:text-xs leading-relaxed",
            notification.isRead ? "text-white/45" : "text-white/60"
          )}
        >
          {t(`items.${notification.type}.message`)}
        </p>

        <p className="mt-1 sm:mt-2 text-[10px] sm:text-[11px] font-medium text-white/40">
          {formatTimeAgo(notification.createdAt, t)}
        </p>
      </div>
    </button>
  )
}