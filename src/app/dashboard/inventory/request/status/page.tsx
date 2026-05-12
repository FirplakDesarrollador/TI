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
        <div className="mx-auto max-w-5xl px-3 py-1 sm:px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Link
                href="/"
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#254153]/5 text-[#254153] transition-colors hover:bg-[#254153]/10"
              >
                <ArrowLeft size={16} />
              </Link>
              <div>
                <h1 className="text-base font-black text-[#254153] uppercase tracking-tighter leading-none">Mis Solicitudes</h1>
                <p className="text-[9px] font-bold text-[#749094] uppercase tracking-widest leading-none mt-0.5">Seguimiento TI</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {[
                'aprendiz.desarrollo@firplak.com',
                'juan.bedoya@firplak.com',
                'analista2.desarrollo@firplak.com',
                'daniel.jimenez@firplak.com',
                'alejandro.isaza@firplak.com'
              ].includes(user?.email || '') && (
                <Link
                  href="/dashboard/inventory/request/admin"
                  className="hidden rounded-lg border border-[#254153]/20 bg-white px-3 py-1.5 text-[11px] font-black uppercase tracking-widest text-[#254153] transition-all hover:bg-slate-50 sm:block"
                >
                  Admin
                </Link>
              )}
              <Link
                href="/dashboard/inventory/request"
                className="hidden rounded-lg bg-[#254153] px-3 py-1.5 text-[11px] font-black uppercase tracking-widest text-white transition-all hover:bg-[#1a2e3b] sm:block"
              >
                Nueva
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 pt-4 sm:px-6">
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
          <div className="grid gap-2">
            {requests.map((request) => (
              <div 
                key={request.id}
                className="group relative overflow-hidden rounded-lg border border-slate-200 bg-white p-2 transition-all hover:border-[#254153]/20 hover:shadow-lg hover:shadow-[#254153]/5"
              >
                {/* Status Badge */}
                <div className="mb-1.5 flex items-center justify-between">
                  <div className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider ${getStatusStyle(request.estado)}`}>
                    {getStatusIcon(request.estado)}
                    {request.estado}
                  </div>
                  <span className="text-[9px] font-black text-[#254153] bg-slate-100 px-2 py-0.5 rounded-md uppercase tracking-tighter">
                    {request.ticket_number || `ID: #${request.id.toString().slice(0, 8)}`}
                  </span>
                </div>

                {/* Content Grid */}
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
                  <div className="space-y-0.5">
                    <span className="flex items-center gap-1 text-[8px] font-black uppercase tracking-widest text-[#749094]">
                      <Monitor size={10} /> Dispositivo
                    </span>
                    <p className="text-[11px] font-black text-[#254153] leading-none">{request.dispositivo}</p>
                    <p className="text-[9px] text-[#749094]">Cant: {request.cantidad}</p>
                  </div>

                  <div className="space-y-0.5">
                    <span className="flex items-center gap-1 text-[8px] font-black uppercase tracking-widest text-[#749094]">
                      <Calendar size={10} /> Solicitado
                    </span>
                    <p className="text-[10px] font-bold text-[#254153]">
                      {new Date(request.created_at).toLocaleDateString('es-ES', { 
                        day: '2-digit', 
                        month: 'short'
                      })}
                    </p>
                  </div>

                  <div className="space-y-0.5">
                    <span className="flex items-center gap-1 text-[8px] font-black uppercase tracking-widest text-[#749094]">
                      <UserCheck size={10} /> Jefe
                    </span>
                    <p className="text-[10px] font-bold text-[#254153] truncate">{request.jefe_aprobador}</p>
                  </div>

                  <div className="space-y-0.5">
                    <span className="flex items-center gap-1 text-[8px] font-black uppercase tracking-widest text-[#749094]">
                      <Building2 size={10} /> C. Costos
                    </span>
                    <p className="text-[10px] font-bold text-[#254153] truncate">{request.centro_costos}</p>
                  </div>

                  <div className="space-y-0.5">
                    <span className="flex items-center gap-1 text-[8px] font-black uppercase tracking-widest text-[#749094]">
                      <Hash size={10} /> Cuenta
                    </span>
                    <p className="text-[10px] font-bold text-[#254153] truncate">{request.cuenta_contable}</p>
                  </div>

                  {request.comentario && (
                    <div className="lg:col-span-5">
                      <div className="mt-1 rounded-lg bg-slate-50 p-1.5 border border-slate-100">
                        <span className="mb-0.5 flex items-center gap-1 text-[8px] font-black uppercase tracking-widest text-[#749094]">
                          <MessageSquare size={9} /> Comentario
                        </span>
                        <p className="text-[10px] italic text-[#254153]/70 line-clamp-1">"{request.comentario}"</p>
                      </div>
                    </div>
                  )}

                  {request.comentario_admin && (
                    <div className="lg:col-span-5">
                      <div className="mt-1 rounded-lg bg-[#254153]/5 p-1.5 border border-[#254153]/10">
                        <span className="mb-0.5 flex items-center gap-1 text-[8px] font-black uppercase tracking-widest text-[#254153]">
                          <UserCheck size={9} /> Respuesta TI
                        </span>
                        <p className="text-[10px] font-bold text-[#254153]">"{request.comentario_admin}"</p>
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
