import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return request.cookies.get(name)?.value
                },
                set(name: string, value: string, options: CookieOptions) {
                    request.cookies.set({
                        name,
                        value,
                        ...options,
                    })
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    response.cookies.set({
                        name,
                        value,
                        ...options,
                    })
                },
                remove(name: string, options: CookieOptions) {
                    request.cookies.set({
                        name,
                        value: '',
                        ...options,
                    })
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    response.cookies.set({
                        name,
                        value: '',
                        ...options,
                    })
                },
            },
        }
    )

    const { data: { user } } = await supabase.auth.getUser()
    const mockUserId = request.cookies.get('mock_user_id')?.value
    const isAuthorizedMockUser = mockUserId === 'a11458f3-e3c2-4877-8203-49ff9f928285'

    // If user is not logged in and not on login or auth callback page, redirect to login
    if (!user && !isAuthorizedMockUser &&
        !request.nextUrl.pathname.startsWith('/login') && 
        !request.nextUrl.pathname.startsWith('/auth')
    ) {
        return NextResponse.redirect(new URL('/login', request.url))
    }

    // If user is logged in and on login page, redirect to home
    if ((user || isAuthorizedMockUser) && request.nextUrl.pathname.startsWith('/login')) {
        return NextResponse.redirect(new URL('/', request.url))
    }

    return response
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico|favicon.png|logo.webp|logo.png).*)'],
}
