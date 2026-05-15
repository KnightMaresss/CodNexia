import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
  const lockEnabled = process.env.SITE_LOCK_ENABLED === 'true'
  const lockKey = process.env.SITE_LOCK_KEY

  if (!lockEnabled) {
    return NextResponse.next()
  }

  const isAuthed = request.cookies.get('site_authed')?.value === 'true'

  if (isAuthed) {
    return NextResponse.next()
  }

  const secretKey = request.nextUrl.searchParams.get('key')

  if (lockKey && secretKey === lockKey) {
    const response = NextResponse.next()

    response.cookies.set('site_authed', 'true', {
      maxAge: 60 * 60 * 24,
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    })

    return response
  }

  return new NextResponse('Access Denied - This site is under construction', {
    status: 401,
  })
}

export const config = {
  matcher: '/((?!api/auth|_next/static|_next/image|favicon.ico|favicon-cx.png|apple-touch-icon.png|manifest.json).*)',
}