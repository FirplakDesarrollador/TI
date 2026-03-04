'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
    const supabase = createClient()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()

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
        <div className="flex min-h-screen items-center justify-center bg-white p-4">
            <div className="w-full max-w-md space-y-8 rounded-2xl bg-white p-10 shadow-2xl ring-1 ring-gray-200">
                <div className="text-center">
                    <img
                        src="/logo.png"
                        alt="Logo"
                        className="mx-auto h-20 w-auto"
                    />
                    <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-[#254153]">
                        Infraestructura y Desarrollo
                    </h1>
                    <p className="mt-2 text-sm text-gray-500">
                        Inicia sesión para acceder al portal
                    </p>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleLogin}>
                    <div className="space-y-4 rounded-md shadow-sm">
                        <div>
                            <label htmlFor="email-address" className="sr-only">
                                Correo electrónico
                            </label>
                            <input
                                id="email-address"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                className="relative block w-full appearance-none rounded-lg border-0 bg-gray-50 px-3 py-3 text-gray-900 placeholder-gray-400 ring-1 ring-inset ring-gray-300 transition-all focus:z-10 focus:bg-white focus:ring-2 focus:ring-inset focus:ring-[#254153] sm:text-sm"
                                placeholder="correo@ejemplo.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="sr-only">
                                Contraseña
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                className="relative block w-full appearance-none rounded-lg border-0 bg-gray-50 px-3 py-3 text-gray-900 placeholder-gray-400 ring-1 ring-inset ring-gray-300 transition-all focus:z-10 focus:bg-white focus:ring-2 focus:ring-inset focus:ring-[#254153] sm:text-sm"
                                placeholder="********"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="rounded-lg bg-red-500/10 p-3 text-xs text-red-600 ring-1 ring-red-500/20">
                            {error}
                        </div>
                    )}

                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative flex w-full justify-center rounded-lg bg-[#254153] px-4 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:bg-[#1a2e3b] focus:outline-none focus:ring-2 focus:ring-[#254153] focus:ring-offset-2 disabled:opacity-50"
                        >
                            {loading ? (
                                <span className="flex items-center">
                                    <svg
                                        className="mr-2 h-4 w-4 animate-spin text-white"
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                    >
                                        <circle
                                            className="opacity-25"
                                            cx="12"
                                            cy="12"
                                            r="10"
                                            stroke="currentColor"
                                            strokeWidth="4"
                                        ></circle>
                                        <path
                                            className="opacity-75"
                                            fill="currentColor"
                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                        ></path>
                                    </svg>
                                    Iniciando sesión...
                                </span>
                            ) : (
                                'Entrar'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
