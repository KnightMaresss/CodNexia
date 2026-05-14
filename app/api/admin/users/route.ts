import clientPromise from '@/lib/mongodb'
import { NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth'

export async function GET() {
  try {
    const isAuthenticated = await verifyAuth()
    if (!isAuthenticated) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const client = await clientPromise
    const db = client.db(process.env.DB_NAME || 'student_services')

    const users = await db.collection('users')
      .find({}, { projection: { password: 0 } })
      .sort({ createdAt: -1 })
      .toArray()

    return NextResponse.json({ success: true, users })
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to fetch users' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const isAuthenticated = await verifyAuth()
    if (!isAuthenticated) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { userId, blocked } = await request.json()

    const client = await clientPromise
    const db = client.db(process.env.DB_NAME || 'student_services')
    const { ObjectId } = await import('mongodb')

    await db.collection('users').updateOne(
      { _id: new ObjectId(userId) },
      { $set: { blocked: !!blocked, updatedAt: new Date() } }
    )

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to update user' }, { status: 500 })
  }
}