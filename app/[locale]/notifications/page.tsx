import Link from "next/link"
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
import { connectMongoose } from "@/lib/mongoose"
import NotificationModel from "@/models/Notification"
import { getCurrentUser } from "@/lib/auth"
import PremiumPageShell from "@/components/PremiumPageShell"
import { cn } from "@/lib/utils"
import MarkAllNotificationsButton from '@/components/notifications/MarkAllNotificationsButton'
import { getTranslations } from 'next-intl/server'
type NotificationPageItem = {
  _id: {
    toString: () => string
  }
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
  isRead: boolean
  createdAt?: Date | string
}

function NotificationIcon({ type }: { type: NotificationPageItem["type"] }) {
  const className = "h-5 w-5"
  switch (type) {
    case "order_created":
      return <ClipboardList className={className} />
    case "order_accepted":
      return <CheckCircle className={className} />
    case "new_message":
      return <MessageCircle className={className} />
    case "payment_confirmed":
      return <CreditCard className={className} />
    case "files_uploaded":
      return <UploadCloud className={className} />
    case "order_completed":
      return <BadgeCheck className={className} />
    case "order_updated":
      return <RefreshCw className={className} />
    default:
      return <Bell className={className} />
  }
}

function getIconStyle(type: NotificationPageItem["type"], isRead: boolean) {
  if (isRead) {
    return "border-border/60 bg-muted/50 text-muted-foreground"
  }

  switch (type) {
    case "new_message":
      return "border-blue-500/20 bg-blue-500/10 text-blue-500"
    case "payment_confirmed":
      return "border-emerald-500/20 bg-emerald-500/10 text-emerald-500"
    case "files_uploaded":
      return "border-purple-500/20 bg-purple-500/10 text-purple-500"
    case "order_completed":
      return "border-green-500/20 bg-green-500/10 text-green-500"
    case "order_accepted":
      return "border-cyan-500/20 bg-cyan-500/10 text-cyan-500"
    case "order_created":
      return "border-amber-500/20 bg-amber-500/10 text-amber-500"
    default:
      return "border-blue-500/20 bg-blue-500/10 text-blue-500"
  }
}

function formatNotificationDate(
  date: Date | string | undefined,
  t: Awaited<ReturnType<typeof getTranslations>>
) {
if (!date) return t('recently')

const parsedDate = new Date(date)
const now = Date.now()
const diff = Math.max(now - parsedDate.getTime(), 0)

const minute = 60 * 1000
const hour = 60 * minute
const day = 24 * hour
const week = 7 * day

if (diff < minute) return t('justNow')
if (diff < hour) return t('minutesAgo', { count: Math.floor(diff / minute) })
if (diff < day) return t('hoursAgo', { count: Math.floor(diff / hour) })
if (diff < week) return t('daysAgo', { count: Math.floor(diff / day) })

return parsedDate.toLocaleDateString(undefined, {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
})
}

