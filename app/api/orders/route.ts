import clientPromise from '@/lib/mongodb'
import { NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { rateLimit } from '@/lib/rate-limit'
import { headers } from 'next/headers'
import { sendOrderConfirmation } from '@/lib/email'
import { notifyNewOrder } from '@/lib/orders-stream'
import { getJwtSecret } from '@/lib/jwt-secret'
import { canAccessAdmin, isModeratorRole } from '@/lib/roles'

const JWT_SECRET = new TextEncoder().encode(getJwtSecret())

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

const ALLOWED_SERVICES = [
  'graduation-projects',
  'academic-reports',
  'custom-websites',
  'mobile-apps',
  'powerpoint-presentations',
  'cv-resume-writing',
  'translation',
  'code-debugging',
]

function validateEmail(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  return emailRegex.test(email) && email.length <= 254
}

function validateRequirements(requirements: string): boolean {
  const trimmed = requirements.trim()
  return trimmed.length >= 20 && trimmed.length <= 5000
}

export async function POST(request: Request) {
  try {
    const headersList = await headers()
    const ip =
      headersList.get('x-forwarded-for') ||
      headersList.get('x-real-ip') ||
      'unknown'

    const { allowed, remaining } = rateLimit(ip, 5, 60_000)

    if (!allowed) {
      return NextResponse.json(
        { success: false, error: 'Too many requests. Please try again later.' },
        {
          status: 429,
          headers: {
            'Retry-After': '60',
            'X-RateLimit-Remaining': remaining.toString(),
          },
        }
      )
    }

    const body = await request.json()
    const { studentEmail, service, requirements, price } = body

    if (!studentEmail || !service || !requirements || price === undefined) {
      return NextResponse.json(
        {
          success: false,
          error:
            'All fields are required: email, service, requirements, price',
        },
        { status: 400 }
      )
    }

    if (!validateEmail(studentEmail)) {
      return NextResponse.json(
        { success: false, error: 'Please provide a valid email address' },
        { status: 400 }
      )
    }

    if (!ALLOWED_SERVICES.includes(service)) {
      return NextResponse.json(
        { success: false, error: 'Invalid service selected' },
        { status: 400 }
      )
    }

    if (!validateRequirements(requirements)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Requirements must be between 20 and 5000 characters',
        },
        { status: 400 }
      )
    }

    const sanitizedOrder = {
      studentEmail: studentEmail.toLowerCase().trim(),
      service,
      requirements: requirements.trim(),
      price: 0,
      priceRange: { min: 0, max: 0 },
      finalPrice: null,
      priority: body.priority || 'normal',
      status: 'pending',
      paymentStatus: 'unpaid',
      depositAmount: 0,
      remainingAmount: 0,
      commission: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const client = await clientPromise
    const db = client.db(process.env.DB_NAME || 'student_services')

    const result = await db.collection('orders').insertOne(sanitizedOrder)
    const orderId = result.insertedId.toString()

    sendOrderConfirmation(
      sanitizedOrder.studentEmail,
      SERVICE_NAMES[service],
      price,
      orderId
    ).catch(() => {})

    notifyNewOrder({
      _id: orderId,
      studentEmail: sanitizedOrder.studentEmail,
      service: sanitizedOrder.service,
      price: sanitizedOrder.price,
      status: 'pending',
      createdAt: sanitizedOrder.createdAt,
    })

    return NextResponse.json(
      {
        success: true,
        orderId,
      },
      {
        headers: {
          'X-RateLimit-Remaining': remaining.toString(),
        },
      }
    )
  } catch (error) {
    console.error('Error creating order:', error)

    return NextResponse.json(
      { success: false, error: 'Failed to create order. Please try again.' },
      { status: 500 }
    )
  }
}

export async function GET() {
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

    const client = await clientPromise
    const db = client.db(process.env.DB_NAME || 'student_services')

    let query = {}

    if (isModeratorRole(userRole)) {
      query = {
        $or: [
          { assignedTo: { $exists: false }, status: 'pending' },
          { assignedTo: userId },
        ],
      }
    }

    const orders = await db
      .collection('orders')
      .find(query)
      .sort({ createdAt: -1 })
      .toArray()

   const serializedOrders = await Promise.all(
  orders.map(async (order) => {
    const orderId = order._id.toString()

    const chatView = await db.collection('chat_views').findOne({
      orderId,
      viewer: 'admin',
    })

    const lastSeenAt = chatView?.lastSeenAt || new Date(0)

    const unreadMessages = await db.collection('messages').countDocuments({
      orderId,
      senderRole: 'student',
      createdAt: { $gt: lastSeenAt },
    })

    return {
      ...order,
      _id: orderId,
      createdAt: order.createdAt?.toISOString?.() || order.createdAt,
      updatedAt: order.updatedAt?.toISOString?.() || order.updatedAt,
      unreadMessages,
      hasUnreadMessages: unreadMessages > 0,
    }
  })
)

    return NextResponse.json({ success: true, orders: serializedOrders })
  } catch (error) {
    console.error('Error fetching orders:', error)

    return NextResponse.json(
      { success: false, error: 'Failed to fetch orders' },
      { status: 500 }
    )
  }
}