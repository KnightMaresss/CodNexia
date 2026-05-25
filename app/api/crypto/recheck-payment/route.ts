import clientPromise from '@/lib/mongodb'
import { NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { ObjectId } from 'mongodb'
import { getJwtSecret } from '@/lib/jwt-secret'
import { canAccessAdmin } from '@/lib/roles'
import { verifyTronUsdtPayment } from '@/lib/crypto/tron'

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

    const { orderId, txHash } = await request.json()

    if (!orderId || !ObjectId.isValid(orderId)) {
      return NextResponse.json({ success: false, error: 'Invalid order ID' }, { status: 400 })
    }

    if (!txHash || typeof txHash !== 'string') {
      return NextResponse.json({ success: false, error: 'Transaction hash is required' }, { status: 400 })
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
        { success: false, error: 'This order is assigned to another moderator' },
        { status: 403 }
      )
    }

    const payment = order.cryptoPayments?.find(
      (item: { txHash: string }) => item.txHash === txHash
    )

    if (!payment) {
      return NextResponse.json({ success: false, error: 'Payment not found' }, { status: 404 })
    }

    const expectedAmount =
      payment.type === 'deposit'
        ? Number(order.depositAmount || 0)
        : Number(order.remainingAmount || 0)

    const verification = await verifyTronUsdtPayment({
      txHash,
      expectedAmount,
      expectedReceiver: process.env.NEXT_PUBLIC_CRYPTO_WALLET_ADDRESS || '',
    })

    await db.collection('orders').updateOne(
      {
        _id: new ObjectId(orderId),
        'cryptoPayments.txHash': txHash,
      },
      {
        $set: {
          'cryptoPayments.$.verification': verification,
          updatedAt: new Date(),
        },
      }
    )

    return NextResponse.json({
      success: true,
      verification,
    })
  } catch (error) {
    console.error('Recheck crypto payment error:', error)

    return NextResponse.json(
      { success: false, error: 'Failed to re-check payment' },
      { status: 500 }
    )
  }
}