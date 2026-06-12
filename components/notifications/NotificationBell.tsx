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
  const initializedSoundRef = useRef(false)
  const previousUnreadCountRef = useRef(0)
  const previousUnreadIdsRef = useRef<Set<string>>(new Set())
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
  if (isLoading) return

  const unreadNotifications = notifications.filter((n) => !n.isRead)

  const getNotificationKey = (notification: NotificationItem) =>
    `${notification._id}:${notification.relatedMessageId || notification.updatedAt || notification.createdAt}`

  if (!initializedSoundRef.current) {
    previousUnreadCountRef.current = unreadCount
    previousUnreadIdsRef.current = new Set(unreadNotifications.map(getNotificationKey))
    initializedSoundRef.current = true
    return
  }

  const newUnreadNotifications = unreadNotifications.filter(
    (n) => !previousUnreadIdsRef.current.has(getNotificationKey(n))
  )

  if (newUnreadNotifications.length > 0) {
    let shouldPlaySound = false

    for (const notification of newUnreadNotifications) {
      const openOrderChatId = sessionStorage.getItem('openOrderChatId')

      let notificationOrderId =
        notification.orderId ||
        // @ts-expect-error optional API field
        notification.relatedId ||
        // @ts-expect-error optional API field
        notification.metadata?.orderId ||
        ''

      if (!notificationOrderId && notification.link) {
        try {
          const url = new URL(notification.link, window.location.origin)

          notificationOrderId =
            url.searchParams.get('chat') ||
            url.searchParams.get('orderId') ||
            url.searchParams.get('id') ||
            url.searchParams.get('chatOrder') ||
            url.searchParams.get('order') ||
            ''
        } catch {}
      }

      console.log({
  openOrderChatId,
  notificationOrderId,
  type: notification.type,
  link: notification.link,
})
      const shouldSuppress =
        notification.type === 'new_message' &&
        Boolean(openOrderChatId) &&
        Boolean(notificationOrderId) &&
        openOrderChatId === notificationOrderId

      if (shouldSuppress) {
        markAsRead(notification._id).catch(() => {})
      } else {
        shouldPlaySound = true
      }
    }

    if (shouldPlaySound) {
      const audio = new Audio('/notification.mp3')
      audio.play().catch(() => {})
    }
  }

  previousUnreadCountRef.current = unreadCount
  previousUnreadIdsRef.current = new Set(unreadNotifications.map(getNotificationKey))
}, [unreadCount, notifications, isLoading, markAsRead])



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
const displayNotifications = notifications.filter((notification, index, array) => {
  if (notification.type !== "new_message" || !notification.orderId) {
    return true
  }

  return (
    array.findIndex(
      (item) =>
        item.type === "new_message" &&
        item.orderId === notification.orderId
    ) === index
  )
})
  return (
    <div ref={wrapperRef} className="relative">
      
      <button
        type="button"
        onClick={handleOpenChange}
        className={cn(
          "relative flex h-9 w-9 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-white/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl transition-all duration-300 hover:border-[#38b6ff]/35 hover:bg-[#38b6ff]/10 hover:shadow-[0_0_22px_rgba(56,182,255,0.18)] active:scale-95",
          isOpen && "bg-[#38b6ff]/10 border-[#38b6ff]/35"
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
  <div className="absolute right-0 top-full mt-2">
    <NotificationDropdown
      notifications={displayNotifications}
      unreadCount={unreadCount}
      isLoading={isLoading}
      isRefreshing={isRefreshing}
      onNotificationClick={handleNotificationClick}
      onMarkAllAsRead={markAllAsRead}
    />
  </div>
)}
    </div>
  )
}