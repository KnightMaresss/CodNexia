import { NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import clientPromise from '@/lib/mongodb'
import cloudinary from '@/lib/cloudinary'

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret')

export async function DELETE(request: Request) {
  try {
    const cookieStore = await cookies()
    const studentToken = cookieStore.get('student_token')?.value

    if (!studentToken) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { payload } = await jwtVerify(studentToken, JWT_SECRET)
    if (payload.role !== 'student') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { publicId } = await request.json()

    if (!publicId) {
      return NextResponse.json(
        { success: false, error: 'File ID is required' },
        { status: 400 }
      )
    }

    // Delete from Cloudinary
    await cloudinary.uploader.destroy(publicId)

    // Delete from MongoDB
    const client = await clientPromise
    const db = client.db(process.env.DB_NAME || 'student_services')

    await db.collection('order_files').deleteOne({ cloudinaryPublicId: publicId })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete file error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete file' },
      { status: 500 }
    )
  }
}