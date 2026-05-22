"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Bell } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  NotificationItem,
  useNotifications,
} from "./useNotifications"
import { NotificationDropdown } from "./NotificationDropdown"

export function NotificationBell() {
  const router = useRouter()
  const wrapperRef = useRef<HTMLDivElement | null>(null)

  const [isOpen, setIsOpen] = useState(false)

  const {
    notifications,
    unreadCount,
    isLoading,
    isRefreshing,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  } = useNotifications({
    pollInterval: 5000,
    limit: 20,
  })

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  async function handleOpenChange() {
    const nextValue = !isOpen
    setIsOpen(nextValue)

    if (nextValue) {
      await fetchNotifications(true)
    }
  }

  async function handleNotificationClick(notification: NotificationItem) {
    if (!notification.isRead) {
      await markAsRead(notification._id)
    }

    setIsOpen(false)
    router.push(notification.link)
  }

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={handleOpenChange}

      className={cn(
  "relative flex h-10 w-10 items-center justify-center rounded-xl border transition-all duration-200",
  "border-white/15 bg-white/5 text-white hover:bg-white/10 hover:shadow-[0_0_30px_rgba(59,130,246,0.18)]",
  isOpen && "bg-white/10 shadow-[0_0_30px_rgba(59,130,246,0.22)]"
)}

        aria-label="Open notifications"
      >
        <Bell className="h-4 w-4" />

        {unreadCount > 0 && (
         <span className="absolute -right-1.5 -top-1.5 flex min-h-5 min-w-5 items-center justify-center rounded-full border border-white/20 bg-red-500 px-1.5 text-[10px] font-bold text-white shadow-[0_0_18px_rgba(239,68,68,0.65)]">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <NotificationDropdown
          notifications={notifications}
          unreadCount={unreadCount}
          isLoading={isLoading}
          isRefreshing={isRefreshing}
          onNotificationClick={handleNotificationClick}
          onMarkAllAsRead={markAllAsRead}
        />
      )}
    </div>
  )
}