"use client"

import Link from "next/link"
import { Bell, CheckCheck, Loader2 } from "lucide-react"
import { useTranslations } from "next-intl"
import { NotificationItem } from "./NotificationItem"
import type { NotificationItem as NotificationItemType } from "./useNotifications"

type Props = {
  notifications: NotificationItemType[]
  unreadCount: number
  isLoading: boolean
  isRefreshing: boolean
  onNotificationClick: (notification: NotificationItemType) => void
  onMarkAllAsRead: () => void
}

export function NotificationDropdown({
  notifications,
  unreadCount,
  isLoading,
  isRefreshing,
  onNotificationClick,
  onMarkAllAsRead,
}: Props) {
  const t = useTranslations("Notifications")
  
  return (
<div className="fixed right-4 top-[72px] z-50 w-[calc(100vw-2rem)] max-w-[380px] sm:absolute sm:right-0 sm:top-full sm:mt-3 sm:w-[380px] overflow-hidden rounded-2xl border border-white/10 bg-[#080812]/95 text-white shadow-[0_24px_80px_rgba(0,0,0,0.55)] backdrop-blur-2xl dark:border-white/10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 px-4 py-3.5">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5">
              <Bell className="h-4 w-4 text-white/80" />
            </div>

            <div>
              <h3 className="text-sm font-semibold leading-none text-white">
                {t("title")}
              </h3>
              <p className="mt-1.5 text-xs text-white/55">
                {unreadCount > 0
                  ? `${unreadCount} ${t("unreadNotifications")}`
                  : t("allCaughtUp")}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 ml-auto sm:ml-0">
          {isRefreshing && (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-white/45" />
          )}

          {unreadCount > 0 && (
            <button
              type="button"
              onClick={onMarkAllAsRead}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs font-medium text-white/80 transition hover:bg-white/10 hover:text-white whitespace-nowrap"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              {t("markAllRead")}
            </button>
          )}
        </div>
      </div>

      <div className="max-h-[430px] overflow-y-auto p-2">
        {isLoading ? (
          <div className="space-y-2 p-1">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-[78px] animate-pulse rounded-2xl bg-white/5"
              />
            ))}
          </div>
        ) : notifications.length > 0 ? (
          <div className="space-y-2">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification._id}
                notification={notification}
                onClick={() => onNotificationClick(notification)}
              />
            ))}
          </div>
        ) : (
          <div className="px-6 py-12 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
              <Bell className="h-5 w-5 text-white/50" />
            </div>

            <p className="text-sm font-semibold text-white">
              {t("noNotifications")}
            </p>

            <p className="mx-auto mt-1.5 max-w-[240px] text-xs leading-relaxed text-white/50">
              {t("noNotificationsDesc")}
            </p>
          </div>
        )}
      </div>

      <div className="border-t border-white/10 p-2">
        <Link
          href="/notifications"
          className="block rounded-xl px-3 py-2.5 text-center text-sm font-semibold text-white/80 transition hover:bg-white/10 hover:text-white"
        >
          {t("viewAllNotifications")}
        </Link>
      </div>
    </div>
  )
}