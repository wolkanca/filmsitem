import { NextRequest, NextResponse } from 'next/server';

const CANONICAL_HOST = 'izlediklerim.wolkanca.com';
const CANONICAL_ORIGIN = `https://${CANONICAL_HOST}`;

export function middleware(request: NextRequest) {
  const { hostname, pathname, search } = request.nextUrl;

  // If the request is NOT from the canonical host, 301 redirect
  if (hostname !== CANONICAL_HOST) {
    const destination = `${CANONICAL_ORIGIN}${pathname}${search}`;
    return NextResponse.redirect(destination, 301);
  }

  return NextResponse.next();
}

export const config = {
  // Match all routes except Next.js internals and static files
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|favicon\\.svg|favicon-96x96\\.png|apple-touch-icon\\.png|site\\.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff2?|ttf|eot)$).*)',
  ],
};
