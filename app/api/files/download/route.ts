import { NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import clientPromise from '@/lib/mongodb'
import { getJwtSecret } from '@/lib/jwt-secret'
const JWT_SECRET = new TextEncoder().encode(getJwtSecret())

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const publicId = searchParams.get('id')

    if (!publicId) {
      return NextResponse.json({ success: false, error: 'File ID required' }, { status: 400 })
    }

    // Auth check
    const cookieStore = await cookies()
    const adminToken = cookieStore.get('admin_token')?.value
    const studentToken = cookieStore.get('student_token')?.value
    let authenticated = false

    const adminRoles = ['founder', 'moderator']
    
    if (adminToken) {
      try {
        const { payload } = await jwtVerify(adminToken, JWT_SECRET)
        if (adminRoles.includes(payload.role as string)) authenticated = true
      } catch {}
    }

    if (!authenticated && studentToken) {
      try {
        const { payload } = await jwtVerify(studentToken, JWT_SECRET)
        if (adminRoles.includes(payload.role as string) || payload.role === 'student') authenticated = true
      } catch {}
    }


    if (!authenticated) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    // Get file info from MongoDB
    const client = await clientPromise
    const db = client.db(process.env.DB_NAME || 'student_services')
    const fileDoc = await db.collection('order_files').findOne({ cloudinaryPublicId: publicId })

    if (!fileDoc) {
      return NextResponse.json({ success: false, error: 'File not found' }, { status: 404 })
    }

    // Fetch file from Cloudinary
    const response = await fetch(fileDoc.cloudinaryUrl)
    const blob = await response.blob()

    // Return with correct filename
    return new NextResponse(blob, {
      headers: {
        'Content-Type': fileDoc.fileType,
        'Content-Disposition': `attachment; filename="${fileDoc.fileName}"`,
        'Content-Length': blob.size.toString(),
      },
    })
  } catch (error) {
    console.error('Download error:', error)
    return NextResponse.json({ success: false, error: 'Download failed' }, { status: 500 })
  }
}