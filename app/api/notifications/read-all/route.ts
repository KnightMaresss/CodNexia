import { NextResponse } from "next/server"
import { connectMongoose } from "@/lib/mongoose"
import Notification from "@/models/Notification"
import { getCurrentUser } from "@/lib/auth"

export async function PATCH() {
  try {
    await connectMongoose()

    const user = await getCurrentUser()

    if (!user?._id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    await Notification.updateMany(
      {
        userId: user._id,
        isRead: false,
      },
      {
        $set: {
          isRead: true,
          readAt: new Date(),
        },
      }
    )

    return NextResponse.json({
      success: true,
      unreadCount: 0,
    })
  } catch (error) {
    console.error("READ_ALL_NOTIFICATIONS_ERROR", error)

    return NextResponse.json(
      { error: "Failed to mark notifications as read" },
      { status: 500 }
    )
  }
}