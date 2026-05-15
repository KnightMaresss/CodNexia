import { NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { ObjectId } from 'mongodb'
import clientPromise from '@/lib/mongodb'
import { getJwtSecret } from '@/lib/jwt-secret'
const JWT_SECRET = new TextEncoder().encode(getJwtSecret())

async function getPayPalAccessToken() {
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
      return NextResponse.json({ success: false, error: 'Not authenticated. Please log in.' }, { status: 401 })
    }

    let payload
    try {
      const verified = await jwtVerify(token, JWT_SECRET)
      payload = verified.payload
    } catch (err) {
      console.error('Token verification failed:', err)
      return NextResponse.json({ success: false, error: 'Invalid session. Please log in again.' }, { status: 401 })
    }

    if (payload.role !== 'student') {
      return NextResponse.json({ success: false, error: 'Only students can make payments' }, { status: 403 })
    }

    const { orderId, paymentType } = await request.json()

    const client = await clientPromise
    const db = client.db(process.env.DB_NAME || 'student_services')

    const order = await db.collection('orders').findOne({
      _id: new ObjectId(orderId),
      studentEmail: payload.email,
    })

    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 })
    }

    if (!order.finalPrice) {
      return NextResponse.json({ success: false, error: 'Price not set yet' }, { status: 400 })
    }

    const amount = paymentType === 'deposit' ? order.depositAmount : order.remainingAmount

    const accessToken = await getPayPalAccessToken()

    const paypalOrder = await fetch('https://api-m.sandbox.paypal.com/v2/checkout/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{
          reference_id: orderId,
          description: `${paymentType === 'deposit' ? '20% Deposit' : '80% Final Payment'} - ${order.service}`,
          amount: {
            currency_code: 'EUR',
            value: amount.toString(),
          },
        }],
        application_context: {
         return_url: `${process.env.NEXTAUTH_URL}/my-orders`,
         cancel_url: `${process.env.NEXTAUTH_URL}/my-orders`,
        }
      }),
    })

    const paypalData = await paypalOrder.json()
    
    if (!paypalOrder.ok) {
      console.error('PayPal error:', paypalData)
      return NextResponse.json({ success: false, error: paypalData.message || 'PayPal payment creation failed' }, { status: 500 })
    }


    const approvalUrl = paypalData.links?.find((l: { rel: string }) => l.rel === 'approve')?.href
    
    return NextResponse.json({ success: true, orderId: paypalData.id, approvalUrl })
    
  } catch (error) {
    console.error('PayPal create order error:', error)
    return NextResponse.json({ success: false, error: 'Failed to create payment' }, { status: 500 })
  }
}