import clientPromise from '@/lib/mongodb'
import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { rateLimit } from '@/lib/rate-limit'
import {
  createEmailVerificationToken,
  getEmailVerificationExpiry,
} from '@/lib/email-verification'
import { sendEmailVerificationEmail } from '@/lib/email'

const RESEND_COOLDOWN_MS = 60 * 1000
const RESEND_WINDOW_MS = 60 * 60 * 1000
const MAX_RESENDS_PER_WINDOW = 5

export async function POST(request: Request) {
  try {
    const headersList = await headers()
    const ip =
      headersList.get('x-forwarded-for') ||
      headersList.get('x-real-ip') ||
      'unknown'

    const { allowed } = rateLimit(`resend-verification:${ip}`, 10, 60 * 60_000)

    if (!allowed) {
      return NextResponse.json(
        {
          success: false,
          error: 'Too many resend attempts. Please try again later.',
        },
        { status: 429 }
      )
    }

    const { email } = await request.json()

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      )
    }

    const normalizedEmail = email.toLowerCase().trim()

    const client = await clientPromise
    const db = client.db(process.env.DB_NAME || 'student_services')

    const user = await db.collection('users').findOne({
      email: normalizedEmail,
    })

    if (!user) {
      return NextResponse.json({
        success: true,
        message:
          'If this email exists and is not verified, a verification email will be sent.',
      })
    }

    if (user.emailVerified) {
      return NextResponse.json(
        { success: false, error: 'This email is already verified.' },
        { status: 400 }
      )
    }

    const now = new Date()
    const lastSentAt = user.verificationEmailLastSentAt
      ? new Date(user.verificationEmailLastSentAt)
      : null

    if (lastSentAt && now.getTime() - lastSentAt.getTime() < RESEND_COOLDOWN_MS) {
      return NextResponse.json(
        {
          success: false,
          error: 'Please wait 60 seconds before requesting another email.',
        },
        { status: 429 }
      )
    }

    const windowStart = user.verificationEmailWindowStart
      ? new Date(user.verificationEmailWindowStart)
      : now

    const windowExpired =
      now.getTime() - windowStart.getTime() > RESEND_WINDOW_MS

    const currentCount = windowExpired
      ? 0
      : Number(user.verificationEmailSendCount || 0)

    if (currentCount >= MAX_RESENDS_PER_WINDOW) {
      return NextResponse.json(
        {
          success: false,
          error:
            'You have reached the hourly verification email limit. Please try again later.',
        },
        { status: 429 }
      )
    }

    const { token, tokenHash } = createEmailVerificationToken()

    await db.collection('users').updateOne(
      { _id: user._id },
      {
        $set: {
          emailVerificationTokenHash: tokenHash,
          emailVerificationExpires: getEmailVerificationExpiry(),
          verificationEmailLastSentAt: now,
          verificationEmailWindowStart: windowExpired ? now : windowStart,
          verificationEmailSendCount: currentCount + 1,
          updatedAt: now,
        },
      }
    )

    await sendEmailVerificationEmail(user.email, user.name || 'there', token)

    return NextResponse.json({
      success: true,
      message: 'Verification email sent. Please check your inbox.',
    })
  } catch (error) {
    console.error('Resend verification error:', error)

    return NextResponse.json(
      { success: false, error: 'Failed to resend verification email' },
      { status: 500 }
    )
  }
}