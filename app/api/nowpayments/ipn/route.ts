import crypto from 'crypto'
import clientPromise from '@/lib/mongodb'
import { NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { createNotification } from '@/lib/notifications'
import { notifyOrderUpdated } from '@/lib/orders-stream'

type NowPaymentsIpnPayload = {
  payment_id?: string | number
  invoice_id?: string | number
  parent_payment_id?: string | number
  payment_status?: string
  order_id?: string
  purchase_id?: string
  actually_paid?: number
  pay_amount?: number
  pay_currency?: string
  price_amount?: number
  price_currency?: string
}

function sortObject(obj: unknown): unknown {
  if (obj === null || typeof obj !== 'object') return obj

  if (Array.isArray(obj)) return obj.map(sortObject)

  return Object.keys(obj as Record<string, unknown>)
    .sort()
    .reduce((result, key) => {
      result[key] = sortObject((obj as Record<string, unknown>)[key])
      return result
    }, {} as Record<string, unknown>)
}

function verifyNowPaymentsSignature(rawBody: string, signature: string | null) {
  const secret = process.env.NOWPAYMENTS_IPN_SECRET
  if (!secret || !signature) return false

  const sortedBody = JSON.stringify(sortObject(JSON.parse(rawBody)))

  const hmac = crypto
    .createHmac('sha512', secret)
    .update(sortedBody)
    .digest('hex')

  return hmac === signature
}

export async function POST(request: Request) {
  try {
    const rawBody = await request.text()
    const signature = request.headers.get('x-nowpayments-sig')

    if (!verifyNowPaymentsSignature(rawBody, signature)) {
      return NextResponse.json(
        { success: false, error: 'Invalid IPN signature' },
        { status: 401 }
      )
    }

    const payload = JSON.parse(rawBody) as NowPaymentsIpnPayload

    if (!payload.order_id || !payload.payment_status) {
      return NextResponse.json(
        { success: false, error: 'Invalid IPN payload' },
        { status: 400 }
      )
    }

    const [orderId, paymentType] = payload.order_id.split(':')

    if (!orderId || !ObjectId.isValid(orderId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid order ID' },
        { status: 400 }
      )
    }

    if (paymentType !== 'deposit' && paymentType !== 'final') {
      return NextResponse.json(
        { success: false, error: 'Invalid payment type' },
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

    const status = payload.payment_status

    const isPaid = ['finished', 'confirmed', 'sending'].includes(status)
    const isFailed = ['failed', 'expired', 'refunded'].includes(status)

    const newPaymentStatus = isPaid
      ? paymentType === 'deposit'
        ? 'deposit_paid'
        : 'fully_paid'
      : order.paymentStatus || 'unpaid'

    const incomingPaymentId = String(
      payload.payment_id ||
        payload.invoice_id ||
        payload.parent_payment_id ||
        payload.purchase_id ||
        ''
    )

    const nowPayments = (order.nowPayments || []).map(
      (payment: {
        paymentId?: string
        purchaseId?: string | null
        type?: string
        status?: string
      }) => {
        const samePayment =
          payment.paymentId === incomingPaymentId ||
          payment.purchaseId === payload.purchase_id ||
          payment.type === paymentType

        if (!samePayment) return payment

        return {
          ...payment,
          paymentId: payment.paymentId || incomingPaymentId,
          purchaseId: payload.purchase_id || payment.purchaseId || null,
          status,
          actuallyPaid: payload.actually_paid ?? null,
          payAmount: payload.pay_amount ?? null,
          payCurrency: payload.pay_currency ?? null,
          priceAmount: payload.price_amount ?? null,
          priceCurrency: payload.price_currency ?? null,
          updatedAt: new Date(),
          confirmedAt: isPaid ? new Date() : undefined,
          failedAt: isFailed ? new Date() : undefined,
        }
      }
    )

    await db.collection('orders').updateOne(
      { _id: new ObjectId(orderId) },
      {
        $set: {
          nowPayments,
          paymentStatus: newPaymentStatus,
          updatedAt: new Date(),
        },
      }
    )

    if (isPaid) {
      const studentUser = await db.collection('users').findOne({
        email: order.studentEmail,
      })

      if (studentUser?._id) {
        await createNotification({
          userId: studentUser._id.toString(),
          type: 'payment_confirmed',
          title: paymentType === 'deposit' ? 'Deposit confirmed' : 'Payment confirmed',
          message:
            paymentType === 'deposit'
              ? 'Your NOWPayments deposit was confirmed.'
              : 'Your NOWPayments final payment was confirmed.',
          link: '/my-orders',
          orderId,
        })
      }

      if (order.assignedTo) {
        await createNotification({
          userId: order.assignedTo.toString(),
          type: 'payment_confirmed',
          title: paymentType === 'deposit' ? 'Deposit received' : 'Payment received',
          message:
            paymentType === 'deposit'
              ? 'The client NOWPayments deposit was confirmed.'
              : 'The client NOWPayments final payment was confirmed.',
          link: '/admin',
          orderId,
        })
      }
    }

    notifyOrderUpdated({
      orderId,
      type: 'payment-status',
      paymentStatus: newPaymentStatus,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('NOWPayments IPN error:', error)

    return NextResponse.json(
      { success: false, error: 'Failed to process NOWPayments IPN' },
      { status: 500 }
    )
  }
}