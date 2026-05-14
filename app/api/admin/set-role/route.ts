import clientPromise from '@/lib/mongodb'
import { NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { cookies } from 'next/headers'

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret')

export async function POST(request: Request) {
  try {
    // Only founder can change roles
    const cookieStore = await cookies()
    const token = cookieStore.get('admin_token')?.value || cookieStore.get('student_token')?.value
    
    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { payload } = await jwtVerify(token, JWT_SECRET)
    if (payload.role !== 'founder') {
      return NextResponse.json({ success: false, error: 'Only founder can change roles' }, { status: 403 })
    }

    const { email, role } = await request.json()

    if (!email || !role) {
      return NextResponse.json({ success: false, error: 'Email and role required' }, { status: 400 })
    }

    const validRoles = ['student', 'moderator', 'founder']
    if (!validRoles.includes(role)) {
      return NextResponse.json({ success: false, error: 'Invalid role' }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db(process.env.DB_NAME || 'student_services')

    const result = await db.collection('users').updateOne(
      { email: email.toLowerCase().trim() },
      { $set: { role, updatedAt: new Date() } }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, message: `${email} is now a ${role}` })
  } catch (error) {
    console.error('Set role error:', error)
    return NextResponse.json({ success: false, error: 'Failed to set role' }, { status: 500 })
  }
}