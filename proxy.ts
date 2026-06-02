import createMiddleware from 'next-intl/middleware'
import { routing } from './i18n/routing'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const intlMiddleware = createMiddleware(routing)

export function proxy(request: NextRequest) {
  const lockEnabled = process.env.SITE_LOCK_ENABLED === 'true'
  const lockKey = process.env.SITE_LOCK_KEY
  const pathname = request.nextUrl.pathname

  // Allow important assets/APIs
  if (
    pathname.startsWith('/api/cron/') ||
    pathname === '/api/nowpayments/ipn' ||
    pathname === '/og-image.png' ||
    pathname === '/og-banner-v2.png' ||
    pathname === '/favicon-cx.png' ||
    pathname === '/apple-touch-icon.png' ||
    pathname === '/manifest.json' ||
    pathname.startsWith('/_next/')
  ) {
    return NextResponse.next()
  }

  // Run next-intl middleware FIRST
  const intlResponse = intlMiddleware(request)

  // If site lock disabled → continue normally
  if (!lockEnabled) {
    return intlResponse
  }

  const isAuthed = request.cookies.get('site_authed')?.value === 'true'

  if (isAuthed) {
    return intlResponse
  }

  const secretKey = request.nextUrl.searchParams.get('key')

  if (lockKey && secretKey === lockKey) {
    const response = intlResponse

    response.cookies.set('site_authed', 'true', {
      maxAge: 60 * 60 * 24,
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    })

    return response
  }

  return new NextResponse(
    'Access Denied - This site is under construction',
    {
      status: 401,
    }
  )
}

export const config = {
  matcher: ['/((?!api|_next|.*\\..*).*)'],
}