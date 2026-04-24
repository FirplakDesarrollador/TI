import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { userId } = await request.json()
  
  // Only allow the specific authorized ID
  if (userId !== 'a11458f3-e3c2-4877-8203-49ff9f928285') {
    return NextResponse.json({ error: 'Unauthorized ID' }, { status: 401 })
  }

  const response = NextResponse.json({ success: true })
  
  // Set a secure cookie for the mock session
  response.cookies.set('mock_user_id', userId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7 // 1 week
  })

  return response
}
