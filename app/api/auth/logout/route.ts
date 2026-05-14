import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST() {
  const cookieStore = await cookies()
  
  // Delete both tokens with matching options
  cookieStore.set('admin_token', '', { maxAge: 0, path: '/' })
  cookieStore.set('student_token', '', { maxAge: 0, path: '/' })
  
  return NextResponse.json({ success: true })
}