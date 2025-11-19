import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
    const token = request.cookies.get('token')?.value
    const { pathname } = request.nextUrl

    // Define public paths that don't require authentication
    const isPublicPath =
        pathname === '/' ||
        pathname.startsWith('/login') ||
        pathname.startsWith('/signup') ||
        pathname.startsWith('/forget-password') ||
        pathname.startsWith('/reset-password') ||
        pathname.startsWith('/imgs') ||
        pathname.startsWith('/public')

    // If the user is not logged in and tries to access a protected route
    if (!token && !isPublicPath) {
        return NextResponse.redirect(new URL('/login', request.url))
    }

    // If the user is logged in
    if (token) {
        try {
            // Decode the JWT payload (middle part)
            const base64Url = token.split('.')[1]
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
            }).join(''))

            const payload = JSON.parse(jsonPayload)
            const userRole = payload.role

            // 1. Admin Route Protection
            // If trying to access admin routes and not an Admin
            if (pathname.startsWith('/admin') && userRole !== 'Admin') {
                return NextResponse.redirect(new URL('/home', request.url))
            }

            // 2. Redirect logged-in users away from auth pages
            if (pathname === '/login' || pathname === '/signup' || pathname.startsWith('/forget-password')) {
                if (userRole === 'Admin') {
                    return NextResponse.redirect(new URL('/admin', request.url))
                }
                return NextResponse.redirect(new URL('/home', request.url))
            }

        } catch (e) {
            // If token decoding fails, we proceed. Backend will handle invalid tokens.
            console.error('Middleware token decode error:', e)
        }
    }

    return NextResponse.next()
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!api|_next/static|_next/image|favicon.ico|manifest.json).*)',
    ],
}
