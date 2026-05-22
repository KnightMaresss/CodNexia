import { Schema, model, models } from "mongoose"

export type NotificationType =
  | "order_created"
  | "order_accepted"
  | "new_message"
  | "payment_confirmed"
  | "files_uploaded"
  | "order_completed"
  | "order_updated"
  | "system"

const NotificationSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    type: {
      type: String,
      required: true,
      enum: [
        "order_created",
        "order_accepted",
        "new_message",
        "payment_confirmed",
        "files_uploaded",
        "order_completed",
        "order_updated",
        "system",
      ],
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },

    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },

    orderId: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      default: null,
      index: true,
    },

    relatedMessageId: {
      type: Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },

    link: {
      type: String,
      required: true,
      trim: true,
    },

    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },

    readAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
)

NotificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 })
NotificationSchema.index({ userId: 1, createdAt: -1 })
NotificationSchema.index({ userId: 1, type: 1, orderId: 1, isRead: 1 })

const Notification =
  models.Notification || model("Notification", NotificationSchema)

export default Notification