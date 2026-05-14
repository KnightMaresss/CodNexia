import clientPromise from '@/lib/mongodb'
import { NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { ObjectId } from 'mongodb'

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret')

export async function PUT(request: Request) {
  try {
    // Auth check - student only
    const cookieStore = await cookies()
    const studentToken = cookieStore.get('student_token')?.value

    if (!studentToken) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { payload } = await jwtVerify(studentToken, JWT_SECRET)
    if (payload.role !== 'student') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { orderId } = await request.json()

    if (!orderId) {
      return NextResponse.json({ success: false, error: 'Order ID required' }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db(process.env.DB_NAME || 'student_services')

    const order = await db.collection('orders').findOne({
      _id: new ObjectId(orderId),
      studentEmail: payload.email,
    })

    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 })
    }

    // Only allow cancel if status is pending
    if (order.status !== 'pending') {
      return NextResponse.json(
        { success: false, error: 'Only pending orders can be cancelled' },
        { status: 400 }
      )
    }

    await db.collection('orders').updateOne(
      { _id: new ObjectId(orderId) },
      { $set: { status: 'cancelled', updatedAt: new Date() } }
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Cancel order error:', error)
    return NextResponse.json({ success: false, error: 'Failed to cancel order' }, { status: 500 })
  }
}