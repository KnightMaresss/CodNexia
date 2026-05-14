import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const secretKey = request.nextUrl.searchParams.get('key')
  
  if (secretKey !== 'codnexia-test-2026') {
    return new NextResponse('Access Denied - This site is under construction', { status: 401 })
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: '/((?!api/auth).*)',
}