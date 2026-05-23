import clientPromise from '@/lib/mongodb'
import { NextResponse } from 'next/server'
import { hashEmailVerificationToken } from '@/lib/email-verification'

export async function POST(request: Request) {
  try {
    const { token } = await request.json()

    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Verification token is required' },
        { status: 400 }
      )
    }

    const tokenHash = hashEmailVerificationToken(token)

    const client = await clientPromise
    const db = client.db(process.env.DB_NAME || 'student_services')

    const user = await db.collection('users').findOne({
      emailVerificationTokenHash: tokenHash,
    })

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'This verification link is invalid or has expired.',
        },
        { status: 400 }
      )
    }

    if (user.emailVerified) {
      return NextResponse.json({
        success: true,
        message: 'Your email is already verified. You can log in now.',
      })
    }

    const expiresAt = user.emailVerificationExpires
      ? new Date(user.emailVerificationExpires)
      : null

    if (!expiresAt || expiresAt <= new Date()) {
      return NextResponse.json(
        {
          success: false,
          error: 'This verification link has expired. Please request a new verification email.',
        },
        { status: 400 }
      )
    }

    await db.collection('users').updateOne(
      { _id: user._id },
      {
        $set: {
          emailVerified: true,
          emailVerifiedAt: new Date(),
          updatedAt: new Date(),
        },
      }
    )

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully. You can now log in.',
    })
  } catch (error) {
    console.error('Verify email error:', error)

    return NextResponse.json(
      { success: false, error: 'Failed to verify email' },
      { status: 500 }
    )
  }
}