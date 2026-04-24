import Link from 'next/link'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { PlusCircle, Clock } from 'lucide-react'
import { createServerSupabaseClient } from '@/lib/supabase'

export default async function Home() {
  const supabase = await createServerSupabaseClient()
  const { data: { user: supabaseUser } } = await supabase.auth.getUser()
  
  const cookieStore = await cookies()
  const mockUserId = cookieStore.get('mock_user_id')?.value
  
  // A user is "authorized" if they have a real Supabase session OR a valid mock session
  const isBypassUser = mockUserId === 'a11458f3-e3c2-4877-8203-49ff9f928285'
  const user = supabaseUser || (isBypassUser ? { 
    id: mockUserId, 
    email: 'acceso.directo@ti-portal.com',
    isMock: true 
  } : null)

  if (!user) {
    redirect('/login')
  }
  
  const authorizedEmails = [
    'aprendiz.desarrollo@firplak.com',
    'juan.bedoya@firplak.com',
    'analista2.desarrollo@firplak.com',
    'daniel.jimenez@firplak.com',
    'alejandro.isaza@firplak.com'
  ]
  const isDashboardAuthorized = user.email && authorizedEmails.includes(user.email)

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-white p-4 font-sans text-[#254153] selection:bg-[#254153]/10 selection:text-[#254153]">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(45%_45%_at_50%_50%,rgba(37,65,83,0.05)_0%,rgba(255,255,255,0)_100%)]" />
      <div className="absolute top-[-10%] left-[-10%] h-[400px] w-[400px] rounded-full bg-[#254153]/5 blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] h-[400px] w-[400px] rounded-full bg-[#254153]/5 blur-[120px]" />

      <div className="relative w-full max-w-4xl space-y-12 text-center">
        {/* Header/Logo section */}
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-1000">
          <div className="mx-auto inline-flex h-32 w-auto items-center justify-center px-4">
            <img src="/logo.png" alt="Firplak Logo" className="h-full w-auto object-contain" />
          </div>
          <div className="space-y-2">
            <h1 className="text-5xl font-extrabold tracking-tight text-[#254153] sm:text-7xl">
              TI <span className="bg-gradient-to-r from-[#254153] to-[#254153]/70 bg-clip-text text-transparent">Infraestructura</span>
            </h1>
            <p className="mx-auto max-w-lg text-lg text-[#254153]/60 sm:text-xl">
              Bienvenido al centro de gestión y desarrollo tecnológico.
            </p>
          </div>
        </div>

        {/* User Status Card */}
        <div className="mx-auto max-w-md animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
          <div className="overflow-hidden rounded-3xl border border-[#254153]/10 bg-white/80 p-8 shadow-2xl shadow-[#254153]/5 backdrop-blur-xl">
            <div className="flex flex-col items-center space-y-6">
              <div className="flex flex-col items-center space-y-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#254153]/40">Sesión Activa</span>
                <p className="text-lg font-medium text-[#254153]/80">{user.email}</p>
                <div className="flex items-center gap-2">
                  {user.id === 'a11458f3-e3c2-4877-8203-49ff9f928285' && (
                    <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                      Usuario Relacionado
                    </span>
                  )}
                </div>
              </div>

              <div className="h-px w-full bg-gradient-to-r from-transparent via-[#254153]/10 to-transparent" />

                <div className="flex w-full flex-col gap-3">
                  <Link
                    href="/dashboard/inventory/request"
                    className="inline-flex w-full items-center justify-center gap-3 rounded-xl border-2 border-[#254153]/10 bg-white px-6 py-4 text-sm font-bold text-[#254153] transition-all hover:border-[#254153]/30 hover:bg-[#254153]/5 active:scale-[0.98]"
                  >
                    <PlusCircle size={20} />
                    Solicitar Dispositivo
                  </Link>

                  <Link
                    href="/dashboard/inventory/request/status"
                    className="inline-flex w-full items-center justify-center gap-3 rounded-xl border-2 border-[#254153]/10 bg-white px-6 py-4 text-sm font-bold text-[#254153] transition-all hover:border-[#254153]/30 hover:bg-[#254153]/5 active:scale-[0.98]"
                  >
                    <Clock size={20} />
                    Ver Estados de mis Solicitudes
                  </Link>

                  {isDashboardAuthorized && (
                    <Link
                      href="/dashboard"
                      className="inline-flex w-full items-center justify-center rounded-xl bg-[#254153] px-6 py-4 text-sm font-bold text-white transition-all hover:scale-[1.02] hover:bg-[#1a2e3b] active:scale-[0.98] shadow-lg shadow-[#254153]/20"
                    >
                      Ir al Dashboard Principal
                    </Link>
                  )}
                  <form action="/auth/signout" method="post" className="w-full">
                    <button
                      type="submit"
                      className="inline-flex w-full items-center justify-center rounded-xl border border-[#254153]/10 bg-white px-6 py-4 text-sm font-semibold text-[#254153]/60 transition-all hover:bg-slate-50 hover:text-red-500 active:scale-[0.98]"
                    >
                      Cerrar Sesión
                    </button>
                  </form>
                </div>
            </div>
          </div>
        </div>

        {/* Footer/Quick info */}
        <div className="pt-8 text-sm text-[#254153]/30 animate-in fade-in duration-1000 delay-500">
          &copy; {new Date().getFullYear()} Firplak Desarrollo. Todos los derechos reservados.
        </div>
      </div>
    </main>
  )
}
