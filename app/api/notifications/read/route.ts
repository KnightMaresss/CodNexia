import { NextRequest, NextResponse } from "next/server"
import { connectMongoose } from "@/lib/mongoose"
import Notification from "@/models/Notification"
import { getCurrentUser } from "@/lib/auth"

export async function PATCH(req: NextRequest) {
  try {
    await connectMongoose()

    const user = await getCurrentUser()

    if (!user?._id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { notificationId } = body

    if (!notificationId) {
      return NextResponse.json(
        { error: "Notification ID is required" },
        { status: 400 }
      )
    }

    const notification = await Notification.findOneAndUpdate(
      {
        _id: notificationId,
        userId: user._id,
      },
      {
        $set: {
          isRead: true,
          readAt: new Date(),
        },
      },
      {
        new: true,
      }
    )

    if (!notification) {
      return NextResponse.json(
        { error: "Notification not found" },
        { status: 404 }
      )
    }

    const unreadCount = await Notification.countDocuments({
      userId: user._id,
      isRead: false,
    })

    return NextResponse.json({
      notification,
      unreadCount,
    })
  } catch (error) {
    console.error("READ_NOTIFICATION_ERROR", error)

    return NextResponse.json(
      { error: "Failed to mark notification as read" },
      { status: 500 }
    )
  }
}