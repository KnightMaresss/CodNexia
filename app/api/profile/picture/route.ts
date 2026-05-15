import { NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { getJwtSecret } from '@/lib/jwt-secret'
import cloudinary from '@/lib/cloudinary'

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

    const allowedRoles = ['student', 'founder', 'moderator']

    if (!allowedRoles.includes(payload.role as string)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const formData = await request.formData()

    const file = formData.get('profilePic') as File

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file uploaded' },
        { status: 400 }
      )
    }

    const validTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
    ]

    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid file type. Use JPG, PNG, WebP, or GIF',
        },
        { status: 400 }
      )
    }

    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json(
        {
          success: false,
          error: 'File too large. Max 2MB',
        },
        { status: 400 }
      )
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const base64 = `data:${file.type};base64,${buffer.toString('base64')}`

    const result = await cloudinary.uploader.upload(base64, {
      folder: 'profiles',
      public_id: `${payload.userId}-${Date.now()}`,
      resource_type: 'image',
    })

    const profilePicUrl = result.secure_url

    const client = (await import('@/lib/mongodb')).default

    const db = (await client).db(
      process.env.DB_NAME || 'student_services'
    )

    const { ObjectId } = await import('mongodb')

    await db.collection('users').updateOne(
      {
        _id: new ObjectId(payload.userId as string),
      },
      {
        $set: {
          profilePic: profilePicUrl,
          updatedAt: new Date(),
        },
      }
    )

    return NextResponse.json({
      success: true,
      profilePic: profilePicUrl,
    })
  } catch (error) {
    console.error('Profile picture upload error:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Upload failed',
      },
      { status: 500 }
    )
  }
}