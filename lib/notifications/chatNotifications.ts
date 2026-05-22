import { connectMongoose } from "@/lib/mongoose"
import Notification from "@/models/Notification"

type CreateOrUpdateChatNotificationInput = {
  userId: string
  orderId: string
  link: string
  relatedMessageId?: string | null
  title?: string
  message?: string
}

export async function createOrUpdateChatNotification({
  userId,
  orderId,
  link,
  relatedMessageId = null,
  title = "New message received",
  message = "You have a new unread message on this order.",
}: CreateOrUpdateChatNotificationInput) {
  await connectMongoose()

  const notification = await Notification.findOneAndUpdate(
    {
      userId,
      type: "new_message",
      orderId,
      isRead: false,
    },
    {
      $set: {
        title,
        message,
        link,
        relatedMessageId,
      },
    },
    {
      upsert: true,
      new: true,
    }
  )

  return notification
}