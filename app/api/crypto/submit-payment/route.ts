import clientPromise from '@/lib/mongodb'
import { NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { ObjectId } from 'mongodb'
import { getJwtSecret } from '@/lib/jwt-secret'
import { notifyOrderUpdated } from '@/lib/orders-stream'
import { createNotification, createManyNotifications } from '@/lib/notifications'
import { verifyTronUsdtPayment } from '@/lib/crypto/tron'

const JWT_SECRET = new TextEncoder().encode(getJwtSecret())

const VALID_PAYMENT_TYPES = ['deposit', 'final'] as const
const VALID_TX_HASH = /^[a-fA-F0-9]{64}$/

export async function POST(request: Request) {
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

    if (
      payload.role !== 'student' ||
      typeof payload.email !== 'string' ||
      typeof payload.userId !== 'string'
    ) {
      return NextResponse.json(
        { success: false, error: 'Only students can submit payments' },
        { status: 403 }
      )
    }

    const body = await request.json()

    const {
      orderId,
      paymentType,
      txHash,
      amount,
      currency,
      network,
    } = body

    if (!orderId || !ObjectId.isValid(orderId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid order ID' },
        { status: 400 }
      )
    }

    if (!VALID_PAYMENT_TYPES.includes(paymentType)) {
      return NextResponse.json(
        { success: false, error: 'Invalid payment type' },
        { status: 400 }
      )
    }

    const cleanTxHash =
      typeof txHash === 'string' ? txHash.trim() : ''

    if (!VALID_TX_HASH.test(cleanTxHash)) {
      return NextResponse.json(
        { success: false, error: 'Invalid transaction hash. Please enter a valid 64-character TRON transaction hash.' },
        { status: 400 }
      )
    }

    const paymentAmount = Number(amount)

    if (!paymentAmount || paymentAmount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid payment amount' },
        { status: 400 }
      )
    }

    const client = await clientPromise
    const db = client.db(process.env.DB_NAME || 'student_services')

    const order = await db.collection('orders').findOne({
      _id: new ObjectId(orderId),
      studentEmail: payload.email.toLowerCase().trim(),
    })

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      )
    }

    if (order.paymentStatus === 'pending_crypto_verification') {
      return NextResponse.json(
        {
          success: false,
          error: 'A payment is already waiting for verification for this order.',
        },
        { status: 400 }
      )
    }

    if (order.paymentStatus === 'fully_paid') {
      return NextResponse.json(
        { success: false, error: 'This order is already fully paid.' },
        { status: 400 }
      )
    }

    if (paymentType === 'deposit' && order.paymentStatus !== 'unpaid') {
      return NextResponse.json(
        { success: false, error: 'Deposit payment is not available for this order.' },
        { status: 400 }
      )
    }

    if (paymentType === 'final' && order.paymentStatus !== 'deposit_paid') {
      return NextResponse.json(
        { success: false, error: 'Final payment is not available for this order.' },
        { status: 400 }
      )
    }

    const expectedAmount =
      paymentType === 'deposit'
        ? Number(order.depositAmount || 0)
        : Number(order.remainingAmount || 0)

    if (!expectedAmount || Math.abs(paymentAmount - expectedAmount) > 0.01) {
      return NextResponse.json(
        { success: false, error: 'Payment amount does not match the order amount.' },
        { status: 400 }
      )
    }

    const existingHash = await db.collection('orders').findOne({
      'cryptoPayments.txHash': cleanTxHash,
    })

    if (existingHash) {
      return NextResponse.json(
        { success: false, error: 'This transaction hash was already submitted.' },
        { status: 409 }
      )
    }

const verification = await verifyTronUsdtPayment({
  txHash: cleanTxHash,
  expectedAmount,
  expectedReceiver: process.env.NEXT_PUBLIC_CRYPTO_WALLET_ADDRESS || '',
})

const cryptoPayment = {
  txHash: cleanTxHash,
  amount: paymentAmount,
  currency: currency || 'USDT',
  network: network || 'TRC20',
  type: paymentType,
  status: 'pending',
  submittedAt: new Date(),
  verification,
}

    await db.collection('orders').updateOne(
      { _id: new ObjectId(orderId) },
      {
        $set: {
          paymentStatus: 'pending_crypto_verification',
          updatedAt: new Date(),
        },
       $push: {
  cryptoPayments: cryptoPayment,
} as never,
      }
    )

    notifyOrderUpdated({
      orderId,
      type: 'payment-status',
      paymentStatus: 'pending_crypto_verification',
    })

    try {
      const admins = await db
        .collection('users')
        .find({
          role: { $in: ['founder', 'moderator'] },
        })
        .project({ _id: 1 })
        .toArray()

      await createManyNotifications({
        userIds: admins.map((admin) => admin._id.toString()),
        type: 'payment_submitted',
        title: 'Crypto payment submitted',
        message: `A ${paymentType} crypto payment is waiting for verification.`,
        link: '/admin',
        orderId,
      })

      const studentUser = await db.collection('users').findOne({
        email: order.studentEmail,
      })

      if (studentUser?._id) {
        await createNotification({
          userId: studentUser._id.toString(),
          type: 'payment_submitted',
          title: 'Payment submitted',
          message: 'Your crypto payment was submitted and is waiting for verification.',
          link: '/my-orders',
          orderId,
        })
      }
    } catch (notificationError) {
      console.error('CRYPTO_PAYMENT_NOTIFICATION_ERROR:', notificationError)
    }

    return NextResponse.json({
      success: true,
      paymentStatus: 'pending_crypto_verification',
    })
  } catch (error) {
    console.error('Submit crypto payment error:', error)

    return NextResponse.json(
      { success: false, error: 'Failed to submit crypto payment' },
      { status: 500 }
    )
  }
}