export default async function NotificationsPage() {
  const t = await getTranslations('Notifications')
  await connectMongoose()

  const user = await getCurrentUser()

  if (!user?._id) {
    return (
      <PremiumPageShell className="min-h-screen px-4 pt-28 pb-16">
        <main className="mx-auto max-w-3xl">
          <div className="rounded-3xl border border-border/50 bg-background/70 p-8 text-center shadow-2xl backdrop-blur-xl">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-blue-500/20 bg-blue-500/10">
              <Bell className="h-6 w-6 text-blue-500" />
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-foreground">
             {t('title')}
            </h1>

            <p className="mt-2 text-sm text-muted-foreground">
              {t('loginRequired')}
            </p>

            <Link
              href="/login"
              className="mt-6 inline-flex rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
             {t('goToLogin')}
            </Link>
          </div>
        </main>
      </PremiumPageShell>
    )
  }

  const notifications = (await NotificationModel.find({
    userId: user._id,
  })
    .sort({ createdAt: -1 })
    .limit(100)
    .lean()) as NotificationPageItem[]

  const unreadCount = notifications.filter((notification) => !notification.isRead).length
  const totalCount = notifications.length

  return (
    <PremiumPageShell className="min-h-screen px-4 pt-28 pb-16">
      <main className="mx-auto w-full max-w-5xl">
        <section className="mb-8 overflow-hidden rounded-[2rem] border border-border/50 bg-background/55 shadow-2xl backdrop-blur-2xl">
          <div className="relative px-6 py-8 sm:px-8 lg:px-10">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.18),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(168,85,247,0.12),transparent_35%)]" />

            <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-600 dark:text-blue-300">
                  <Bell className="h-3.5 w-3.5" />
                 {t('notificationCenter')}
                </div>

                <h1 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">
                {t('title')}
                </h1>

                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                 {t('subtitle')}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:min-w-[260px]">
                <div className="rounded-2xl border border-border/50 bg-background/65 p-4 backdrop-blur-xl">
                  <p className="text-xs font-medium text-muted-foreground">
                  {t('total')}
                  </p>
                  <p className="mt-1 text-2xl font-black text-foreground">
                    {totalCount}
                  </p>
                </div>

                <div className="rounded-2xl border border-blue-500/20 bg-blue-500/10 p-4 backdrop-blur-xl">
                  <p className="text-xs font-medium text-blue-600 dark:text-blue-300">
                   {t('unread')}
                  </p>
                  <p className="mt-1 text-2xl font-black text-blue-600 dark:text-blue-300">
                    {unreadCount}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-[2rem] border border-border/50 bg-background/55 shadow-2xl backdrop-blur-2xl">
          <div className="flex flex-col gap-3 border-b border-border/50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wide text-foreground">
                {t('recentActivity')}
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
               {t('latest100')}
              </p>
            </div>

          <div className="flex items-center gap-2">
  {unreadCount > 0 && (
    <>
      <MarkAllNotificationsButton />

      <div className="inline-flex w-fit items-center rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-600 dark:text-blue-300">
        {unreadCount} {t('unread')}
      </div>
    </>
  )}
</div>


          </div>
          {notifications.length > 0 ? (
            <div className="divide-y divide-border/40">
              {notifications.map((notification) => (
                <Link
                  key={notification._id.toString()}
                  href={notification.link}
                  className={cn(
                    "group relative flex gap-4 px-5 py-5 transition sm:px-6",
                    "hover:bg-blue-500/[0.04]",
                    !notification.isRead && "bg-blue-500/[0.035]"
                  )}
                >
                  {!notification.isRead && (
                    <span className="absolute left-0 top-5 h-12 w-1 rounded-r-full bg-blue-500" />
                  )}

                  <div
                    className={cn(
                      "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border transition group-hover:scale-105",
                      getIconStyle(notification.type, notification.isRead)
                    )}
                  >
                    <NotificationIcon type={notification.type} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3
                            className={cn(
                              "line-clamp-1 text-sm font-bold",
                              notification.isRead
                                ? "text-foreground/80"
                                : "text-foreground"
                            )}
                          >
                           {t(`items.${notification.type}.title`)}
                          </h3>

                          {!notification.isRead && (
                            <span className="h-2 w-2 shrink-0 rounded-full bg-blue-500 shadow-[0_0_14px_rgba(59,130,246,0.8)]" />
                          )}
                        </div>

                        <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                         {t(`items.${notification.type}.message`)}
                        </p>
                      </div>

                      <p className="shrink-0 text-xs font-medium text-muted-foreground">
                       {formatNotificationDate(notification.createdAt, t)}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="px-6 py-20 text-center">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl border border-blue-500/20 bg-blue-500/10">
                <Bell className="h-7 w-7 text-blue-500" />
              </div>

              <h3 className="text-lg font-bold text-foreground">
                {t('noNotifications')}
              </h3>

              <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
               {t('noNotificationsDesc')}
              </p>
            </div>
          )}
        </section>
      </main>
    </PremiumPageShell>
  )
}