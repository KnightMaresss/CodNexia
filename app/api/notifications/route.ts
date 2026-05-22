import { NextRequest, NextResponse } from "next/server"
import { connectMongoose } from "@/lib/mongoose"
import Notification from "@/models/Notification"
import { getCurrentUser } from "@/lib/auth"

export async function GET(req: NextRequest) {
  try {
    await connectMongoose()

    const user = await getCurrentUser()

    if (!user?._id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(req.url)

    const limit = Math.min(Number(searchParams.get("limit") || 20), 50)
    const unreadOnly = searchParams.get("unreadOnly") === "true"

    const filter: Record<string, unknown> = {
      userId: user._id,
    }

    if (unreadOnly) {
      filter.isRead = false
    }

    const [notifications, unreadCount] = await Promise.all([
      Notification.find(filter)
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean(),

      Notification.countDocuments({
        userId: user._id,
        isRead: false,
      }),
    ])

    return NextResponse.json({
      notifications,
      unreadCount,
    })
  } catch (error) {
    console.error("GET_NOTIFICATIONS_ERROR", error)

    return NextResponse.json(
      { error: "Failed to load notifications" },
      { status: 500 }
    )
  }
}