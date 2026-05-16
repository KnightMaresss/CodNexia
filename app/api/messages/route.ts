import clientPromise from '@/lib/mongodb'
import { NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { ObjectId } from 'mongodb'
import { getJwtSecret } from '@/lib/jwt-secret'
import { canAccessAdmin, isModeratorRole } from '@/lib/roles'
import { notifyMessageSent } from '@/lib/orders-stream'

const JWT_SECRET = new TextEncoder().encode(getJwtSecret())

function getRole(payload: Record<string, unknown>) {
  return typeof payload.role === 'string' ? payload.role : null
}

function getUserId(payload: Record<string, unknown>) {
  return typeof payload.userId === 'string' ? payload.userId : null
}

function getName(payload: Record<string, unknown>) {
  if (typeof payload.name === 'string') return payload.name
  if (typeof payload.email === 'string') return payload.email
  return 'Unknown'
}

// GET messages for an order
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get('orderId')

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: 'Order ID required' },
        { status: 400 }
      )
    }

    if (!ObjectId.isValid(orderId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid order ID' },
        { status: 400 }
      )
    }

    const cookieStore = await cookies()
    const adminToken = cookieStore.get('admin_token')?.value
    const studentToken = cookieStore.get('student_token')?.value
    const token = adminToken || studentToken

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { payload } = await jwtVerify(token, JWT_SECRET)

    const userRole = getRole(payload)
    const userId = getUserId(payload)

    const isStudent = userRole === 'student'
    const isAdmin = canAccessAdmin(userRole)

    if (!isStudent && !isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const client = await clientPromise
    const db = client.db(process.env.DB_NAME || 'student_services')

    if (isModeratorRole(userRole)) {
      const order = await db.collection('orders').findOne({
        _id: new ObjectId(orderId),
      })

      if (!order || order.assignedTo !== userId) {
        return NextResponse.json(
          { success: false, error: 'Access denied' },
          { status: 403 }
        )
      }
    }

    const messages = await db
      .collection('messages')
      .find({ orderId })
      .sort({ createdAt: 1 })
      .toArray()

    return NextResponse.json({
      success: true,
      messages: messages.map((m) => ({
        id: m._id.toString(),
        orderId: m.orderId,
        sender: m.sender,
        senderRole: m.senderRole,
        message: m.message || '',
        fileUrl: m.fileUrl || '',
        fileName: m.fileName || '',
        fileType: m.fileType || '',
        createdAt: m.createdAt,
      })),
    })
  } catch (error) {
    console.error('Fetch messages error:', error)

    return NextResponse.json(
      { success: false, error: 'Failed to fetch messages' },
      { status: 500 }
    )
  }
}

// PUT - Mark chat as seen
export async function PUT(request: Request) {
  try {
    const { orderId } = await request.json()

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: 'Order ID required' },
        { status: 400 }
      )
    }

    const cookieStore = await cookies()
    const adminToken = cookieStore.get('admin_token')?.value
    const studentToken = cookieStore.get('student_token')?.value

    let viewer = ''

    if (studentToken) {
      try {
        const { payload } = await jwtVerify(studentToken, JWT_SECRET)
        const role = getRole(payload)

        if (role === 'student') viewer = 'student'
        else if (canAccessAdmin(role)) viewer = 'admin'
      } catch {}
    }

    if (!viewer && adminToken) {
      try {
        const { payload } = await jwtVerify(adminToken, JWT_SECRET)
        const role = getRole(payload)

        if (canAccessAdmin(role)) viewer = 'admin'
      } catch {}
    }

    if (!viewer) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const client = await clientPromise
    const db = client.db(process.env.DB_NAME || 'student_services')

    await db.collection('chat_views').updateOne(
      { orderId, viewer },
      { $set: { orderId, viewer, lastSeenAt: new Date() } },
      { upsert: true }
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Mark chat seen error:', error)

    return NextResponse.json(
      { success: false, error: 'Failed' },
      { status: 500 }
    )
  }
}

