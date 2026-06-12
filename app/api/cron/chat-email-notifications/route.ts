import clientPromise from '@/lib/mongodb'
import { NextResponse } from 'next/server'
import { sendNewMessageEmail } from '@/lib/email-messages'

export async function GET(request: Request) {
const authHeader = request.headers.get('authorization')
const { searchParams } = new URL(request.url)
const secret = searchParams.get('secret')

const isAuthorized =
  authHeader === `Bearer ${process.env.CRON_SECRET}` ||
  secret === process.env.CRON_SECRET

if (!isAuthorized) {
  return NextResponse.json(
    { success: false, error: 'Unauthorized' },
    { status: 401 }
  )
}

  const client = await clientPromise
  const db = client.db(process.env.DB_NAME || 'student_services')
  const results: Array<Record<string, unknown>> = []
  const now = new Date()

  const pending = await db
  
    .collection('chat_email_notifications')
    .find({
      status: 'pending',
      sendAfter: { $lte: now },
    })
    .limit(50)
    .toArray()
  for (const item of pending) {
    const chatView = await db.collection('chat_views').findOne({
      orderId: item.orderId,
      viewer: item.recipientRole,
    })

    const lastSeenAt = chatView?.lastSeenAt || new Date(0)

    const unreadCount = await db.collection('messages').countDocuments({
      orderId: item.orderId,
      senderRole: item.senderRole,
      createdAt: { $gt: lastSeenAt },
    })
    if (unreadCount <= 0) {
      await db.collection('chat_email_notifications').updateOne(
        { _id: item._id },
        { $set: { status: 'cancelled', updatedAt: new Date() } }
      )
results.push({
  orderId: item.orderId,
  action: 'cancelled',
  reason: 'already_read',
  recipientEmail: item.recipientEmail,
  unreadCount,
})
      continue
    }

    await sendNewMessageEmail(
      item.recipientEmail,
      item.senderName,
      item.senderRole,
      item.message,
      item.orderId,
      item.serviceName
    )

    await db.collection('chat_email_notifications').updateOne(
      { _id: item._id },
      {
        $set: {
          status: 'sent',
          sentAt: new Date(),
          unreadCount,
          updatedAt: new Date(),
        },
      }
    )
    results.push({
  orderId: item.orderId,
  action: 'sent',
  recipientEmail: item.recipientEmail,
  unreadCount,
})
  }

return NextResponse.json({
  success: true,
  processed: pending.length,
  results,
})
}