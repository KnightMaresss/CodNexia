import clientPromise from '@/lib/mongodb'
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { headers } from 'next/headers'
import { rateLimit } from '@/lib/rate-limit'
import { verifyTurnstileToken } from '@/lib/turnstile'
import {
  createEmailVerificationToken,
  getEmailVerificationExpiry,
} from '@/lib/email-verification'
import { sendEmailVerificationEmail } from '@/lib/email'

export async function POST(request: Request) {
  try {
    const headersList = await headers()
    const ip =
      headersList.get('x-forwarded-for') ||
      headersList.get('x-real-ip') ||
      'unknown'

    const { allowed } = rateLimit(`register:${ip}`, 5, 15 * 60_000)

    if (!allowed) {
      return NextResponse.json(
        {
          success: false,
          error: 'Too many registration attempts. Please try again later.',
        },
        { status: 429 }
      )
    }

const { name, email, password, turnstileToken } = await request.json()

const cleanIp = ip.split(',')[0]?.trim() || 'unknown'

const turnstile = await verifyTurnstileToken(turnstileToken, cleanIp)

if (!turnstile.success) {
  return NextResponse.json(
    { success: false, error: 'Human verification failed. Please try again.' },
    { status: 403 }
  )
}

    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, error: 'All fields are required' },
        { status: 400 }
      )
    }

    if (name.trim().length < 2 || name.trim().length > 80) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid name' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 6 characters' },
        { status: 400 }
      )
    }

    const normalizedEmail = email.toLowerCase().trim()

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/

    if (!emailRegex.test(normalizedEmail) || normalizedEmail.length > 254) {
      return NextResponse.json(
        { success: false, error: 'Please provide a valid email' },
        { status: 400 }
      )
    }

    const client = await clientPromise
    const db = client.db(process.env.DB_NAME || 'student_services')

    const existingUser = await db.collection('users').findOne({
      email: normalizedEmail,
    })

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'An account with this email already exists' },
        { status: 409 }
      )
    }

    const hashedPassword = await bcrypt.hash(password, 12)
    const { token, tokenHash } = createEmailVerificationToken()
    const expiresAt = getEmailVerificationExpiry()
    const now = new Date()

    const user = {
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: 'student',
      profilePic: '',
      blocked: false,
      emailVerified: false,
      emailVerifiedAt: null,
      emailVerificationTokenHash: tokenHash,
      emailVerificationExpires: expiresAt,
      verificationEmailLastSentAt: now,
      verificationEmailSendCount: 1,
      verificationEmailWindowStart: now,
      createdAt: now,
      updatedAt: now,
    }

    const result = await db.collection('users').insertOne(user)

    const emailSent = await sendEmailVerificationEmail(
      normalizedEmail,
      name.trim(),
      token
    )

    return NextResponse.json({
      success: true,
      userId: result.insertedId.toString(),
      emailSent,
      message: emailSent
        ? 'Account created. Please check your email to verify your account.'
        : 'Account created, but verification email could not be sent. Please request a new verification email.',
    })
  } catch (error) {
    console.error('Registration error:', error)

    return NextResponse.json(
      { success: false, error: 'Registration failed' },
      { status: 500 }
    )
  }
}