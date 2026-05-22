import clientPromise from '@/lib/mongodb'
import { NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { ObjectId } from 'mongodb'
import { getJwtSecret } from '@/lib/jwt-secret'
import { canAccessAdmin } from '@/lib/roles'

const JWT_SECRET = new TextEncoder().encode(getJwtSecret())

function getRole(payload: Record<string, unknown>) {
  return typeof payload.role === 'string' ? payload.role : null
}

async function getSenderRole() {
  const cookieStore = await cookies()
  const adminToken = cookieStore.get('admin_token')?.value
  const studentToken = cookieStore.get('student_token')?.value
  const token = adminToken || studentToken

  if (!token) return null

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    const role = getRole(payload)

    if (role === 'student') return 'student'
    if (canAccessAdmin(role)) return 'admin'

    return null
  } catch {
    return null
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get('orderId')

    if (!orderId || !ObjectId.isValid(orderId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid order ID' },
        { status: 400 }
      )
    }

    const viewerRole = await getSenderRole()

    if (!viewerRole) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const otherRole = viewerRole === 'student' ? 'admin' : 'student'

    const client = await clientPromise
    const db = client.db(process.env.DB_NAME || 'student_services')

    const typing = await db.collection('chat_typing').findOne({
      orderId,
      senderRole: otherRole,
      updatedAt: { $gt: new Date(Date.now() - 3000) },
    })

    return NextResponse.json({
      success: true,
      isTyping: Boolean(typing),
      senderRole: typing?.senderRole || '',
    })
  } catch (error) {
    console.error('Typing GET error:', error)

    return NextResponse.json(
      { success: false, error: 'Failed to fetch typing status' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const { orderId, isTyping } = await request.json()

    if (!orderId || !ObjectId.isValid(orderId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid order ID' },
        { status: 400 }
      )
    }

    const senderRole = await getSenderRole()

    if (!senderRole) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const client = await clientPromise
    const db = client.db(process.env.DB_NAME || 'student_services')

    if (isTyping) {
      await db.collection('chat_typing').updateOne(
        { orderId, senderRole },
        {
          $set: {
            orderId,
            senderRole,
            updatedAt: new Date(),
          },
        },
        { upsert: true }
      )
    } else {
      await db.collection('chat_typing').deleteOne({
        orderId,
        senderRole,
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Typing POST error:', error)

    return NextResponse.json(
      { success: false, error: 'Failed to update typing status' },
      { status: 500 }
    )
  }
}