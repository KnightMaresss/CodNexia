import clientPromise from '@/lib/mongodb'
import { NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { cookies } from 'next/headers'
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
    const role = typeof payload.role === 'string' ? payload.role : null

    if (!isFounderRole(role)) {
      return NextResponse.json(
        { success: false, error: 'Only founder can view audit logs' },
        { status: 403 }
      )
    }

    const client = await clientPromise
    const db = client.db(process.env.DB_NAME || 'student_services')
const { searchParams } = new URL(request.url)

const page = Math.max(Number(searchParams.get('page') || 1), 1)
const limit = Math.min(
  Math.max(Number(searchParams.get('limit') || 20), 1),
  100
)
const skip = (page - 1) * limit


const total = await db.collection('audit_logs').countDocuments()

const logs = await db
  .collection('audit_logs')
  .find({})
  .sort({ createdAt: -1 })
  .skip(skip)
  .limit(limit)
  .toArray()

return NextResponse.json({
  success: true,
  pagination: {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
    hasNextPage: page * limit < total,
    hasPreviousPage: page > 1,
  },
  logs: logs.map((log) => ({

        id: log._id.toString(),
        action: log.action,
        actor: log.actor,
        targetType: log.targetType,
        targetId: log.targetId,
        message: log.message,
        metadata: log.metadata || {},
        createdAt: log.createdAt,
      })),
    })
  } catch (error) {
    console.error('Audit logs fetch error:', error)

    return NextResponse.json(
      { success: false, error: 'Failed to fetch audit logs' },
      { status: 500 }
    )
  }
}