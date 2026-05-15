import { NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { getJwtSecret } from '@/lib/jwt-secret'
import { canAccessAdmin, isModeratorRole } from '@/lib/roles'

const JWT_SECRET = new TextEncoder().encode(getJwtSecret())

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get('orderId')

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: 'Order ID is required' },
        { status: 400 }
      )
    }

    if (!ObjectId.isValid(orderId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid order ID' },
        { status: 400 }
      )
    }

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

    const userRole = typeof payload.role === 'string' ? payload.role : null
    const userId = typeof payload.userId === 'string' ? payload.userId : null

    const isStudent = userRole === 'student'
    const isAdmin = canAccessAdmin(userRole)

    if (!isStudent && !isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const client = await clientPromise
    const db = client.db(process.env.DB_NAME || 'student_services')

    if (isModeratorRole(userRole)) {
      const order = await db.collection('orders').findOne({
        _id: new ObjectId(orderId),
      })

      if (!order || order.assignedTo !== userId) {
        return NextResponse.json(
          { success: false, error: 'Access denied' },
          { status: 403 }
        )
      }
    }

    const files = await db
      .collection('order_files')
      .find({ orderId })
      .sort({ uploadedAt: -1 })
      .toArray()

    return NextResponse.json({
      success: true,
      files: files.map((f) => ({
        id: f.cloudinaryPublicId,
        name: f.fileName,
        size: f.fileSize,
        type: f.fileType,
        url: f.cloudinaryUrl,
        uploadedAt: f.uploadedAt,
      })),
    })
  } catch (error) {
    console.error('Fetch files error:', error)

    return NextResponse.json(
      { success: false, error: 'Failed to fetch files' },
      { status: 500 }
    )
  }
}