import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const host = request.headers.get('host') || '';
  
  // Force HTTPS rewrite to resolve legacy unencrypted HTTP vulnerability,
  // but skip it if running locally to prevent SSL protocol errors on localhost.
  if (
    process.env.NODE_ENV === 'production' &&
    request.headers.get('x-forwarded-proto') !== 'https' &&
    !host.includes('localhost') &&
    !host.includes('127.0.0.1')
  ) {
    return NextResponse.redirect(
      `https://${host}${request.nextUrl.pathname}`,
      301
    )
  }
  return NextResponse.next()
}
