'use client'

import { useState, useEffect } from 'react'
import { 
  ArrowLeft, 
  Loader2, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Monitor, 
  Calendar,
  Hash,
  Building2,
  UserCheck,
  MessageSquare,
  Search,
  Filter
} from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

export default function RequestStatusPage() {
  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const supabase = createClient()

  useEffect(() => {
    async function fetchRequests() {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser()
        if (!authUser) return
        setUser(authUser)

        const { data, error } = await supabase
          .from('ti_solicitudes_dispositivos')
          .select('*')
          .eq('user_id', authUser.id)
          .order('created_at', { ascending: false })

        if (error) throw error
        setRequests(data || [])
      } catch (error) {
        console.error('Error fetching requests:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchRequests()
  }, [])

  const getStatusStyle = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pendiente':
        return 'bg-amber-100 text-amber-700 border-amber-200'
      case 'aprobado':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200'
      case 'rechazado':
        return 'bg-rose-100 text-rose-700 border-rose-200'
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pendiente':
        return <Clock size={16} />
      case 'aprobado':
        return <CheckCircle2 size={16} />
      case 'rechazado':
        return <XCircle size={16} />
      default:
        return <Clock size={16} />
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <Loader2 className="animate-spin text-[#254153]" size={40} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto max-w-5xl px-4 py-4 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#254153]/5 text-[#254153] transition-colors hover:bg-[#254153]/10"
              >
                <ArrowLeft size={20} />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-[#254153]">Mis Solicitudes</h1>
                <p className="text-xs text-[#749094]">Seguimiento de requerimientos de TI</p>
              </div>
            </div>
            <Link
              href="/dashboard/inventory/request"
              className="hidden rounded-xl bg-[#254153] px-4 py-2 text-sm font-bold text-white transition-all hover:bg-[#1a2e3b] sm:block"
            >
              Nueva Solicitud
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 pt-8 sm:px-6">
        {requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center space-y-4 rounded-3xl border-2 border-dashed border-slate-200 bg-white py-20 text-center">
            <div className="rounded-full bg-slate-50 p-4">
              <Search size={40} className="text-slate-300" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#254153]">No tienes solicitudes aún</h3>
              <p className="text-sm text-[#749094]">Cuando realices un pedido de dispositivo aparecerá aquí.</p>
            </div>
            <Link
              href="/dashboard/inventory/request"
              className="rounded-xl bg-[#254153] px-6 py-3 text-sm font-bold text-white transition-all hover:bg-[#1a2e3b]"
            >
              Solicitar mi primer dispositivo
            </Link>
          </div>
        ) : (
          <div className="grid gap-6">
            {requests.map((request) => (
              <div 
                key={request.id}
                className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 transition-all hover:border-[#254153]/20 hover:shadow-xl hover:shadow-[#254153]/5"
              >
                {/* Status Badge */}
                <div className="mb-6 flex items-center justify-between">
                  <div className={`flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wider ${getStatusStyle(request.estado)}`}>
                    {getStatusIcon(request.estado)}
                    {request.estado}
                  </div>
                  <span className="text-xs text-[#749094]">
                    ID: #{request.id.toString().slice(0, 8)}
                  </span>
                </div>

                {/* Content Grid */}
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="space-y-1">
                    <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#749094]">
                      <Monitor size={12} /> Dispositivo
                    </span>
                    <p className="font-bold text-[#254153]">{request.dispositivo}</p>
                    <p className="text-sm text-[#749094]">Cantidad: {request.cantidad}</p>
                  </div>

                  <div className="space-y-1">
                    <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#749094]">
                      <Calendar size={12} /> Solicitado el
                    </span>
                    <p className="text-sm font-medium text-[#254153]">
                      {new Date(request.created_at).toLocaleDateString('es-ES', { 
                        day: '2-digit', 
                        month: 'long', 
                        year: 'numeric'
                      })}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#749094]">
                      <UserCheck size={12} /> Jefe Aprobador
                    </span>
                    <p className="text-sm font-medium text-[#254153]">{request.jefe_aprobador}</p>
                  </div>

                  <div className="space-y-1">
                    <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#749094]">
                      <Building2 size={12} /> Centro de Costos
                    </span>
                    <p className="text-sm font-medium text-[#254153]">{request.centro_costos}</p>
                  </div>

                  <div className="space-y-1">
                    <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#749094]">
                      <Hash size={12} /> Cuenta Contable
                    </span>
                    <p className="text-sm font-medium text-[#254153]">{request.cuenta_contable}</p>
                  </div>

                  {request.comentario && (
                    <div className="lg:col-span-3">
                      <div className="mt-2 rounded-2xl bg-slate-50 p-4">
                        <span className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#749094]">
                          <MessageSquare size={12} /> Comentario
                        </span>
                        <p className="text-sm italic text-[#254153]/70">"{request.comentario}"</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
