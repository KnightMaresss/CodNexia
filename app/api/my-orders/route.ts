import clientPromise from '@/lib/mongodb'
import { NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { getJwtSecret } from '@/lib/jwt-secret'
const JWT_SECRET = new TextEncoder().encode(getJwtSecret())

export async function GET() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('student_token')?.value

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { payload } = await jwtVerify(token, JWT_SECRET)

    if (payload.role !== 'student') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const client = await clientPromise
    const db = client.db(process.env.DB_NAME || 'student_services')

    const orders = await db
      .collection('orders')
      .find({ studentEmail: payload.email })
      .sort({ createdAt: -1 })
      .toArray()

    const serializedOrders = await Promise.all(
      orders.map(async (order) => {
        const orderId = order._id.toString()

        const chatView = await db.collection('chat_views').findOne({
          orderId,
          viewer: 'student',
        })

        const lastSeenAt = chatView?.lastSeenAt || new Date(0)

        const unreadMessages = await db.collection('messages').countDocuments({
          orderId,
          senderRole: 'admin',
          createdAt: { $gt: lastSeenAt },
        })

        return {
          ...order,
          _id: orderId,
          createdAt:
            order.createdAt?.toISOString?.() || order.createdAt,
          updatedAt:
            order.updatedAt?.toISOString?.() || order.updatedAt,

          unreadMessages,
          hasUnreadMessages: unreadMessages > 0,
        }
      })
    )

    return NextResponse.json({
      success: true,
      orders: serializedOrders,
    })
  } catch (error) {
    console.error('My orders error:', error)

    return NextResponse.json(
      { success: false, error: 'Failed to fetch orders' },
      { status: 500 }
    )
  }
}