// POST a new message with optional file
export async function POST(request: Request) {
  try {
    const contentType = request.headers.get('content-type') || ''

    let orderId = ''
    let message = ''
    let fileUrl = ''
    let fileName = ''
    let fileType = ''

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData()

      orderId = String(formData.get('orderId') || '')
      message = String(formData.get('message') || '')

      const file = formData.get('file') as File | null

      if (file) {
        const cloudinary = (await import('@/lib/cloudinary')).default
        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)
        const base64 = `data:${file.type};base64,${buffer.toString('base64')}`

        const result = await cloudinary.uploader.upload(base64, {
          folder: `chat/${orderId}`,
          resource_type: 'auto',
        })

        fileUrl = result.secure_url
        fileName = file.name
        fileType = file.type
      }
    } else {
      const body = await request.json()

      orderId = body.orderId
      message = body.message || ''
    }

    if (!orderId || (!message.trim() && !fileUrl)) {
      return NextResponse.json(
        { success: false, error: 'Order ID and message or file required' },
        { status: 400 }
      )
    }

    if (!ObjectId.isValid(orderId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid order ID' },
        { status: 400 }
      )
    }

    const cookieStore = await cookies()
    const adminToken = cookieStore.get('admin_token')?.value
    const studentToken = cookieStore.get('student_token')?.value

    let sender = 'Unknown'
    let senderRole = 'unknown'

    if (adminToken) {
      try {
        const { payload } = await jwtVerify(adminToken, JWT_SECRET)
        const role = getRole(payload)

        if (canAccessAdmin(role)) {
          sender = getName(payload)
          senderRole = 'admin'
        }
      } catch {}
    }

    if (senderRole === 'unknown' && studentToken) {
      try {
        const { payload } = await jwtVerify(studentToken, JWT_SECRET)
        const role = getRole(payload)

        if (role === 'student') {
          sender =
            typeof payload.email === 'string' ? payload.email : 'Student'
          senderRole = 'student'
        } else if (canAccessAdmin(role)) {
          sender = getName(payload)
          senderRole = 'admin'
        }
      } catch {}
    }

    if (senderRole === 'unknown') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const client = await clientPromise
    const db = client.db(process.env.DB_NAME || 'student_services')

    const newMessage = {
      orderId,
      sender,
      senderRole,
      message: message?.trim() || '',
      fileUrl,
      fileName,
      fileType,
      createdAt: new Date(),
    }

    const result = await db.collection('messages').insertOne(newMessage)
    const insertedMessage = {
       id: result.insertedId.toString(),
       ...newMessage,
      }

     notifyMessageSent({
     orderId,
     message: insertedMessage,
     senderRole,
     sender,
     })
    await db.collection('chat_views').updateOne(
      { orderId, viewer: senderRole },
      { $set: { orderId, viewer: senderRole, lastSeenAt: new Date() } },
      { upsert: true }
    )

    const order = await db.collection('orders').findOne({
      _id: new ObjectId(orderId),
    })

    if (order) {
      const SERVICE_NAMES: Record<string, string> = {
        'graduation-projects': 'Graduation Projects',
        'academic-reports': 'Academic Reports',
        'custom-websites': 'Custom Websites',
        'mobile-apps': 'Mobile Apps',
        'powerpoint-presentations': 'PowerPoint Presentations',
        'cv-resume-writing': 'CV/Resume Writing',
        translation: 'Translation (En↔Ar)',
        'code-debugging': 'Code Debugging',
      }

      const recipientRole = senderRole === 'student' ? 'admin' : 'student'

      const chatView = await db.collection('chat_views').findOne({
        orderId,
        viewer: recipientRole,
      })

      const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000)
    if (!chatView || new Date(chatView.lastSeenAt) < twoMinutesAgo) {

        const { sendNewMessageEmail } = await import('@/lib/email-messages')
        const notifyMsg = fileUrl
          ? `📎 Sent a file: ${fileName}`
          : message.trim()


if (senderRole === 'student') {
  let staffEmail = process.env.ADMIN_EMAIL || ''

  if (order.assignedTo && ObjectId.isValid(order.assignedTo)) {
    const assignedStaff = await db.collection('users').findOne({
      _id: new ObjectId(order.assignedTo),
    })

    if (assignedStaff?.email) {
      staffEmail = assignedStaff.email
    }
  }

  if (staffEmail) {
    sendNewMessageEmail(
      staffEmail,
      sender,
      senderRole,
      notifyMsg,
      orderId,
      SERVICE_NAMES[order.service] || order.service
    ).catch(() => {})
  }
} else {
  sendNewMessageEmail(
    order.studentEmail,
    sender,
    senderRole,
    notifyMsg,
    orderId,
    SERVICE_NAMES[order.service] || order.service
  ).catch(() => {})
}
      }
    }

   return NextResponse.json({
  success: true,
  message: insertedMessage,
})
  } catch (error) {
    console.error('Send message error:', error)

    return NextResponse.json(
      { success: false, error: 'Failed to send message' },
      { status: 500 }
    )
  }
}