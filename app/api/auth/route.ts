import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { password } = await request.json()

  if (password !== process.env.SITE_PASSWORD) {
    return NextResponse.json({ error: 'Incorrect password' }, { status: 401 })
  }

  const token = process.env.AUTH_TOKEN!
  const response = NextResponse.json({ ok: true })
  response.cookies.set('family-map-auth', token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    // 30 days
    maxAge: 60 * 60 * 24 * 30,
    secure: process.env.NODE_ENV === 'production',
  })
  return response
}
