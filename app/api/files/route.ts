import { NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret')

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

    // Auth check
    const cookieStore = await cookies()
    const adminToken = cookieStore.get('admin_token')?.value
    const studentToken = cookieStore.get('student_token')?.value

    let authenticated = false

     const adminRoles = ['admin', 'founder', 'moderator']
    
    if (adminToken) {
      try {
        const { payload } = await jwtVerify(adminToken, JWT_SECRET)
        if (adminRoles.includes(payload.role as string)) authenticated = true
      } catch {}
    }

    if (!authenticated && studentToken) {
      try {
        const { payload } = await jwtVerify(studentToken, JWT_SECRET)
        if (adminRoles.includes(payload.role as string) || payload.role === 'student') authenticated = true
      } catch {}
    }

       if (!authenticated) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const client = await clientPromise
    const db = client.db(process.env.DB_NAME || 'student_services')

    // Get user role and ID for moderator check
    const token = adminToken || studentToken
    let userRole = ''
    let userId = ''
    if (token) {
      try {
        const { payload } = await jwtVerify(token, JWT_SECRET)
        userRole = (payload.role as string) || ''
        userId = (payload.userId as string) || ''
      } catch {}
    }

    // Moderators can only view files for orders assigned to them
    if (userRole === 'moderator') {
      const order = await db.collection('orders').findOne({ _id: new ObjectId(orderId) })
      if (!order || order.assignedTo !== userId) {
        return NextResponse.json(
          { success: false, error: 'Access denied' },
          { status: 403 }
        )
      }
    }

    const files = await db.collection('order_files')
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