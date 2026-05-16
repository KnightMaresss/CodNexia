import clientPromise from '@/lib/mongodb'
import { NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { ObjectId } from 'mongodb'
import { getJwtSecret } from '@/lib/jwt-secret'
import { canAccessAdmin, isFounderRole, isModeratorRole } from '@/lib/roles'
import { createAuditLog } from '@/lib/audit-log'
import { notifyOrderUpdated } from '@/lib/orders-stream'

const JWT_SECRET = new TextEncoder().encode(getJwtSecret())

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    const adminToken = cookieStore.get('admin_token')?.value
    const studentToken = cookieStore.get('student_token')?.value

    const token = adminToken || studentToken

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { payload } = await jwtVerify(token, JWT_SECRET)

    const userId = typeof payload.userId === 'string' ? payload.userId : null
    const userRole = typeof payload.role === 'string' ? payload.role : null
    const userName =
      typeof payload.name === 'string'
        ? payload.name
        : typeof payload.email === 'string'
          ? payload.email
          : ''

    if (!userId || !canAccessAdmin(userRole)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { orderId } = await request.json()

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: 'Order ID required' },
        { status: 400 }
      )
    }

    if (!ObjectId.isValid(orderId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid order ID' },
        { status: 400 }
      )
    }

    const client = await clientPromise
    const db = client.db(process.env.DB_NAME || 'student_services')

    const order = await db.collection('orders').findOne({
      _id: new ObjectId(orderId),
    })

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      )
    }

    if (isModeratorRole(userRole)) {
      const activeOrder = await db.collection('orders').findOne({
        assignedTo: userId,
        status: 'in-progress',
      })

      if (activeOrder) {
        return NextResponse.json(
          {
            success: false,
            error:
              'You already have an active order. Complete it before accepting a new one.',
          },
          { status: 400 }
        )
      }
    }

    if (order.assignedTo && !isFounderRole(userRole)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Order already assigned to another moderator',
        },
        { status: 400 }
      )
    }

    await db.collection('orders').updateOne(
      { _id: new ObjectId(orderId) },
      {
        $set: {
          assignedTo: userId,
          assignedToName: userName,
          status: order.status === 'pending' ? 'in-progress' : order.status,
          updatedAt: new Date(),
        },
      }
    )

    await createAuditLog({
      action: 'ORDER_ACCEPTED',
      actor: {
        id: userId,
        email: typeof payload.email === 'string' ? payload.email : null,
        name: userName,
        role: userRole,
      },
      targetType: 'order',
      targetId: orderId,
      message: `Order ${orderId} was accepted by ${userName}`,
      metadata: {
        orderId,
        assignedTo: userId,
        assignedToName: userName,
      },
    })

    notifyOrderUpdated({
      orderId,
      assignedTo: userId,
      assignedToName: userName,
      type: 'accepted',
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Accept order error:', error)

    return NextResponse.json(
      { success: false, error: 'Failed to accept order' },
      { status: 500 }
    )
  }
}