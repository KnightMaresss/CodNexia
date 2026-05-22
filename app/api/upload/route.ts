import { NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { ObjectId } from 'mongodb'
import clientPromise from '@/lib/mongodb'
import cloudinary from '@/lib/cloudinary'
import { getJwtSecret } from '@/lib/jwt-secret'
import { canAccessAdmin } from '@/lib/roles'
import { createNotification } from '@/lib/notifications'
const JWT_SECRET = new TextEncoder().encode(getJwtSecret())

export async function POST(request: Request) {
  try {
    // Auth check - admin or student
    const cookieStore = await cookies()
    const adminToken = cookieStore.get('admin_token')?.value
    const studentToken = cookieStore.get('student_token')?.value

let authenticated = false
let uploaderRole: 'admin' | 'student' | null = null
let uploaderId = ''
let uploaderEmail = ''

if (adminToken) {
  try {
    const { payload } = await jwtVerify(adminToken, JWT_SECRET)
    const role = typeof payload.role === 'string' ? payload.role : null

    if (canAccessAdmin(role)) {
      authenticated = true
      uploaderRole = 'admin'
      uploaderId = typeof payload.userId === 'string' ? payload.userId : ''
      uploaderEmail = typeof payload.email === 'string' ? payload.email : ''
    }
  } catch {}
}

if (!authenticated && studentToken) {
  try {
    const { payload } = await jwtVerify(studentToken, JWT_SECRET)

    if (payload.role === 'student') {
      authenticated = true
      uploaderRole = 'student'
      uploaderId = typeof payload.userId === 'string' ? payload.userId : ''
      uploaderEmail = typeof payload.email === 'string' ? payload.email : ''
    }
  } catch {}
}

if (!authenticated || !uploaderRole) {
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
   const client = await clientPromise
   const db = client.db(process.env.DB_NAME || 'student_services')
if (!ObjectId.isValid(orderId)) {
  return NextResponse.json(
    { success: false, error: 'Invalid order ID' },
    { status: 400 }
  )
}

const order = await db.collection('orders').findOne({
  _id: new ObjectId(orderId),
})

if (!order) {
  return NextResponse.json(
    { success: false, error: 'Order not found' },
    { status: 404 }
  )
}

if (uploaderRole === 'student' && order.studentEmail !== uploaderEmail) {
  return NextResponse.json(
    { success: false, error: 'Access denied' },
    { status: 403 }
  )
}

if (uploaderRole === 'admin' && order.assignedTo && order.assignedTo !== uploaderId) {
  return NextResponse.json(
    { success: false, error: 'You can only upload files to orders assigned to you' },
    { status: 403 }
  )
}
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

try {
  if (uploaderRole === 'student' && order.assignedTo) {
    await createNotification({
      userId: order.assignedTo.toString(),
      type: 'files_uploaded',
      title: 'Files uploaded',
      message: `A client uploaded a file: ${file.name}`,
      link: '/admin',
      orderId,
    })
  }

  if (uploaderRole === 'admin') {
    const studentUser = await db.collection('users').findOne({
      email: order.studentEmail,
    })

    if (studentUser?._id) {
      await createNotification({
        userId: studentUser._id.toString(),
        type: 'files_uploaded',
        title: 'Files uploaded',
        message: `A file was uploaded to your order: ${file.name}`,
        link: '/my-orders',
        orderId,
      })
    }
  }
} catch (notificationError) {
  console.error('FILE_UPLOAD_NOTIFICATION_ERROR:', notificationError)
}

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