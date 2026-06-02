"use client"

import { useCallback, useEffect, useRef, useState } from "react"

export type NotificationItem = {
  _id: string
  userId: string
  type:
    | "order_created"
    | "order_accepted"
    | "new_message"
    | "payment_confirmed"
    | "payment_submitted"
    | "files_uploaded"
    | "order_completed"
    | "order_updated"
    | "system"
  title: string
  message: string
  link: string
  orderId?: string | null
  relatedMessageId?: string | null
  isRead: boolean
  readAt?: string | null
  createdAt: string
  updatedAt: string
}

type UseNotificationsOptions = {
  pollInterval?: number
  limit?: number
}

export function useNotifications(options: UseNotificationsOptions = {}) {
  const { pollInterval = 25000, limit = 20 } = options

  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const abortRef = useRef<AbortController | null>(null)

  const fetchNotifications = useCallback(
    async (silent = false) => {
      try {
        if (!silent) {
          setIsRefreshing(true)
        }

        abortRef.current?.abort()
        abortRef.current = new AbortController()

        const res = await fetch(`/api/notifications?limit=${limit}`, {
          method: "GET",
          signal: abortRef.current.signal,
          cache: "no-store",
        })

        if (!res.ok) {
          throw new Error("Failed to fetch notifications")
        }

        const data = await res.json()

        setNotifications(data.notifications || [])
        setUnreadCount(data.unreadCount || 0)
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return
        }

        console.error("FETCH_NOTIFICATIONS_CLIENT_ERROR", error)
      } finally {
        setIsLoading(false)
        setIsRefreshing(false)
      }
    },
    [limit]
  )

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      setNotifications((current) =>
        current.map((notification) =>
          notification._id === notificationId
            ? {
                ...notification,
                isRead: true,
                readAt: new Date().toISOString(),
              }
            : notification
        )
      )

      setUnreadCount((current) => Math.max(current - 1, 0))

      const res = await fetch("/api/notifications/read", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ notificationId }),
      })

      if (!res.ok) {
        throw new Error("Failed to mark notification as read")
      }

      const data = await res.json()
      setUnreadCount(data.unreadCount || 0)
    } catch (error) {
      console.error("MARK_NOTIFICATION_READ_CLIENT_ERROR", error)
      fetchNotifications(true)
    }
  }, [fetchNotifications])

  const markAllAsRead = useCallback(async () => {
    try {
      setNotifications((current) =>
        current.map((notification) => ({
          ...notification,
          isRead: true,
          readAt: notification.readAt || new Date().toISOString(),
        }))
      )

      setUnreadCount(0)

      const res = await fetch("/api/notifications/read-all", {
        method: "PATCH",
      })

      if (!res.ok) {
        throw new Error("Failed to mark all notifications as read")
      }
    } catch (error) {
      console.error("MARK_ALL_NOTIFICATIONS_READ_CLIENT_ERROR", error)
      fetchNotifications(true)
    }
  }, [fetchNotifications])


useEffect(() => {
  const timeout = window.setTimeout(() => {
    void fetchNotifications()
  }, 0)

  const interval = window.setInterval(() => {
    void fetchNotifications(true)
  }, pollInterval)

  function handleFocus() {
    void fetchNotifications(true)
  }

  function handleVisibilityChange() {
    if (!document.hidden) {
      void fetchNotifications(true)
    }
  }

  window.addEventListener("focus", handleFocus)
  document.addEventListener("visibilitychange", handleVisibilityChange)

  return () => {
    window.clearTimeout(timeout)
    window.clearInterval(interval)
    window.removeEventListener("focus", handleFocus)
    document.removeEventListener("visibilitychange", handleVisibilityChange)
    abortRef.current?.abort()
  }
}, [fetchNotifications, pollInterval])


  return {
    notifications,
    unreadCount,
    isLoading,
    isRefreshing,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  }
}