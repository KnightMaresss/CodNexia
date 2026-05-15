import clientPromise from '@/lib/mongodb'
import { NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { ObjectId } from 'mongodb'
import { getJwtSecret } from '@/lib/jwt-secret'
import { isFounderRole } from '@/lib/roles'

const JWT_SECRET = new TextEncoder().encode(getJwtSecret())

export async function GET(request: Request) {
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
    const currentUserRole = typeof payload.role === 'string' ? payload.role : null

    if (!isFounderRole(currentUserRole)) {
      return NextResponse.json(
        { success: false, error: 'Only founder can view' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('id')

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID required' },
        { status: 400 }
      )
    }

    if (!ObjectId.isValid(userId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid user ID' },
        { status: 400 }
      )
    }

    const client = await clientPromise
    const db = client.db(process.env.DB_NAME || 'student_services')

    const user = await db.collection('users').findOne(
      { _id: new ObjectId(userId) },
      { projection: { password: 0 } }
    )

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role || 'student',
        profilePic: user.profilePic || '',
        blocked: user.blocked || false,
        createdAt: user.createdAt,
        lastSeen: user.lastSeen,
      },
    })
  } catch (error) {
    console.error('Admin user fetch error:', error)

    return NextResponse.json(
      { success: false, error: 'Failed' },
      { status: 500 }
    )
  }
}