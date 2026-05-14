import { NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { addClient } from '@/lib/orders-stream'

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret')

export async function GET() {
  const cookieStore = await cookies()
  const token = cookieStore.get('admin_token')?.value || cookieStore.get('student_token')?.value
  
  if (!token) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    const adminRoles = ['founder', 'moderator']
    if (!adminRoles.includes(payload.role as string)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }
  } catch {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const encoder = new TextEncoder()
  
  const stream = new ReadableStream({
    start(controller) {
      const client = {
        id: Date.now(),
        send: (data: string) => {
          controller.enqueue(encoder.encode(`data: ${data}\n\n`))
        }
      }
      addClient(client)
      client.send(JSON.stringify({ type: 'connected' }))
    },
    cancel() {}
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}