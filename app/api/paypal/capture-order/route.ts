import { NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { ObjectId } from 'mongodb'
import clientPromise from '@/lib/mongodb'
import { getJwtSecret } from '@/lib/jwt-secret'
import { createNotification } from '@/lib/notifications'
const JWT_SECRET = new TextEncoder().encode(getJwtSecret())

async function getPayPalAccessToken() {
  // ✅ USE SANDBOX URL
  const PAYPAL_API_URL = 'https://api-m.sandbox.paypal.com'
  const auth = Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_SECRET}`).toString('base64')
  
  const res = await fetch(`${PAYPAL_API_URL}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${auth}`,
    },
    body: 'grant_type=client_credentials',
  })
  const data = await res.json()
  return data.access_token
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('student_token')?.value
    
    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { payload } = await jwtVerify(token, JWT_SECRET)
    if (payload.role !== 'student') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { paypalOrderId, orderId, paymentType } = await request.json()

    const accessToken = await getPayPalAccessToken()

    // ✅ USE SANDBOX URL FOR CAPTURE
    const captureRes = await fetch(`https://api-m.sandbox.paypal.com/v2/checkout/orders/${paypalOrderId}/capture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
    })

    const captureData = await captureRes.json()

    if (captureData.status !== 'COMPLETED') {
      console.error('Capture failed:', captureData)
      return NextResponse.json({ success: false, error: 'Payment not completed' }, { status: 400 })
    }

    // Update order payment status
    const client = await clientPromise
    const db = client.db(process.env.DB_NAME || 'student_services')

const newPaymentStatus = paymentType === 'deposit' ? 'deposit_paid' : 'fully_paid'

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
  { _id: new ObjectId(orderId) },
  { $set: { paymentStatus: newPaymentStatus, updatedAt: new Date() } }
)

try {
  const studentUser = await db.collection('users').findOne({
    email: order.studentEmail,
  })

  if (studentUser?._id) {
    await createNotification({
      userId: studentUser._id.toString(),
      type: 'payment_confirmed',
      title: paymentType === 'deposit' ? 'Deposit payment confirmed' : 'Final payment confirmed',
      message:
        paymentType === 'deposit'
          ? 'Your 20% deposit payment was confirmed.'
          : 'Your final payment was confirmed.',
      link: '/my-orders',
      orderId,
    })
  }

  if (order.assignedTo) {
    await createNotification({
      userId: order.assignedTo.toString(),
      type: 'payment_confirmed',
      title: paymentType === 'deposit' ? 'Deposit payment received' : 'Final payment received',
      message:
        paymentType === 'deposit'
          ? 'A 20% deposit payment was received for your assigned order.'
          : 'The final payment was received for your assigned order.',
      link: '/admin',
      orderId,
    })
  }
} catch (notificationError) {
  console.error('PAYMENT_NOTIFICATION_ERROR:', notificationError)
}

return NextResponse.json({ success: true, paymentStatus: newPaymentStatus })


  } catch (error) {
    console.error('PayPal capture error:', error)
    return NextResponse.json({ success: false, error: 'Failed to capture payment' }, { status: 500 })
  }
}