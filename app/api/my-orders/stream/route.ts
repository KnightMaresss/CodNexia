export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60
import { NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { addClient, removeClient } from '@/lib/orders-stream'
import { getJwtSecret } from '@/lib/jwt-secret'

const JWT_SECRET = new TextEncoder().encode(getJwtSecret())

export async function GET() {
  const cookieStore = await cookies()

  const token =
    cookieStore.get('student_token')?.value ||
    cookieStore.get('admin_token')?.value

  if (!token) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)

    const role = typeof payload.role === 'string' ? payload.role : null

    if (!['student', 'founder', 'moderator'].includes(role || '')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }
  } catch {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    )
  }

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    start(controller) {
      const client = {
        id: Date.now(),
        send: (data: string) => {
          try {
            controller.enqueue(encoder.encode(`data: ${data}\n\n`))
          } catch {}
        },
      }

      addClient(client)

      client.send(
        JSON.stringify({
          type: 'connected',
        })
      )

      return () => {
        removeClient(client)
      }
    },
    cancel() {},
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}