import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export default async function Home() {
  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-white p-4 text-[#254153]">
      <div className="w-full max-w-2xl text-center space-y-8">
        <img
          src="/logo.png"
          alt="Logo"
          className="mx-auto h-32 w-auto"
        />
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl text-[#254153]">
          Infraestructura y <span className="text-[#254153]/80">Desarrollo</span>
        </h1>

        <div className="space-y-6">
          <p className="text-xl text-gray-400">
            Has iniciado sesión como: <span className="text-white font-medium">{user.email}</span>
          </p>
          <div className="flex justify-center gap-4">
            <Link
              href="/login"
              className="rounded-lg bg-red-600/10 px-6 py-3 text-red-500 ring-1 ring-red-500/20 transition-all hover:bg-red-600/20"
            >
              Cerrar sesión
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
