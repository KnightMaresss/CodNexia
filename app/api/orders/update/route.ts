import clientPromise from '@/lib/mongodb'
import { NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { ObjectId } from 'mongodb'

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret')

export async function PUT(request: Request) {
  try {
    // Auth check
    const cookieStore = await cookies()
    const token = cookieStore.get('admin_token')?.value || cookieStore.get('student_token')?.value
    
    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    let payload
    try {
      const verified = await jwtVerify(token, JWT_SECRET)
      payload = verified.payload
    } catch {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const adminRoles = ['founder', 'moderator']
    if (!adminRoles.includes(payload.role as string)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = payload.role as string
    const userId = payload.userId as string

    const body = await request.json()
    const { orderId, status, finalPrice, depositAmount, remainingAmount, commission, paymentStatus } = body

    if (!orderId) {
      return NextResponse.json({ success: false, error: 'Order ID is required' }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db(process.env.DB_NAME || 'student_services')

    // Get the order first
    const order = await db.collection('orders').findOne({
      _id: new ObjectId(orderId),
    })

    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 })
    }

    // Moderators can only update orders assigned to them
    if (userRole === 'moderator' && order.assignedTo !== userId) {
      return NextResponse.json(
        { success: false, error: 'You can only update orders assigned to you' },
        { status: 403 }
      )
    }

    // Handle price setting (non-status update)
    if (finalPrice !== undefined && !status) {
      await db.collection('orders').updateOne(
        { _id: new ObjectId(orderId) },
        { $set: { finalPrice, depositAmount, remainingAmount, commission, updatedAt: new Date() } }
      )
      return NextResponse.json({ success: true })
    }

    // Handle payment status update
    if (paymentStatus && !status) {
      await db.collection('orders').updateOne(
        { _id: new ObjectId(orderId) },
        { $set: { paymentStatus, updatedAt: new Date() } }
      )
      return NextResponse.json({ success: true })
    }

    // Handle status update
    if (!status) {
      return NextResponse.json({ success: false, error: 'Status is required' }, { status: 400 })
    }

    const validStatuses = ['pending', 'in-progress', 'completed', 'cancelled']
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ success: false, error: 'Invalid status' }, { status: 400 })
    }

    const oldStatus = order.status

    await db.collection('orders').updateOne(
      { _id: new ObjectId(orderId) },
      {
        $set: {
          status,
          updatedAt: new Date(),
        },
      }
    )

    // Send email notification to student
    const SERVICE_NAMES: Record<string, string> = {
      'graduation-projects': 'Graduation Projects',
      'academic-reports': 'Academic Reports',
      'custom-websites': 'Custom Websites',
      'mobile-apps': 'Mobile Apps',
    }

    const { sendStatusUpdateEmail } = await import('@/lib/email-notifications')
    sendStatusUpdateEmail(
      order.studentEmail,
      SERVICE_NAMES[order.service] || order.service,
      order.price,
      orderId,
      status,
      oldStatus
    ).catch(err => console.error('Email error:', err))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating order:', error)
    return NextResponse.json({ success: false, error: 'Failed to update order' }, { status: 500 })
  }
}