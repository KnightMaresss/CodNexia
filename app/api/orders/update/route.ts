import clientPromise from '@/lib/mongodb'
import { NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { ObjectId } from 'mongodb'
import { getJwtSecret } from '@/lib/jwt-secret'
import { canAccessAdmin} from '@/lib/roles'
import { createAuditLog } from '@/lib/audit-log'
import { notifyOrderUpdated } from '@/lib/orders-stream'
import { createNotification } from '@/lib/notifications'
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
      deliveryEstimate,
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

if (order.assignedTo && order.assignedTo !== userId) {
  return NextResponse.json(
    {
      success: false,
      error: 'This order is assigned to another moderator',
    },
    { status: 403 }
  )
}

  if (
  (finalPrice !== undefined || deliveryEstimate !== undefined) &&
  !status
) {
      await db.collection('orders').updateOne(
        { _id: new ObjectId(orderId) },
        {
        $set: {
  ...(finalPrice !== undefined && { finalPrice }),
  ...(depositAmount !== undefined && { depositAmount }),
  ...(remainingAmount !== undefined && { remainingAmount }),
  ...(commission !== undefined && { commission }),
  ...(deliveryEstimate !== undefined && { deliveryEstimate }),
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
       message:
       deliveryEstimate
    ? `Order ${orderId} timeline was updated`
    : `Order ${orderId} price was updated`,
        metadata: {
          orderId,
          finalPrice,
          depositAmount,
          remainingAmount,
          commission,
          deliveryEstimate,
        },
      })

    notifyOrderUpdated({ orderId, type: 'price' })
try {
  const studentUser = await db.collection('users').findOne({
    email: order.studentEmail,
  })

  if (studentUser?._id) {
    await createNotification({
      userId: studentUser._id.toString(),
      type: 'order_updated',
      title: 'Price ready',
      message:
      deliveryEstimate
    ? 'Your order timeline was updated.'
    : 'Your order price has been reviewed and is ready for payment.',
      link: '/my-orders',
      orderId,
    })
  }
} catch (notificationError) {
  console.error('PRICE_READY_NOTIFICATION_ERROR:', notificationError)
}
const SERVICE_NAMES: Record<string, string> = {
  'graduation-projects': 'Graduation Projects',
  'academic-reports': 'Academic Reports',
  'custom-websites': 'Custom Websites',
  'mobile-apps': 'Mobile Apps',
  'powerpoint-presentations': 'PowerPoint Presentations',
  'cv-resume-writing': 'CV/Resume Writing',
  'translation': 'Translation (En↔Ar)',
  'code-debugging': 'Code Debugging',
  'ai-automation': 'AI Automation',
   'ui-ux-design': 'UI/UX Design',
}

const { sendPriceReadyEmail } = await import('@/lib/email-notifications')

const nextFinalPrice = finalPrice ?? order.finalPrice
const nextDepositAmount = depositAmount ?? order.depositAmount ?? 0
const nextRemainingAmount = remainingAmount ?? order.remainingAmount ?? 0
const nextDeliveryEstimate = deliveryEstimate ?? order.deliveryEstimate

const shouldSendPriceReadyEmail =
  finalPrice !== undefined &&
  nextFinalPrice &&
  nextDeliveryEstimate

if (shouldSendPriceReadyEmail) {
  sendPriceReadyEmail(
    order.studentEmail,
    SERVICE_NAMES[order.service] || order.service,
    nextFinalPrice,
    nextDepositAmount,
    nextRemainingAmount,
    orderId,
    nextDeliveryEstimate
  ).catch((err) => console.error('Price ready email error:', err))
}

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
try {
  if (paymentStatus === 'fully_paid' || paymentStatus === 'deposit_paid') {
    const studentUser = await db.collection('users').findOne({
      email: order.studentEmail,
    })

    if (studentUser?._id) {
      await createNotification({
        userId: studentUser._id.toString(),
        type: 'payment_confirmed',
        title: 'Payment confirmed',
        message:
         paymentStatus === 'deposit_paid'
            ? 'Your deposit payment was confirmed.'
            : 'Your payment was confirmed.',
        link: '/my-orders',
        orderId,
      })
    }

    if (order.assignedTo) {
      await createNotification({
        userId: order.assignedTo.toString(),
        type: 'payment_confirmed',
        title: 'Payment received',
        message:
        paymentStatus === 'deposit_paid'
            ? 'A deposit payment was received for your assigned order.'
            : 'Payment was received for your assigned order.',
        link: '/admin',
        orderId,
      })
    }
  }
} catch (notificationError) {
  console.error('PAYMENT_STATUS_NOTIFICATION_ERROR:', notificationError)
}

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
try {
  const studentUser = await db.collection('users').findOne({
    email: order.studentEmail,
  })

  if (studentUser?._id) {
    const statusTitle =
      status === 'completed'
        ? 'Order completed'
        : status === 'cancelled'
          ? 'Order cancelled'
          : 'Order updated'

    const statusMessage =
      status === 'completed'
        ? 'Your order has been completed.'
        : status === 'cancelled'
          ? 'Your order has been cancelled.'
          : `Your order status changed from ${oldStatus} to ${status}.`

    await createNotification({
      userId: studentUser._id.toString(),
      type: status === 'completed' ? 'order_completed' : 'order_updated',
      title: statusTitle,
      message: statusMessage,
      link: '/my-orders',
      orderId,
    })
  }
} catch (notificationError) {
  console.error('ORDER_STATUS_NOTIFICATION_ERROR:', notificationError)
}
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
  oldStatus,
  order.depositAmount || 0,
  order.remainingAmount || 0
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