import clientPromise from '@/lib/mongodb'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { orderId } = await request.json()

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: 'Order ID is required' },
        { status: 400 }
      )
    }

    const client = await clientPromise
    const db = client.db(process.env.DB_NAME || 'student_services')

    const { ObjectId } = await import('mongodb')

    let objectId
    try {
      objectId = new ObjectId(orderId)
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid Order ID format' },
        { status: 400 }
      )
    }

    const order = await db.collection('orders').findOne({
      _id: objectId,
    })

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found. Please check your Order ID.' },
        { status: 404 }
      )
    }

    // Return all fields including payment info
    return NextResponse.json({
      success: true,
      order: {
        _id: order._id.toString(),
        service: order.service,
        requirements: order.requirements,
        status: order.status,
        price: order.price,
        finalPrice: order.finalPrice,           // ✅ Added
        paymentStatus: order.paymentStatus,     // ✅ Added
        depositAmount: order.depositAmount,     // ✅ Added
        remainingAmount: order.remainingAmount, // ✅ Added
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      },
    })
  } catch (error) {
    console.error('Error tracking order:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to track order' },
      { status: 500 }
    )
  }
}