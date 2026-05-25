import clientPromise from '@/lib/mongodb'
import { ObjectId} from 'mongodb'
import { NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { getJwtSecret } from '@/lib/jwt-secret'
import { createNowPaymentsPayment } from '@/lib/nowpayments'

const JWT_SECRET = new TextEncoder().encode(getJwtSecret())

type PaymentType = 'deposit' | 'final'

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('student_token')?.value

    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { payload } = await jwtVerify(token, JWT_SECRET)

    const userId = typeof payload.userId === 'string' ? payload.userId : null
    const email = typeof payload.email === 'string' ? payload.email : null

    if (!userId || !email) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { orderId, paymentType } = await request.json() as {
      orderId?: string
      paymentType?: PaymentType
    }

    if (!orderId || !ObjectId.isValid(orderId)) {
      return NextResponse.json({ success: false, error: 'Invalid order ID' }, { status: 400 })
    }

    if (paymentType !== 'deposit' && paymentType !== 'final') {
      return NextResponse.json({ success: false, error: 'Invalid payment type' }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db(process.env.DB_NAME || 'student_services')

    const order = await db.collection('orders').findOne({
      _id: new ObjectId(orderId),
      studentEmail: email,
    })

    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 })
    }

 const currentPaymentStatus = order.paymentStatus || 'unpaid'

if (
  paymentType === 'deposit' &&
  !['unpaid', 'pending', 'pending_nowpayments'].includes(currentPaymentStatus)
) {
  return NextResponse.json(
    { success: false, error: 'Deposit is not payable right now' },
    { status: 400 }
  )
}

   if (paymentType === 'final' && currentPaymentStatus !== 'deposit_paid') {
      return NextResponse.json({ success: false, error: 'Final payment is not payable right now' }, { status: 400 })
    }

    const amount =
      paymentType === 'deposit'
        ? Number(order.depositAmount || 0)
        : Number(order.remainingAmount || 0)

    if (!amount || amount <= 0) {
      return NextResponse.json({ success: false, error: 'Invalid payment amount' }, { status: 400 })
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://codnexia.com'

    const nowPayment = await createNowPaymentsPayment({
      priceAmount: amount,
      priceCurrency: 'usd',
      payCurrency: 'usdttrc20',
      orderId: `${orderId}:${paymentType}`,
      orderDescription: `Codnexia ${paymentType === 'deposit' ? 'Deposit' : 'Final Payment'} - ${order.service}`,
      ipnCallbackUrl: `${siteUrl}/api/nowpayments/ipn`,
      successUrl: `${siteUrl}/my-orders`,
      cancelUrl: `${siteUrl}/checkout?orderId=${orderId}&type=${paymentType}`,
    })

const nowPaymentRecord = {
  paymentId: String(nowPayment.payment_id || nowPayment.id),
  purchaseId: nowPayment.purchase_id || null,
  type: paymentType,
  amount,
  currency: 'USD',
  payCurrency: nowPayment.pay_currency || 'usdttrc20',
  status: nowPayment.payment_status || 'waiting',
  invoiceUrl: nowPayment.invoice_url || nowPayment.payment_url || null,
  createdAt: new Date(),
}

await db.collection('orders').updateOne(
  { _id: new ObjectId(orderId) },
  {
   $set: {
  nowPayments: [...(order.nowPayments || []), nowPaymentRecord],
  updatedAt: new Date(),
},
  }
)

    return NextResponse.json({
      success: true,
      paymentUrl: nowPayment.invoice_url || nowPayment.payment_url || null,
      payment: nowPayment,
    })
} catch (error) {
  console.error('NOWPayments create payment error:', error)

  return NextResponse.json(
    {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to create NOWPayments payment',
    },
    { status: 500 }
  )
}
}