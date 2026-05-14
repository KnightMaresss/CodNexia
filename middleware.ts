import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Check if already authenticated via cookie
  const isAuthed = request.cookies.get('site_authed')?.value === 'true'
  
  if (isAuthed) {
    return NextResponse.next()
  }
  
  const secretKey = request.nextUrl.searchParams.get('key')
  
  if (secretKey === 'codnexia-test-2026') {
    const response = NextResponse.next()
    response.cookies.set('site_authed', 'true', { 
      maxAge: 60 * 60 * 24, // 24 hours
      httpOnly: true 
    })
    return response
  }
  
  return new NextResponse('Access Denied - This site is under construction', { status: 401 })
}

export const config = {
  matcher: '/((?!api/auth).*)',
}