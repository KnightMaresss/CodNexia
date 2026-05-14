import clientPromise from '@/lib/mongodb'
import { NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { rateLimit } from '@/lib/rate-limit'
import { headers } from 'next/headers'
import { sendOrderConfirmation } from '@/lib/email'
import { notifyNewOrder } from '@/lib/orders-stream'

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret')

const SERVICE_NAMES: Record<string, string> = {
  'graduation-projects': 'Graduation Projects',
  'academic-reports': 'Academic Reports',
  'custom-websites': 'Custom Websites',
  'mobile-apps': 'Mobile Apps',
  'powerpoint-presentations': 'PowerPoint Presentations',
  'cv-resume-writing': 'CV/Resume Writing',
  'translation': 'Translation (En↔Ar)',
  'code-debugging': 'Code Debugging',
}
// Allowed services
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
  // RFC 5322 compliant email regex
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  return emailRegex.test(email) && email.length <= 254
}

function validateRequirements(requirements: string): boolean {
  const trimmed = requirements.trim()
  return trimmed.length >= 20 && trimmed.length <= 5000
}

export async function POST(request: Request) {
  try {
    // Rate limiting
    const headersList = await headers()
    const ip = headersList.get('x-forwarded-for') || 
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
          }
        }
      )
    }


    const body = await request.json()
    const { studentEmail, service, requirements, price } = body

    // Validate all fields present
    if (!studentEmail || !service || !requirements || price === undefined) {
      return NextResponse.json(
        { success: false, error: 'All fields are required: email, service, requirements, price' },
        { status: 400 }
      )
    }

    // Validate email
    if (!validateEmail(studentEmail)) {
      return NextResponse.json(
        { success: false, error: 'Please provide a valid email address' },
        { status: 400 }
      )
    }

    // Validate service
    if (!ALLOWED_SERVICES.includes(service)) {
      return NextResponse.json(
        { success: false, error: 'Invalid service selected' },
        { status: 400 }
      )
    }

    // Validate requirements
    if (!validateRequirements(requirements)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Requirements must be between 20 and 5000 characters' 
        },
        { status: 400 }
      )
    }



    // Sanitize inputs
    const sanitizedOrder = {
      studentEmail: studentEmail.toLowerCase().trim(),
      service,
      requirements: requirements.trim(),
      price: 0, // Price set later by mod/founder
      priceRange: { min: 0, max: 0 },
      finalPrice: null,
      priority: body.priority || 'normal',
      status: 'pending',
      paymentStatus: 'unpaid', // unpaid | deposit_paid | fully_paid
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

    // Send emails (don't block the response if it fails)
    sendOrderConfirmation(
      sanitizedOrder.studentEmail,
      SERVICE_NAMES[service],
      price,
      orderId
    ).catch(() => {})

    // Notify connected admin clients
    notifyNewOrder({
      _id: orderId,
      studentEmail: sanitizedOrder.studentEmail,
      service: sanitizedOrder.service,
      price: sanitizedOrder.price,
      status: 'pending',
      createdAt: sanitizedOrder.createdAt,
    })


    return NextResponse.json({
      success: true,
      orderId: orderId,
    }, {



      headers: {
        'X-RateLimit-Remaining': remaining.toString(),
      }
    })
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
    // Auth check
    const cookieStore = await cookies()
    const token = cookieStore.get('admin_token')?.value || cookieStore.get('student_token')?.value
    
    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    let payload
    try {
      const verified = await jwtVerify(token, JWT_SECRET)
      payload = verified.payload
    } catch {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const adminRoles = ['founder', 'moderator']
    if (!adminRoles.includes(payload.role as string)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = payload.role as string
    const userId = payload.userId as string

    const client = await clientPromise
    const db = client.db(process.env.DB_NAME || 'student_services')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query: any = {}
    
    // Moderators can only see:
    // 1. Unassigned pending orders (to accept them)
    // 2. Orders assigned to THEM
    if (userRole === 'moderator') {
      query = {
        $or: [
          { assignedTo: { $exists: false }, status: 'pending' },
          { assignedTo: userId }
        ]
      }
    }
    // Founder sees ALL orders (no filter)

    const orders = await db.collection('orders').find(query).sort({ createdAt: -1 }).toArray()

    const serializedOrders = orders.map((order) => ({
      ...order,
      _id: order._id.toString(),
      createdAt: order.createdAt?.toISOString?.() || order.createdAt,
      updatedAt: order.updatedAt?.toISOString?.() || order.updatedAt,
    }))

    return NextResponse.json({ success: true, orders: serializedOrders })
  } catch  {
    return NextResponse.json({ success: false, error: 'Failed to fetch orders' }, { status: 500 })
  }
}