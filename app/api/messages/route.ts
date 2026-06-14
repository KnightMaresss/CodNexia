import clientPromise from '@/lib/mongodb'
import { NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { ObjectId } from 'mongodb'
import { getJwtSecret } from '@/lib/jwt-secret'
import { canAccessAdmin, isModeratorRole } from '@/lib/roles'
import { notifyMessageSent } from '@/lib/orders-stream'
import {
  createManyNotifications,
  createOrUpdateChatNotification,
} from '@/lib/notifications'
const JWT_SECRET = new TextEncoder().encode(getJwtSecret())
const MESSAGE_EDIT_DELETE_LIMIT_MS = 10 * 60 * 1000

function isMessageLocked(createdAt: Date | string) {
  return Date.now() - new Date(createdAt).getTime() > MESSAGE_EDIT_DELETE_LIMIT_MS
}
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

     const studentView = await db.collection('chat_views').findOne({
  orderId,
  viewer: 'student',
})
const adminView = await db.collection('chat_views').findOne({
  orderId,
  viewer: 'admin',
})



    return NextResponse.json({
      success: true,
        messages: messages.map((m) => ({
        id: m._id.toString(),
        orderId: m.orderId,
        sender: m.sender,
        senderRole: m.senderRole,
        message: m.isDeleted ? '' : m.message || '',
        fileUrl: m.isDeleted ? '' : m.fileUrl || '',
        fileName: m.isDeleted ? '' : m.fileName || '',
        fileType: m.isDeleted ? '' : m.fileType || '',
        createdAt: m.createdAt,
        editedAt: m.editedAt || '',
        isDeleted: Boolean(m.isDeleted),
        deletedAt: m.deletedAt || '',
        deletedBy: m.deletedBy || '',
        deletedByRole: m.deletedByRole || '',
        replyToMessageId: m.replyToMessageId || '',
        replyToMessage: m.replyToMessage
  ? {
      ...m.replyToMessage,
      message: m.replyToMessage.isDeleted
        ? ''
        : m.replyToMessage.message || '',
      fileName: m.replyToMessage.isDeleted
        ? ''
        : m.replyToMessage.fileName || '',
      fileType: m.replyToMessage.isDeleted
        ? ''
        : m.replyToMessage.fileType || '',
      isDeleted: Boolean(m.replyToMessage.isDeleted),
    }
  : null,
        status:
  m.senderRole === 'student'
    ? adminView?.lastSeenAt && new Date(adminView.lastSeenAt) >= new Date(m.createdAt)
      ? 'seen'
      : 'delivered'
    : studentView?.lastSeenAt && new Date(studentView.lastSeenAt) >= new Date(m.createdAt)
      ? 'seen'
      : 'delivered',
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
    let replyToMessageId = ''

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData()

      orderId = String(formData.get('orderId') || '')
      message = String(formData.get('message') || '')
      replyToMessageId = String(formData.get('replyToMessageId') || '')

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
      replyToMessageId = body.replyToMessageId || ''
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
let replyToMessage = null

if (replyToMessageId && ObjectId.isValid(replyToMessageId)) {
  const originalMessage = await db.collection('messages').findOne({
    _id: new ObjectId(replyToMessageId),
    orderId,
  })

  if (originalMessage) {
      replyToMessage = {
      id: originalMessage._id.toString(),
      sender: originalMessage.sender,
      senderRole: originalMessage.senderRole,
      message: originalMessage.message || '',
      fileName: originalMessage.fileName || '',
      fileType: originalMessage.fileType || '',
    }
  }
}
    const newMessage = {
      orderId,
      sender,
      senderRole,
      message: message?.trim() || '',
      fileUrl,
      fileName,
      fileType,
      createdAt: new Date(),
      replyToMessageId,
      replyToMessage,
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
    try {
    const notificationMessage = fileUrl
      ? `${sender} sent a file: ${fileName}`
      : `${sender} sent a new message.`

    if (senderRole === 'student') {
    const notificationLink = `/admin?chat=${orderId}`

      if (order.assignedTo && ObjectId.isValid(order.assignedTo)) {
        await createOrUpdateChatNotification({
          userId: order.assignedTo.toString(),
          orderId,
          link: notificationLink,
          relatedMessageId: result.insertedId.toString(),
          title: 'New message received',
          message: notificationMessage,
        })
      } else {
        const admins = await db
          .collection('users')
          .find({
            role: { $in: ['founder', 'moderator'] },
          })
          .project({ _id: 1 })
          .toArray()

        await createManyNotifications({
          userIds: admins.map((admin) => admin._id.toString()),
          type: 'new_message',
          title: 'New message received',
          message: notificationMessage,
          link: notificationLink,
          orderId,
          relatedMessageId: result.insertedId.toString(),
        })
      }
    }

    if (senderRole === 'admin') {
      const studentUser = await db.collection('users').findOne({
        email: order.studentEmail,
      })

      if (studentUser?._id) {
        await createOrUpdateChatNotification({
          userId: studentUser._id.toString(),
          orderId,
          link: `/my-orders?chat=${orderId}`,
          relatedMessageId: result.insertedId.toString(),
          title: 'New message from moderator',
          message: fileUrl
            ? 'A moderator sent you a file.'
            : 'A moderator replied to your order.',
        })
      }
    }
  } catch (notificationError) {
    console.error('CHAT_NOTIFICATION_ERROR:', notificationError)
  }
  const SERVICE_NAMES: Record<string, string> = {
    'graduation-projects': 'Graduation Projects',
    'academic-reports': 'Academic Reports',
    'custom-websites': 'Custom Apps / Websites',
    'mobile-apps': 'Mobile Apps',
    'logo-design': 'Brand Identity & Logo Design',
    'cv-resume-writing': 'CV/Resume Writing',
    'translation': 'Translation (En↔Ar)',
    'code-debugging': 'Code Debugging',
    'ai-automation': 'AI Automation',
    'ui-ux-design': 'UI/UX Design',
  }

  const notifyMsg = fileUrl
    ? `📎 Sent a file: ${fileName}`
    : message.trim()

  let recipientEmail = ''
  const recipientRole = senderRole === 'student' ? 'admin' : 'student'

  if (senderRole === 'student') {
    recipientEmail = process.env.ADMIN_EMAIL || ''

    if (order.assignedTo && ObjectId.isValid(order.assignedTo)) {
      const assignedStaff = await db.collection('users').findOne({
        _id: new ObjectId(order.assignedTo),
      })

      if (assignedStaff?.email) {
        recipientEmail = assignedStaff.email
      }
    }
  } else {
    recipientEmail = order.studentEmail
  }

  if (recipientEmail) {
    const chatView = await db.collection('chat_views').findOne({
      orderId,
      viewer: recipientRole,
    })
 const lastSeenAt = chatView?.lastSeenAt || new Date(0)
const existingNotification = await db
  .collection('chat_email_notifications')
  .findOne({
    orderId,
    recipientRole,
    createdAt: { $gt: lastSeenAt },
  })
  if (!existingNotification) {
      await db.collection('chat_email_notifications').updateOne(
        {
          orderId,
          recipientRole,
          status: 'pending',
        },
        {
          $set: {
            orderId,
            recipientRole,
            recipientEmail,
            senderName: sender,
            senderRole,
            message: notifyMsg,
            serviceName: SERVICE_NAMES[order.service] || order.service,
            sendAfter: new Date(Date.now() + 60 * 1000),
            updatedAt: new Date(),
          },
          $setOnInsert: {
            createdAt: new Date(),
            status: 'pending',
          },
        },
        { upsert: true }
      )
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
// PATCH - Edit a message text
export async function PATCH(request: Request) {
  try {
    const { messageId, message } = await request.json()

    if (!messageId || !message?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Message ID and message required' },
        { status: 400 }
      )
    }

    if (!ObjectId.isValid(messageId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid message ID' },
        { status: 400 }
      )
    }

    const cookieStore = await cookies()
    const adminToken = cookieStore.get('admin_token')?.value
    const studentToken = cookieStore.get('student_token')?.value
    const token = adminToken || studentToken

    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { payload } = await jwtVerify(token, JWT_SECRET)
    const role = getRole(payload)

    const senderRole = role === 'student' ? 'student' : canAccessAdmin(role) ? 'admin' : null

    if (!senderRole) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const client = await clientPromise
    const db = client.db(process.env.DB_NAME || 'student_services')

    const existingMessage = await db.collection('messages').findOne({
      _id: new ObjectId(messageId),
    })

    if (!existingMessage || existingMessage.senderRole !== senderRole) {
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 })
    }
if (existingMessage.isDeleted) {
  return NextResponse.json(
    { success: false, error: 'Deleted messages cannot be edited' },
    { status: 400 }
  )
}

if (isMessageLocked(existingMessage.createdAt)) {
  return NextResponse.json(
    { success: false, error: 'Messages can only be edited within 10 minutes' },
    { status: 403 }
  )
}
    await db.collection('messages').updateOne(
      { _id: new ObjectId(messageId) },
      {
        $set: {
          message: message.trim(),
          editedAt: new Date(),
        },
      }
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Edit message error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to edit message' },
      { status: 500 }
    )
  }
}

// DELETE - Delete a message
export async function DELETE(request: Request) {
  try {
    const { messageId } = await request.json()

    if (!messageId || !ObjectId.isValid(messageId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid message ID' },
        { status: 400 }
      )
    }

    const cookieStore = await cookies()
    const adminToken = cookieStore.get('admin_token')?.value
    const studentToken = cookieStore.get('student_token')?.value
    const token = adminToken || studentToken

    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { payload } = await jwtVerify(token, JWT_SECRET)
    const role = getRole(payload)

    const senderRole = role === 'student' ? 'student' : canAccessAdmin(role) ? 'admin' : null

    if (!senderRole) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const client = await clientPromise
    const db = client.db(process.env.DB_NAME || 'student_services')

    const existingMessage = await db.collection('messages').findOne({
      _id: new ObjectId(messageId),
    })

    if (!existingMessage || existingMessage.senderRole !== senderRole) {
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 })
    }

if (existingMessage.isDeleted) {
  return NextResponse.json({ success: true })
}

if (isMessageLocked(existingMessage.createdAt)) {
  return NextResponse.json(
    { success: false, error: 'Messages can only be deleted within 10 minutes' },
    { status: 403 }
  )
}

await db.collection('messages').updateOne(
  { _id: new ObjectId(messageId) },

  {
   $set: {
  isDeleted: true,
  deletedAt: new Date(),
  deletedBy: getName(payload),
  deletedByRole: senderRole,
},
  }
)
await db.collection('messages').updateMany(
  { replyToMessageId: messageId },
  {
    $set: {
      'replyToMessage.isDeleted': true,
      'replyToMessage.message': '',
      'replyToMessage.fileName': '',
      'replyToMessage.fileType': '',
    },
  }
)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete message error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete message' },
      { status: 500 }
    )
  }
}