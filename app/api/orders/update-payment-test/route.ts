import clientPromise from '@/lib/mongodb'
import { NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { ObjectId } from 'mongodb'
import { getJwtSecret } from '@/lib/jwt-secret'
import { notifyOrderUpdated } from '@/lib/orders-stream'
import { createNotification } from '@/lib/notifications'

const JWT_SECRET = new TextEncoder().encode(getJwtSecret())

export async function PUT(request: Request) {
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
        { success: false, error: 'Only students can pay' },
        { status: 403 }
      )
    }

    const { orderId, paymentType } = await request.json()

    if (!orderId || !ObjectId.isValid(orderId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid order ID' },
        { status: 400 }
      )
    }

    const client = await clientPromise
    const db = client.db(process.env.DB_NAME || 'student_services')

    const newPaymentStatus =
      paymentType === 'deposit' ? 'deposit_paid' : 'fully_paid'

    const order = await db.collection('orders').findOne({
      _id: new ObjectId(orderId),
      studentEmail: payload.email,
    })

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      )
    }

    await db.collection('orders').updateOne(
      {
        _id: new ObjectId(orderId),
        studentEmail: payload.email,
      },
      {
        $set: {
          paymentStatus: newPaymentStatus,
          updatedAt: new Date(),
        },
      }
    )

    notifyOrderUpdated({
      orderId,
      type: 'payment-status',
      paymentStatus: newPaymentStatus,
    })

    try {
      const studentUser = await db.collection('users').findOne({
        email: order.studentEmail,
      })

      if (studentUser?._id) {
        await createNotification({
          userId: studentUser._id.toString(),
          type: 'payment_confirmed',
          title:
            paymentType === 'deposit'
              ? 'Deposit confirmed'
              : 'Final payment confirmed',
          message:
            paymentType === 'deposit'
              ? 'Your deposit was received. Work can now begin on your order.'
              : 'Your final payment was received. Your completed files are now available.',
          link: '/my-orders',
          orderId,
        })
      }

      if (order.assignedTo) {
        await createNotification({
          userId: order.assignedTo.toString(),
          type: 'payment_confirmed',
          title:
            paymentType === 'deposit'
              ? 'Deposit received'
              : 'Final payment received',
          message:
            paymentType === 'deposit'
              ? 'The client paid the deposit for your assigned order.'
              : 'The client completed the final payment for your assigned order.',
          link: '/admin',
          orderId,
        })
      }
    } catch (notificationError) {
      console.error('TEST_PAYMENT_NOTIFICATION_ERROR:', notificationError)
    }

    return NextResponse.json({
      success: true,
      paymentStatus: newPaymentStatus,
    })
  } catch (error) {
    console.error('Test payment update error:', error)

    return NextResponse.json(
      { success: false, error: 'Failed to update payment' },
      { status: 500 }
    )
  }
}