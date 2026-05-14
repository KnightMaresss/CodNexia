import clientPromise from '@/lib/mongodb'
import { NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { cookies } from 'next/headers'

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret')

export async function GET() {
  try {
    // Only founder can view moderator stats
    const cookieStore = await cookies()
    const token = cookieStore.get('admin_token')?.value || cookieStore.get('student_token')?.value
    
    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { payload } = await jwtVerify(token, JWT_SECRET)
    if (payload.role !== 'founder') {
      return NextResponse.json({ success: false, error: 'Only founder can view stats' }, { status: 403 })
    }

    const client = await clientPromise
    const db = client.db(process.env.DB_NAME || 'student_services')

    // Get all moderators
    const moderators = await db.collection('users')
      .find({ role: 'moderator' }, { projection: { password: 0 } })
      .toArray()

    // Get stats for each moderator
    const moderatorStats = await Promise.all(
      moderators.map(async (mod) => {
        const userId = mod._id.toString()
        
        const totalAssigned = await db.collection('orders').countDocuments({ assignedTo: userId })
        const inProgress = await db.collection('orders').countDocuments({ assignedTo: userId, status: 'in-progress' })
        const completed = await db.collection('orders').countDocuments({ assignedTo: userId, status: 'completed' })
        const cancelled = await db.collection('orders').countDocuments({ assignedTo: userId, status: 'cancelled' })
        // Get average rating
        const ratings = await db.collection('ratings').find({ assignedTo: userId }).toArray()
        const avgRating = ratings.length > 0
         ? Math.round((ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length) * 10) / 10  : 0
return {
  _id: userId,
  name: mod.name,
  email: mod.email,
  profilePic: mod.profilePic || '',
  createdAt: mod.createdAt,
  lastSeen: mod.lastSeen,
  stats: {
    totalAssigned,
    inProgress,
    completed,
    cancelled,
    completionRate: totalAssigned > 0 ? Math.round((completed / totalAssigned) * 100) : 0,
    avgRating,  // ADD THIS
    totalRatings: ratings.length,  // ADD THIS
          }
        }
      })
    )

    // Sort by completed orders (most first)
    moderatorStats.sort((a, b) => b.stats.completed - a.stats.completed)

    return NextResponse.json({ success: true, moderators: moderatorStats })
  } catch (error) {
    console.error('Moderator stats error:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch stats' }, { status: 500 })
  }
}