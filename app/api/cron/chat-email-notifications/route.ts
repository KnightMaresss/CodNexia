import clientPromise from '@/lib/mongodb'
import { NextResponse } from 'next/server'
import { sendNewMessageEmail } from '@/lib/email-messages'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const client = await clientPromise
  const db = client.db(process.env.DB_NAME || 'student_services')

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
  }

  return NextResponse.json({ success: true, processed: pending.length })
}