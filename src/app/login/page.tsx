"use client"

import { useState } from "react"
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from "next/navigation"
import { Loader2, Mail, Lock, AlertCircle } from "lucide-react"

export default function LoginPage() {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })

        if (error) {
            setError(error.message)
            setLoading(false)
        } else {
            router.refresh()
            router.push('/')
        }
    }

    return (
        <div className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-white">
            {/* Soft Ambient Background Elements */}
            <div className="absolute inset-0 z-0 overflow-hidden">
                <div className="absolute -left-[10%] -top-[10%] h-[70%] w-[70%] rounded-full bg-[#254153]/5 blur-[130px]"></div>
                <div className="absolute -right-[10%] -bottom-[10%] h-[70%] w-[70%] rounded-full bg-[#254153]/5 blur-[130px]"></div>
            </div>

            <div className="relative z-10 w-full max-w-[460px] px-8 py-12 animate-in fade-in zoom-in-95 duration-1000">
                <div className="relative overflow-hidden rounded-[3.5rem] bg-[#254153] p-12 pt-16 shadow-[0_48px_96px_-24px_rgba(37,65,83,0.45)] ring-1 ring-white/10 sm:p-14 sm:pt-20">
                    {/* Subtle glass highlight */}
                    <div className="absolute inset-0 -z-10 bg-gradient-to-br from-white/[0.05] to-transparent"></div>
                    
                    <div className="relative z-10 text-center">
                        <div className="mx-auto mb-14 flex w-full max-w-[280px] items-center justify-center py-2 transition-transform duration-700 hover:scale-[1.03]">
                            <img
                                src="/logo.webp"
                                alt="Firplak Logo"
                                className="w-full h-auto object-contain brightness-110"
                            />
                        </div>
                        
                        <div className="space-y-4">
                            <h1 className="text-4xl font-black tracking-tight text-white">
                                Bienvenido
                            </h1>
                            <p className="text-[12px] font-bold uppercase tracking-[0.4em] text-white">
                                Gestión de Infraestructura
                            </p>
                        </div>

                        <form onSubmit={handleLogin} className="mt-14 space-y-8 text-left">
                            <div className="space-y-6">
                                <div className="space-y-3">
                                    <label className="pl-1 text-[11px] font-bold uppercase tracking-[0.3em] text-white">
                                        Email Empresarial
                                    </label>
                                    <div className="group relative">
                                        <div className="absolute inset-y-0 left-0 flex items-center pl-6 text-white/40 transition-colors group-focus-within:text-white">
                                            <Mail size={18} strokeWidth={2.5} />
                                        </div>
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="nombre@firplak.com"
                                            required
                                            className="w-full rounded-[1.75rem] border-white/10 bg-white/[0.08] py-5 pl-14 pr-6 text-sm font-semibold text-white transition-all focus:border-white/30 focus:bg-white/[0.12] focus:ring-8 focus:ring-white/5 outline-none placeholder:text-white/30"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="pl-1 text-[11px] font-bold uppercase tracking-[0.3em] text-white">
                                        Contraseña
                                    </label>
                                    <div className="group relative">
                                        <div className="absolute inset-y-0 left-0 flex items-center pl-6 text-white/40 transition-colors group-focus-within:text-white">
                                            <Lock size={18} strokeWidth={2.5} />
                                        </div>
                                        <input
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="••••••••••••"
                                            required
                                            className="w-full rounded-[1.75rem] border-white/10 bg-white/[0.08] py-5 pl-14 pr-6 text-sm font-semibold text-white transition-all focus:border-white/30 focus:bg-white/[0.12] focus:ring-8 focus:ring-white/5 outline-none placeholder:text-white/30"
                                        />
                                    </div>
                                </div>
                            </div>

                            {error && (
                                <div className="flex animate-in slide-in-from-top-3 items-center gap-4 rounded-2xl bg-rose-500/10 p-6 text-[13px] font-bold text-rose-400 ring-1 ring-inset ring-rose-500/20">
                                    <AlertCircle size={18} className="shrink-0" />
                                    <span>{error}</span>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="group relative w-full overflow-hidden rounded-[1.75rem] bg-white text-[#254153] py-5 text-[13px] font-black tracking-[0.2em] shadow-2xl transition-all hover:bg-slate-50 hover:-translate-y-1 active:translate-y-0 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
                            >
                                <span className="relative z-10 flex items-center justify-center uppercase">
                                    {loading ? (
                                        <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                                    ) : (
                                        "Ingresar al sistema"
                                    )}
                                </span>
                                <div className="absolute inset-0 -z-0 translate-x-[-100%] bg-gradient-to-r from-transparent via-[#254153]/5 to-transparent transition-transform duration-1000 group-hover:translate-x-[100%]"></div>
                            </button>
                        </form>
                    </div>
                </div>
                
                <p className="mt-20 text-center text-[10px] font-bold uppercase tracking-[0.5em] text-[#254153]/40">
                    &copy; {new Date().getFullYear()} Firplak Desarrollo
                </p>
            </div>
        </div>
    )
}
