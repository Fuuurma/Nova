// src/middleware.ts
/**
 * Middleware for Nova.
 *
 * Handles:
 * - Proxying /api/nexus/* requests to Nexus backend
 * - Adding session token to proxied requests
 * - Security headers
 */
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const NEXUS_API_URL = process.env.NEXUS_API_URL ?? 'http://localhost:4000';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Proxy /api/nexus/* to Nexus backend with session token
  if (pathname.startsWith('/api/nexus/')) {
    const nexusPath = pathname.replace('/api/nexus', '/api');
    const sessionToken = request.cookies.get('better-auth.session_token')?.value;

    const headers = new Headers(request.headers);
    if (sessionToken) {
      headers.set('Authorization', `Bearer ${sessionToken}`);
    }

    // Remove Next.js specific headers
    headers.delete('x-middleware-request');

    return NextResponse.rewrite(
      new URL(nexusPath + request.nextUrl.search, NEXUS_API_URL),
      { headers }
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/nexus/:path*'],
};