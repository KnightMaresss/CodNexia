import clientPromise from '@/lib/mongodb'
import { NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { ObjectId } from 'mongodb'

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret')

export async function PUT(request: Request) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('admin_token')?.value || cookieStore.get('student_token')?.value
    
    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { payload } = await jwtVerify(token, JWT_SECRET)
    const adminRoles = ['founder', 'moderator']
    if (!adminRoles.includes(payload.role as string)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { orderId, note } = await request.json()
    
    if (!orderId) {
      return NextResponse.json({ success: false, error: 'Order ID required' }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db(process.env.DB_NAME || 'student_services')

    await db.collection('orders').updateOne(
      { _id: new ObjectId(orderId) },
      { $set: { internalNote: note?.trim() || '', noteUpdatedAt: new Date(), noteUpdatedBy: payload.name || 'Staff' } }
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Note update error:', error)
    return NextResponse.json({ success: false, error: 'Failed to save note' }, { status: 500 })
  }
}