import clientPromise from '@/lib/mongodb'
import { NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { ObjectId } from 'mongodb'
import { getJwtSecret } from '@/lib/jwt-secret'
import { canAccessAdmin, isModeratorRole } from '@/lib/roles'
import { createAuditLog } from '@/lib/audit-log'
import { notifyOrderUpdated } from '@/lib/orders-stream'

const JWT_SECRET = new TextEncoder().encode(getJwtSecret())

export async function PUT(request: Request) {
  try {
    const cookieStore = await cookies()
    const token =
      cookieStore.get('admin_token')?.value ||
      cookieStore.get('student_token')?.value

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { payload } = await jwtVerify(token, JWT_SECRET)

    const userRole = typeof payload.role === 'string' ? payload.role : null
    const userId = typeof payload.userId === 'string' ? payload.userId : null

    if (!canAccessAdmin(userRole) || !userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      orderId,
      status,
      finalPrice,
      depositAmount,
      remainingAmount,
      commission,
      paymentStatus,
    } = body

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: 'Order ID is required' },
        { status: 400 }
      )
    }

    if (!ObjectId.isValid(orderId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid order ID' },
        { status: 400 }
      )
    }

    const client = await clientPromise
    const db = client.db(process.env.DB_NAME || 'student_services')

    const order = await db.collection('orders').findOne({
      _id: new ObjectId(orderId),
    })

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      )
    }

    if (isModeratorRole(userRole) && order.assignedTo !== userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'You can only update orders assigned to you',
        },
        { status: 403 }
      )
    }

    if (finalPrice !== undefined && !status) {
      await db.collection('orders').updateOne(
        { _id: new ObjectId(orderId) },
        {
          $set: {
            finalPrice,
            depositAmount,
            remainingAmount,
            commission,
            updatedAt: new Date(),
          },
        }
      )

      await createAuditLog({
        action: 'ORDER_PRICE_UPDATED',
        actor: {
          id: userId,
          email: typeof payload.email === 'string' ? payload.email : null,
          name: typeof payload.name === 'string' ? payload.name : null,
          role: userRole,
        },
        targetType: 'order',
        targetId: orderId,
        message: `Order ${orderId} price was updated`,
        metadata: {
          orderId,
          finalPrice,
          depositAmount,
          remainingAmount,
          commission,
        },
      })

    notifyOrderUpdated({ orderId, type: 'price' })

const SERVICE_NAMES: Record<string, string> = {
  'graduation-projects': 'Graduation Projects',
  'academic-reports': 'Academic Reports',
  'custom-websites': 'Custom Websites',
  'mobile-apps': 'Mobile Apps',
  'powerpoint-presentations': 'PowerPoint Presentations',
  'cv-resume-writing': 'CV/Resume Writing',
  translation: 'Translation (En↔Ar)',
  'code-debugging': 'Code Debugging',
}

const { sendPriceReadyEmail } = await import('@/lib/email-notifications')

sendPriceReadyEmail(
  order.studentEmail,
  SERVICE_NAMES[order.service] || order.service,
  finalPrice,
  depositAmount || 0,
  remainingAmount || 0,
  orderId
).catch((err) => console.error('Price ready email error:', err))

return NextResponse.json({ success: true })
    }

    if (paymentStatus && !status) {
      await db.collection('orders').updateOne(
        { _id: new ObjectId(orderId) },
        {
          $set: {
            paymentStatus,
            updatedAt: new Date(),
          },
        }
      )

      await createAuditLog({
        action: 'ORDER_PAYMENT_STATUS_UPDATED',
        actor: {
          id: userId,
          email: typeof payload.email === 'string' ? payload.email : null,
          name: typeof payload.name === 'string' ? payload.name : null,
          role: userRole,
        },
        targetType: 'order',
        targetId: orderId,
        message: `Order ${orderId} payment status changed to ${paymentStatus}`,
        metadata: {
          orderId,
          paymentStatus,
        },
      })

      notifyOrderUpdated({ orderId, type: 'payment-status', paymentStatus })

      return NextResponse.json({ success: true })
    }

    if (!status) {
      return NextResponse.json(
        { success: false, error: 'Status is required' },
        { status: 400 }
      )
    }

    const validStatuses = ['pending', 'in-progress', 'completed', 'cancelled']

    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Invalid status' },
        { status: 400 }
      )
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

    await createAuditLog({
      action: 'ORDER_STATUS_UPDATED',
      actor: {
        id: userId,
        email: typeof payload.email === 'string' ? payload.email : null,
        name: typeof payload.name === 'string' ? payload.name : null,
        role: userRole,
      },
      targetType: 'order',
      targetId: orderId,
      message: `Order ${orderId} status changed from ${oldStatus} to ${status}`,
      metadata: {
        orderId,
        oldStatus,
        newStatus: status,
      },
    })

    notifyOrderUpdated({ orderId, type: 'status', oldStatus, newStatus: status })

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
  order.finalPrice || order.price || 0,
  orderId,
  status,
  oldStatus
)
    .catch((err) => console.error('Email error:', err))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating order:', error)

    return NextResponse.json(
      { success: false, error: 'Failed to update order' },
      { status: 500 }
    )
  }
}