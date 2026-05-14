import clientPromise from '@/lib/mongodb'
import { NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { cookies } from 'next/headers'

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret')

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

    // Serialize ObjectId to string
    const serializedOrders = orders.map((order) => ({
      ...order,
      _id: order._id.toString(),
      createdAt: order.createdAt?.toISOString?.() || order.createdAt,
      updatedAt: order.updatedAt?.toISOString?.() || order.updatedAt,
    }))

    return NextResponse.json({ success: true, orders: serializedOrders })
  } catch (error) {
    console.error('My orders error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch orders' },
      { status: 500 }
    )
  }
}