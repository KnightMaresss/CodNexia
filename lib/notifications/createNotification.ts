import { connectMongoose } from "@/lib/mongoose"
import Notification from "@/models/Notification"
import type {
  CreateManyNotificationsInput,
  CreateNotificationInput,
} from "./types"

export async function createNotification(input: CreateNotificationInput) {
  await connectMongoose()

  const notification = await Notification.create({
    userId: input.userId,
    type: input.type,
    title: input.title,
    message: input.message,
    link: input.link,
    orderId: input.orderId || null,
    relatedMessageId: input.relatedMessageId || null,
  })

  return notification
}

export async function createManyNotifications(input: CreateManyNotificationsInput) {
  await connectMongoose()

  if (!input.userIds.length) {
    return []
  }

  const notifications = await Notification.insertMany(
    input.userIds.map((userId) => ({
      userId,
      type: input.type,
      title: input.title,
      message: input.message,
      link: input.link,
      orderId: input.orderId || null,
      relatedMessageId: input.relatedMessageId || null,
    }))
  )

  return notifications
}