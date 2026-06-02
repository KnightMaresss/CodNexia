export type NotificationType =
  | "order_created"
  | "order_accepted"
  | "new_message"
  | "payment_confirmed"
  | "files_uploaded"
  | "order_completed"
  | "order_updated"
  | "rating_received"
  | "payment_submitted"
  | "system"

export type CreateNotificationInput = {
  userId: string
  type: NotificationType
  title: string
  message: string
  link: string
  orderId?: string | null
  relatedMessageId?: string | null
}

export type CreateManyNotificationsInput = {
  userIds: string[]
  type: NotificationType
  title: string
  message: string
  link: string
  orderId?: string | null
  relatedMessageId?: string | null
}