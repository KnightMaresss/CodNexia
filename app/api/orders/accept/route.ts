import clientPromise from '@/lib/mongodb'
import { NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { ObjectId } from 'mongodb'
import { getJwtSecret } from '@/lib/jwt-secret'
const JWT_SECRET = new TextEncoder().encode(getJwtSecret())
const MOD_ROLES = ['founder', 'moderator']

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    const adminToken = cookieStore.get('admin_token')?.value
    const studentToken = cookieStore.get('student_token')?.value
    
    let userId = ''
    let userName = ''
    let userRole = ''

    // Get current user info from token
    const token = adminToken || studentToken
    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    try {
      const { payload } = await jwtVerify(token, JWT_SECRET)
      if (!MOD_ROLES.includes(payload.role as string)) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
      }
      userId = payload.userId as string
      userName = payload.name as string || payload.email as string
      userRole = payload.role as string
    } catch {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { orderId } = await request.json()
    if (!orderId) {
      return NextResponse.json({ success: false, error: 'Order ID required' }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db(process.env.DB_NAME || 'student_services')

    // Check if order exists and not already assigned
    const order = await db.collection('orders').findOne({ _id: new ObjectId(orderId) })
    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 })
    }
        // Moderators can only have 1 active (in-progress) order at a time
    if (userRole === 'moderator') {
      const activeOrder = await db.collection('orders').findOne({
        assignedTo: userId,
        status: 'in-progress'
      })
      if (activeOrder) {
        return NextResponse.json({ 
          success: false, 
          error: 'You already have an active order. Complete it before accepting a new one.' 
        }, { status: 400 })
      }
    }

    // Founders can override assignments, moderators cannot
    if (order.assignedTo && userRole !== 'founder') {
      return NextResponse.json({ success: false, error: 'Order already assigned to another moderator' }, { status: 400 })
    }

    await db.collection('orders').updateOne(
      { _id: new ObjectId(orderId) },
      { 
        $set: { 
          assignedTo: userId,
          assignedToName: userName,
          status: order.status === 'pending' ? 'in-progress' : order.status,
          updatedAt: new Date() 
        } 
      }
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Accept order error:', error)
    return NextResponse.json({ success: false, error: 'Failed to accept order' }, { status: 500 })
  }
}