import clientPromise from '@/lib/mongodb'
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json()

    // Validate
    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, error: 'All fields are required' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 6 characters' },
        { status: 400 }
      )
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Please provide a valid email' },
        { status: 400 }
      )
    }

    const client = await clientPromise
    const db = client.db(process.env.DB_NAME || 'student_services')

    // Check if user exists
    const existingUser = await db.collection('users').findOne({
      email: email.toLowerCase().trim(),
    })

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'An account with this email already exists' },
        { status: 409 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user
    const user = {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      profilePic: '',
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await db.collection('users').insertOne(user)

    return NextResponse.json({
      success: true,
      userId: result.insertedId.toString(),
    })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { success: false, error: 'Registration failed' },
      { status: 500 }
    )
  }
}