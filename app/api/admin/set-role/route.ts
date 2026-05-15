import clientPromise from '@/lib/mongodb'
import { NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { getJwtSecret } from '@/lib/jwt-secret'
import { isFounderRole } from '@/lib/roles'
import { createAuditLog } from '@/lib/audit-log'
const JWT_SECRET = new TextEncoder().encode(getJwtSecret())

export async function POST(request: Request) {
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
        { success: false, error: 'Only founder can change roles' },
        { status: 403 }
      )
    }

    const { email, role } = await request.json()

    if (!email || !role) {
      return NextResponse.json(
        { success: false, error: 'Email and role required' },
        { status: 400 }
      )
    }

    const validRoles = ['student', 'moderator', 'founder']

    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { success: false, error: 'Invalid role' },
        { status: 400 }
      )
    }

    const client = await clientPromise
    const db = client.db(process.env.DB_NAME || 'student_services')

    const result = await db.collection('users').updateOne(
      { email: email.toLowerCase().trim() },
      { $set: { role, updatedAt: new Date() } }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }
await createAuditLog({
  action: 'USER_ROLE_CHANGED',
  actor: {
    id: typeof payload.userId === 'string' ? payload.userId : null,
    email: typeof payload.email === 'string' ? payload.email : null,
    name: typeof payload.name === 'string' ? payload.name : null,
    role: currentUserRole,
  },
  targetType: 'user',
  targetId: email.toLowerCase().trim(),
  message: `${email} role changed to ${role}`,
  metadata: {
    email: email.toLowerCase().trim(),
    newRole: role,
  },
})
    return NextResponse.json({
      success: true,
      message: `${email} is now a ${role}`,
    })
  } catch (error) {
    console.error('Set role error:', error)

    return NextResponse.json(
      { success: false, error: 'Failed to set role' },
      { status: 500 }
    )
  }
}