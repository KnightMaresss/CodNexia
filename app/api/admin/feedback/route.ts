import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { getCurrentUser } from '@/lib/auth'

export async function GET() {
  try {
    const user = await getCurrentUser()

    if (!user?._id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    if (user.role !== 'founder') {
      return NextResponse.json({ success: false, error: 'Founder access only' }, { status: 403 })
    }

    const client = await clientPromise
    const db = client.db(process.env.DB_NAME || 'student_services')

    const feedbacks = await db
      .collection('feedbacks')
      .find({})
      .sort({ createdAt: -1 })
      .limit(100)
      .toArray()

    return NextResponse.json({
      success: true,
      feedbacks: feedbacks.map((feedback) => ({
        ...feedback,
        _id: feedback._id.toString(),
        userId: feedback.userId?.toString?.() || String(feedback.userId || ''),
      })),
    })
  } catch (error) {
    console.error('ADMIN_FEEDBACK_GET_ERROR', error)
    return NextResponse.json(
      { success: false, error: 'Failed to load feedbacks' },
      { status: 500 }
    )
  }
}