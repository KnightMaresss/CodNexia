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
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { payload } = await jwtVerify(token, JWT_SECRET)

    const userRole = typeof payload.role === 'string' ? payload.role : null
    const userId = typeof payload.userId === 'string' ? payload.userId : null

    if (!canAccessAdmin(userRole) || !userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { orderId, txHash, action } = await request.json()

    if (!orderId || !ObjectId.isValid(orderId)) {
      return NextResponse.json({ success: false, error: 'Invalid order ID' }, { status: 400 })
    }

    if (!txHash || typeof txHash !== 'string') {
      return NextResponse.json({ success: false, error: 'Transaction hash is required' }, { status: 400 })
    }

    if (!['confirm', 'reject'].includes(action)) {
      return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db(process.env.DB_NAME || 'student_services')

    const order = await db.collection('orders').findOne({
      _id: new ObjectId(orderId),
      'cryptoPayments.txHash': txHash,
    })

    if (!order) {
      return NextResponse.json({ success: false, error: 'Payment not found' }, { status: 404 })
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

    const payment = order.cryptoPayments?.find(
      (payment: { txHash: string }) => payment.txHash === txHash
    )

    if (!payment) {
      return NextResponse.json({ success: false, error: 'Payment not found' }, { status: 404 })
    }

    if (payment.status !== 'pending') {
      return NextResponse.json(
        { success: false, error: 'This payment has already been reviewed' },
        { status: 400 }
      )
    }

    if (action === 'reject') {
      await db.collection('orders').updateOne(
        {
          _id: new ObjectId(orderId),
          'cryptoPayments.txHash': txHash,
        },
        {
          $set: {
            paymentStatus:
              payment.type === 'deposit' ? 'unpaid' : 'deposit_paid',
            'cryptoPayments.$.status': 'rejected',
            'cryptoPayments.$.reviewedAt': new Date(),
            'cryptoPayments.$.reviewedBy':
             typeof payload.name === 'string'
             ? payload.name
             : userId,
            updatedAt: new Date(),
          },
        }
      )

      await createAuditLog({
        action: 'CRYPTO_PAYMENT_REJECTED',
        actor: {
          id: userId,
          email: typeof payload.email === 'string' ? payload.email : null,
          name: typeof payload.name === 'string' ? payload.name : null,
          role: userRole,
        },
        targetType: 'order',
        targetId: orderId,
        message: `Crypto payment ${txHash} was rejected`,
        metadata: { orderId, txHash, paymentType: payment.type },
      })

      notifyOrderUpdated({
        orderId,
        type: 'payment-status',
        paymentStatus: payment.type === 'deposit' ? 'unpaid' : 'deposit_paid',
      })

      return NextResponse.json({ success: true })
    }

    const newPaymentStatus =
      payment.type === 'deposit' ? 'deposit_paid' : 'fully_paid'

    await db.collection('orders').updateOne(
      {
        _id: new ObjectId(orderId),
        'cryptoPayments.txHash': txHash,
      },
      {
        $set: {
          paymentStatus: newPaymentStatus,
          'cryptoPayments.$.status': 'confirmed',
          'cryptoPayments.$.confirmedAt': new Date(),
          'cryptoPayments.$.reviewedBy':
           typeof payload.name === 'string'
           ? payload.name
           : userId,
          updatedAt: new Date(),
        },
      }
    )

    await createAuditLog({
      action: 'CRYPTO_PAYMENT_CONFIRMED',
      actor: {
        id: userId,
        email: typeof payload.email === 'string' ? payload.email : null,
        name: typeof payload.name === 'string' ? payload.name : null,
        role: userRole,
      },
      targetType: 'order',
      targetId: orderId,
      message: `Crypto payment ${txHash} was confirmed`,
      metadata: { orderId, txHash, paymentType: payment.type },
    })

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
          title: payment.type === 'deposit' ? 'Deposit confirmed' : 'Payment confirmed',
          message:
            payment.type === 'deposit'
              ? 'Your crypto deposit was confirmed. Work can now begin on your order.'
              : 'Your final crypto payment was confirmed.',
          link: '/my-orders',
          orderId,
        })
      }

      if (order.assignedTo) {
        await createNotification({
          userId: order.assignedTo.toString(),
          type: 'payment_confirmed',
          title: payment.type === 'deposit' ? 'Deposit received' : 'Payment received',
          message:
            payment.type === 'deposit'
              ? 'The client crypto deposit was confirmed.'
              : 'The client final crypto payment was confirmed.',
          link: '/admin',
          orderId,
        })
      }
    } catch (notificationError) {
      console.error('CRYPTO_ADMIN_REVIEW_NOTIFICATION_ERROR:', notificationError)
    }

    return NextResponse.json({
      success: true,
      paymentStatus: newPaymentStatus,
    })
  } catch (error) {
    console.error('Crypto admin review error:', error)

    return NextResponse.json(
      { success: false, error: 'Failed to review crypto payment' },
      { status: 500 }
    )
  }
}