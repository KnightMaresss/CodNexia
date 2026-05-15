import clientPromise from '@/lib/mongodb'
import { NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import bcrypt from 'bcryptjs'
import { getJwtSecret } from '@/lib/jwt-secret'
const JWT_SECRET = new TextEncoder().encode(getJwtSecret())

async function getStudentFromToken() {
  const cookieStore = await cookies()
  const token = cookieStore.get('student_token')?.value

  if (!token) return null

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    // Allow students, founders, and moderators
    const allowedRoles = ['student', 'founder', 'moderator']
    if (!allowedRoles.includes(payload.role as string)) return null
    return payload
  } catch {
    return null
  }
}

export async function GET() {
  try {
    const student = await getStudentFromToken()
    if (!student) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const client = await clientPromise
    const db = client.db(process.env.DB_NAME || 'student_services')
    const { ObjectId } = await import('mongodb')

    const user = await db.collection('users').findOne(
      { _id: new ObjectId(student.userId as string) },
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
        createdAt: user.createdAt,
      },
    })
  } catch (error) {
    console.error('Profile fetch error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch profile' },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const student = await getStudentFromToken()
    if (!student) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { name, email, currentPassword, newPassword } = await request.json()

    const client = await clientPromise
    const db = client.db(process.env.DB_NAME || 'student_services')
    const { ObjectId } = await import('mongodb')

    const userId = new ObjectId(student.userId as string)
    const user = await db.collection('users').findOne({ _id: userId })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    const updates: Record<string, unknown> = {
      updatedAt: new Date(),
    }

    // Update name
    if (name && name.trim()) {
      updates.name = name.trim()
    }

    // Update email
    if (email && email.trim()) {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { success: false, error: 'Invalid email format' },
          { status: 400 }
        )
      }

      const existingUser = await db.collection('users').findOne({
        email: email.toLowerCase().trim(),
        _id: { $ne: userId },
      })

      if (existingUser) {
        return NextResponse.json(
          { success: false, error: 'Email already in use' },
          { status: 409 }
        )
      }

      updates.email = email.toLowerCase().trim()
    }

    // Update password
    if (currentPassword && newPassword) {
      const isPasswordValid = await bcrypt.compare(currentPassword, user.password)
      if (!isPasswordValid) {
        return NextResponse.json(
          { success: false, error: 'Current password is incorrect' },
          { status: 400 }
        )
      }

      if (newPassword.length < 6) {
        return NextResponse.json(
          { success: false, error: 'New password must be at least 6 characters' },
          { status: 400 }
        )
      }

      updates.password = await bcrypt.hash(newPassword, 12)
    }

    await db.collection('users').updateOne(
      { _id: userId },
      { $set: updates }
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Profile update error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update profile' },
      { status: 500 }
    )
  }
}