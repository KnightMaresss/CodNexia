import { NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import cloudinary from '@/lib/cloudinary'

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret')

export async function POST(request: Request) {
  try {
    // Auth check - admin or student
    const cookieStore = await cookies()
    const adminToken = cookieStore.get('admin_token')?.value
    const studentToken = cookieStore.get('student_token')?.value

    let authenticated = false

    if (adminToken) {
      try {
        const { payload } = await jwtVerify(adminToken, JWT_SECRET)
        if (payload.role === 'admin') {
          authenticated = true
        }
      } catch {}
    }

    if (!authenticated && studentToken) {
      try {
        const { payload } = await jwtVerify(studentToken, JWT_SECRET)
        if (payload.role === 'student') {
          authenticated = true
        }
      } catch {}
    }

    if (!authenticated) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const orderId = formData.get('orderId') as string

    if (!file || !orderId) {
      return NextResponse.json(
        { success: false, error: 'File and order ID are required' },
        { status: 400 }
      )
    }

    // Validate file type
    const validTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
      'image/webp',
      'application/zip',
      'application/x-zip-compressed',
    ]
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid file type. Allowed: PDF, DOCX, JPG, PNG, ZIP' },
        { status: 400 }
      )
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: 'File too large. Max 10MB' },
        { status: 400 }
      )
    }

    // Check file count for this order
    const client = (await import('@/lib/mongodb')).default
    const db = (await client).db(process.env.DB_NAME || 'student_services')

    const fileCount = await db.collection('order_files').countDocuments({ orderId })
    if (fileCount >= 5) {
      return NextResponse.json(
        { success: false, error: 'Maximum 5 files per order' },
        { status: 400 }
      )
    }

    // Convert to base64 for Cloudinary
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64 = `data:${file.type};base64,${buffer.toString('base64')}`

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(base64, {
      folder: `orders/${orderId}`,
      resource_type: 'auto',
    })

    // Save file info to MongoDB
    const fileDoc = {
      orderId,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      cloudinaryUrl: result.secure_url,
      cloudinaryPublicId: result.public_id,
      uploadedAt: new Date(),
    }

    await db.collection('order_files').insertOne(fileDoc)

    return NextResponse.json({
      success: true,
      file: {
        id: fileDoc.cloudinaryPublicId,
        name: fileDoc.fileName,
        size: fileDoc.fileSize,
        url: fileDoc.cloudinaryUrl,
      },
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { success: false, error: 'Upload failed' },
      { status: 500 }
    )
  }
}