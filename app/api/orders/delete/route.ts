import clientPromise from '@/lib/mongodb'
import { NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { ObjectId } from 'mongodb'
import { getJwtSecret } from '@/lib/jwt-secret'
const JWT_SECRET = new TextEncoder().encode(getJwtSecret())

export async function DELETE(request: Request) {
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

    // Only founder can delete
    if (payload.role !== 'founder') {
      return NextResponse.json({ success: false, error: 'Only founder can delete orders' }, { status: 403 })
    }

    const { orderId } = await request.json()
    if (!orderId) {
      return NextResponse.json({ success: false, error: 'Order ID is required' }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db(process.env.DB_NAME || 'student_services')

    const result = await db.collection('orders').deleteOne({
      _id: new ObjectId(orderId),
    })
    // Also delete the rating if exists
    await db.collection('ratings').deleteOne({ orderId })
    if (result.deletedCount === 0) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting order:', error)
    return NextResponse.json({ success: false, error: 'Failed to delete order' }, { status: 500 })
  }
}