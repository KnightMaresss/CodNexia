import clientPromise from '@/lib/mongodb'
import { NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { ObjectId } from 'mongodb'

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret')

// POST - Submit a rating
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

    const { orderId, rating, comment } = await request.json()
    console.log('📝 Rating request:', { orderId, rating, comment })
    if (!orderId || !rating || rating < 1 || rating > 5) {
      return NextResponse.json({ success: false, error: 'Order ID and rating (1-5) required' }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db(process.env.DB_NAME || 'student_services')

    const order = await db.collection('orders').findOne({
        
      _id: new ObjectId(orderId),
      studentEmail: payload.email,
      status: 'completed'
    })
     console.log('📝 Found order:', order ? 'yes' : 'no')
     console.log('📝 Order details:', JSON.stringify(order))
    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found or not completed' }, { status: 400 })
    }

    const existingRating = await db.collection('ratings').findOne({ orderId })
    if (existingRating) {
      return NextResponse.json({ success: false, error: 'You have already rated this order' }, { status: 400 })
    }

    const ratingDoc = {
      orderId,
      studentEmail: payload.email,
      studentName: payload.name || payload.email,
      assignedTo: order.assignedTo || '',
      assignedToName: order.assignedToName || 'Codnexia',
      service: order.service,
      rating,
      comment: comment?.trim() || '',
      createdAt: new Date(),
    }

    await db.collection('ratings').insertOne(ratingDoc)

    return NextResponse.json({ success: true, rating: ratingDoc })
  } catch (error) {
    console.error('Rating error:', error)
    return NextResponse.json({ success: false, error: 'Failed to submit rating' }, { status: 500 })
  }
}

// GET - Get rating(s)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get('orderId')

    const client = await clientPromise
    const db = client.db(process.env.DB_NAME || 'student_services')

    if (orderId) {
      const rating = await db.collection('ratings').findOne({ orderId })
      return NextResponse.json({ success: true, rating })
    } else {
      const allRatings = await db.collection('ratings').find({}).sort({ createdAt: -1 }).toArray()
      return NextResponse.json({ success: true, ratings: allRatings })
    }
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to fetch ratings' }, { status: 500 })
  }
}