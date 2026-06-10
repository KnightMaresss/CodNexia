import { NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import clientPromise from '@/lib/mongodb'
import { getCurrentUser } from '@/lib/auth'
import { createManyNotifications } from '@/lib/notifications'

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()

    if (!user?._id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { subject, description } = await request.json()

    const cleanSubject = String(subject || '').trim()
    const cleanDescription = String(description || '').trim()

    if (cleanSubject.length < 3) {
      return NextResponse.json(
        { success: false, error: 'Please enter a clear subject.' },
        { status: 400 }
      )
    }

    if (cleanDescription.length < 10) {
      return NextResponse.json(
        { success: false, error: 'Please describe the problem in more detail.' },
        { status: 400 }
      )
    }

    if (cleanSubject.length > 120 || cleanDescription.length > 2000) {
      return NextResponse.json(
        { success: false, error: 'Feedback is too long.' },
        { status: 400 }
      )
    }

    const client = await clientPromise
    const db = client.db(process.env.DB_NAME || 'student_services')

    const now = new Date()

    const feedbackResult = await db.collection('feedbacks').insertOne({
      userId: new ObjectId(user._id),
      userName: user.name || 'Unknown user',
      userEmail: user.email || '',
      subject: cleanSubject,
      description: cleanDescription,
      status: 'new',
      createdAt: now,
      updatedAt: now,
    })

    const founders = await db
      .collection('users')
      .find({ role: 'founder' }, { projection: { _id: 1 } })
      .toArray()

    await createManyNotifications({
      userIds: founders.map((founder) => founder._id.toString()),
      type: 'feedback_submitted',
      title: 'New feedback received',
      message: `${user.name || 'A user'} submitted feedback: ${cleanSubject}`,
      link: '/admin',
    })

    return NextResponse.json({
      success: true,
      feedbackId: feedbackResult.insertedId.toString(),
    })
  } catch (error) {
    console.error('FEEDBACK_POST_ERROR', error)

    return NextResponse.json(
      { success: false, error: 'Failed to submit feedback.' },
      { status: 500 }
    )
  }
}