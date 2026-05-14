import clientPromise from '@/lib/mongodb'
import { NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { ObjectId } from 'mongodb'

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret')

export async function POST() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('admin_token')?.value || cookieStore.get('student_token')?.value
    
    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { payload } = await jwtVerify(token, JWT_SECRET)
    
    const client = await clientPromise
    const db = client.db(process.env.DB_NAME || 'student_services')

    await db.collection('users').updateOne(
      { _id: new ObjectId(payload.userId as string) },
      { $set: { lastSeen: new Date() } }
    )

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 })
  }
}