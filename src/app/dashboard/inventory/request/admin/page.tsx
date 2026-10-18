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
  Filter,
  Save,
  User,
  ExternalLink,
  ChevronDown,
  Mail,
  FileUp,
  Eye,
  Lock,
  X,
  Maximize2,
  PackageCheck
} from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { LogoFPK } from '@/components/LogoFPK'

export default function AdminRequestManagementPage() {
  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>('todos')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRequest, setSelectedRequest] = useState<any>(null)
  const supabase = createClient()

  useEffect(() => {
    checkAdminAuth()
  }, [])

  async function checkAdminAuth() {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const authorizedEmails = [
        'aprendiz.desarrollo@firplak.com',
        'juan.bedoya@firplak.com',
        'analista2.desarrollo@firplak.com',
        'daniel.jimenez@firplak.com',
        'alejandro.isaza@firplak.com',
        'milton.rendon@firplak.com'
      ]

      if (!user?.email || !authorizedEmails.includes(user.email)) {
        window.location.href = '/dashboard/inventory/request/status'
        return
      }

      await fetchRequests()
    } catch (error) {
      console.error('Auth check error:', error)
      window.location.href = '/'
    }
  }

  async function fetchRequests() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('ti_solicitudes_dispositivos')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setRequests(data || [])
    } catch (error) {
      console.error('Error fetching requests:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateStatus = async (id: string, updates: any) => {
    setUpdating(id)
    try {
      const { error } = await supabase
        .from('ti_solicitudes_dispositivos')
        .update(updates)
        .eq('id', id)

      if (error) throw error
      
      // Update local state
      setRequests(requests.map(r => 
        r.id === id ? { ...r, ...updates } : r
      ))
    } catch (error) {
      console.error('Error updating request:', error)
      alert('Error al actualizar la solicitud')
    } finally {
      setUpdating(null)
    }
  }

  const getStatusStyle = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pendiente':
        return 'bg-amber-100 text-amber-700 border-amber-200'
      case 'aprobado':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200'
      case 'rechazado':
        return 'bg-rose-100 text-rose-700 border-rose-200'
      case 'completado':
        return 'bg-violet-100 text-violet-700 border-violet-200'
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
      case 'completado':
        return <PackageCheck size={16} />
      default:
        return <Clock size={16} />
    }
  }

  const filteredRequests = requests.filter(r => {
    const matchesStatus = filterStatus === 'todos' || r.estado?.toLowerCase() === filterStatus.toLowerCase()
    const matchesSearch = 
      (r.nombre_solicitante?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (r.ticket_number?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (r.email_solicitante?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (r.dispositivo?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    
    return matchesStatus && matchesSearch
  })

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-[#254153]" />
          <p className="text-sm font-bold text-[#254153] animate-pulse uppercase tracking-widest">Cargando solicitudes...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-3 py-1 sm:px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Link
                href="/dashboard/inventory/request/status"
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#254153]/5 text-[#254153] transition-colors hover:bg-[#254153]/10"
              >
                <ArrowLeft size={16} />
              </Link>
              <div className="flex items-center gap-2">
                <LogoFPK className="h-6 w-auto" />
                <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block" />
                <div className="hidden sm:block">
                  <h1 className="text-base font-black text-[#254153] tracking-tighter uppercase leading-none">Solicitudes</h1>
                  <p className="text-[9px] font-bold text-[#749094] uppercase tracking-widest leading-none">Admin TI</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative hidden md:block">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#749094]" size={14} />
                <input 
                  type="text"
                  placeholder="Buscar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-8 w-48 rounded-lg border border-slate-200 bg-slate-50 pl-8 pr-3 text-[12px] focus:border-[#254153]/30 focus:bg-white focus:outline-none"
                />
              </div>
              <div className="flex rounded-lg border border-slate-200 bg-white p-0.5">
                {['todos', 'pendiente', 'aprobado', 'rechazado', 'completado'].map((s) => (
                  <button
                    key={s}
                    onClick={() => setFilterStatus(s)}
                    className={`px-2 py-1 text-[9px] font-black uppercase tracking-wider rounded-md transition-all ${
                      filterStatus === s 
                        ? 'bg-[#254153] text-white' 
                        : 'text-[#749094] hover:bg-slate-50'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 pt-4 sm:px-6">
        <div className="grid gap-3">
          {filteredRequests.length === 0 ? (
            <div className="flex flex-col items-center justify-center space-y-4 rounded-3xl border-2 border-dashed border-slate-200 bg-white py-20 text-center">
              <Search size={40} className="text-slate-300" />
              <p className="text-sm font-bold text-[#749094] uppercase">No se encontraron solicitudes</p>
            </div>
          ) : (
            filteredRequests.map((request) => (
              <RequestCard 
                key={request.id} 
                request={request} 
                isUpdating={updating === request.id}
                onUpdate={handleUpdateStatus}
                onOpenDetails={() => setSelectedRequest(request)}
              />
            ))
          )}
        </div>
      </main>

      {/* Details Modal */}
      {selectedRequest && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[#254153]/20 p-4 backdrop-blur-sm"
          onClick={() => setSelectedRequest(null)}
        >
          <div 
            className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 p-4">
              <div className="flex items-center gap-3">
                <div className={`flex items-center justify-center w-10 h-10 rounded-xl border ${getStatusStyle(selectedRequest.estado)} bg-opacity-20`}>
                  {getStatusIcon(selectedRequest.estado)}
                </div>
                <div>
                  <h3 className="text-sm font-black text-[#254153] uppercase tracking-tighter">Detalles de Solicitud</h3>
                  <p className="text-[10px] font-bold text-[#749094] uppercase tracking-widest">{selectedRequest.ticket_number}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedRequest(null)}
                className="rounded-lg p-2 text-[#749094] transition-colors hover:bg-slate-100 hover:text-[#254153]"
              >
                <X size={20} />
              </button>
            </div>

            <div className="overflow-y-auto p-4 sm:p-6 custom-scrollbar">
              <div className="grid gap-6">
                
                {/* General Info */}
                <div>
                  <h4 className="mb-3 text-[10px] font-black text-[#749094] uppercase tracking-widest border-b border-slate-100 pb-1">Información General</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <InfoField icon={<Monitor size={14} />} label="Dispositivo" value={selectedRequest.dispositivo} />
                    <InfoField icon={<Hash size={14} />} label="Cantidad" value={selectedRequest.cantidad?.toString()} />
                    <InfoField icon={<Calendar size={14} />} label="Fecha Solicitud" value={new Date(selectedRequest.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })} />
                  </div>
                </div>

                {/* Approvals Info */}
                <div>
                  <h4 className="mb-3 text-[10px] font-black text-[#749094] uppercase tracking-widest border-b border-slate-100 pb-1">Aprobaciones y Costos</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <InfoField icon={<UserCheck size={14} />} label="Jefe Aprobador" value={selectedRequest.jefe_aprobador} />
                    <InfoField icon={<Building2 size={14} />} label="Centro Costos" value={selectedRequest.centro_costos} />
                    <InfoField icon={<Hash size={14} />} label="Cuenta Contable" value={selectedRequest.cuenta_contable} />
                  </div>
                </div>

                {/* User Details (if available) */}
                {(selectedRequest.nombre_solicitante || selectedRequest.email_solicitante) && (
                  <div>
                    <h4 className="mb-3 text-[10px] font-black text-[#749094] uppercase tracking-widest border-b border-slate-100 pb-1">Datos del Solicitante</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {selectedRequest.nombre_solicitante && <InfoField icon={<User size={14} />} label="Nombre" value={selectedRequest.nombre_solicitante} />}
                      {selectedRequest.email_solicitante && <InfoField icon={<Mail size={14} />} label="Email" value={selectedRequest.email_solicitante} />}
                    </div>
                  </div>
                )}

                {/* Comments */}
                <div className="space-y-4">
                  {selectedRequest.comentario && (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <div className="mb-2 flex items-center gap-2 text-[10px] font-black text-[#749094] uppercase tracking-widest">
                        <MessageSquare size={14} />
                        Comentario del Solicitante
                      </div>
                      <p className="text-sm text-[#254153] italic">"{selectedRequest.comentario}"</p>
                    </div>
                  )}

                  {selectedRequest.comentario_admin && (
                    <div className="rounded-xl border border-[#254153]/10 bg-[#254153]/5 p-4">
                      <div className="mb-2 flex items-center gap-2 text-[10px] font-black text-[#254153] uppercase tracking-widest">
                        <UserCheck size={14} />
                        Respuesta de TI
                      </div>
                      <p className="text-sm text-[#254153] font-medium">"{selectedRequest.comentario_admin}"</p>
                    </div>
                  )}

                  {selectedRequest.notas_privadas_admin && (
                    <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-4">
                      <div className="mb-2 flex items-center gap-2 text-[10px] font-black text-indigo-600 uppercase tracking-widest">
                        <Lock size={14} />
                        Notas Privadas (Admin)
                      </div>
                      <p className="text-sm text-[#254153] font-medium">"{selectedRequest.notas_privadas_admin}"</p>
                    </div>
                  )}
                  
                  {selectedRequest.factura_url && (
                    <div className="flex items-center gap-4 p-4 rounded-xl border border-emerald-100 bg-emerald-50">
                      <div className="flex-1">
                        <h5 className="text-[11px] font-black text-emerald-800 uppercase tracking-widest mb-1">Documento Adjunto</h5>
                        <p className="text-xs text-emerald-600 font-medium">Factura de compra disponible</p>
                      </div>
                      <a 
                        href={selectedRequest.factura_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white text-xs font-bold transition-all hover:bg-emerald-700 shadow-md shadow-emerald-200"
                      >
                        <Eye size={14} /> Ver Factura
                      </a>
                    </div>
                  )}
                </div>

              </div>
            </div>
            
            <div className="border-t border-slate-100 bg-slate-50 p-4 flex justify-end">
               <button
                  onClick={() => setSelectedRequest(null)}
                  className="rounded-lg bg-[#254153] px-6 py-2 text-xs font-bold text-white transition-all hover:bg-[#1a2e3b] shadow-md shadow-[#254153]/20"
                >
                  Cerrar
                </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function RequestCard({ request, isUpdating, onUpdate, onOpenDetails }: { request: any, isUpdating: boolean, onUpdate: any, onOpenDetails: () => void }) {
  const [status, setStatus] = useState(request.estado)
  const [adminComment, setAdminComment] = useState(request.comentario_admin || '')
  const [privateNotes, setPrivateNotes] = useState(request.notas_privadas_admin || '')
  const [uploading, setUploading] = useState(false)
  const supabase = createClient()

  const hasChanges = 
    status !== request.estado || 
    adminComment !== (request.comentario_admin || '') ||
    privateNotes !== (request.notas_privadas_admin || '')

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${request.ticket_number}_factura_${Math.random()}.${fileExt}`
      const filePath = `${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('facturas-dispositivos')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('facturas-dispositivos')
        .getPublicUrl(filePath)

      await onUpdate(request.id, { factura_url: publicUrl })
    } catch (error) {
      console.error('Error uploading file:', error)
      alert('Error al subir la factura')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="group relative overflow-hidden rounded-lg border border-slate-200 bg-white p-2 transition-all hover:border-[#254153]/20 hover:shadow-lg hover:shadow-[#254153]/5">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        
        {/* Left Column: User & Info */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-start gap-2">
            <div className="h-8 w-8 rounded-lg bg-[#254153]/5 flex items-center justify-center text-[#254153]">
              <User size={16} />
            </div>
            <div>
              <h3 className="font-black text-[#254153] text-[12px] leading-tight">{request.nombre_solicitante || 'Usuario Nexo'}</h3>
              <p className="text-[10px] text-[#749094] flex items-center gap-1">
                <Mail size={9} /> {request.email_solicitante}
              </p>
              <div className="mt-2 flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-black bg-slate-100 text-[#254153] px-2 py-1 rounded-md uppercase tracking-wider">
                  {request.ticket_number}
                </span>
                <span className="text-[10px] font-black text-[#749094] uppercase tracking-widest">
                  {new Date(request.created_at).toLocaleDateString()}
                </span>
                <button 
                  onClick={onOpenDetails}
                  className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md hover:bg-indigo-100 transition-colors border border-indigo-100 ml-auto"
                  title="Expandir Detalles"
                >
                  <Maximize2 size={10} /> AMPLIAR
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <InfoItem icon={<Monitor size={12} />} label="Dispositivo" value={request.dispositivo} subValue={`Cant: ${request.cantidad}`} />
            <InfoItem icon={<Building2 size={12} />} label="C. Costos" value={request.centro_costos} />
            <InfoItem icon={<UserCheck size={12} />} label="Jefe" value={request.jefe_aprobador} />
            <InfoItem icon={<Hash size={12} />} label="Cuenta" value={request.cuenta_contable} />
          </div>
        </div>

        {/* Middle Column: Comments */}
        <div className="lg:col-span-5 space-y-2">
          <div className="rounded-lg bg-slate-50 p-2 border border-slate-100">
            <label className="flex items-center gap-1.5 text-[8px] font-black text-[#749094] uppercase tracking-widest mb-1">
              <MessageSquare size={10} /> Solicitante:
            </label>
            <p className="text-[11px] text-[#254153] italic leading-tight break-words whitespace-pre-wrap">
              {request.comentario ? `"${request.comentario}"` : 'Sin comentarios.'}
            </p>
          </div>

          <div className="space-y-1">
            <label className="flex items-center gap-2 text-[8px] font-black text-[#254153] uppercase tracking-widest">
              Comentario Admin
            </label>
            <textarea
              value={adminComment}
              onChange={(e) => setAdminComment(e.target.value)}
              placeholder="Nota técnica..."
              className="w-full h-10 rounded-lg border border-slate-200 bg-white p-1.5 text-[11px] text-[#254153] transition-all focus:border-[#254153]/30"
            />
          </div>

          <div className="space-y-1 p-1.5 rounded-lg bg-indigo-50/50 border border-indigo-100">
            <label className="flex items-center gap-2 text-[8px] font-black text-indigo-600 uppercase tracking-widest">
              <Lock size={10} /> Privado
            </label>
            <textarea
              value={privateNotes}
              onChange={(e) => setPrivateNotes(e.target.value)}
              placeholder="Notas internas..."
              className="w-full h-10 rounded-md border border-indigo-100 bg-white/50 p-1.5 text-[11px] text-[#254153] transition-all"
            />
          </div>
        </div>

        {/* Right Column: Actions */}
        <div className="lg:col-span-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-1">
              {['Pendiente', 'Aprobado', 'Rechazado', 'Completado'].map((s) => (
                <button
                  key={s}
                  onClick={() => setStatus(s)}
                  className={`flex flex-col items-center justify-center p-1 rounded-lg border-2 transition-all font-black text-[9px] uppercase tracking-tighter ${
                    status === s 
                      ? s === 'Completado'
                        ? 'border-violet-600 bg-violet-50 text-violet-700'
                        : 'border-[#254153] bg-[#254153]/5 text-[#254153]'
                      : 'border-transparent bg-slate-50 text-[#749094] hover:bg-slate-100'
                  }`}
                >
                  {s === 'Pendiente' && <Clock size={12} />}
                  {s === 'Aprobado' && <CheckCircle2 size={12} />}
                  {s === 'Rechazado' && <XCircle size={12} />}
                  {s === 'Completado' && <PackageCheck size={12} />}
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            {request.factura_url ? (
              <a 
                href={request.factura_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-2 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100 text-[9px] font-bold transition-all hover:bg-emerald-100"
              >
                <Eye size={12} /> Factura
              </a>
            ) : (
              <div className="relative">
                <input 
                  type="file" 
                  onChange={handleFileUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  disabled={uploading}
                />
                <div className={`flex items-center justify-center gap-2 px-2 py-1.5 rounded-lg border border-dashed border-slate-200 text-slate-400 text-[9px] font-bold ${uploading ? 'animate-pulse' : ''}`}>
                  {uploading ? <Loader2 size={12} className="animate-spin" /> : <FileUp size={12} />}
                  {uploading ? '...' : 'Subir'}
                </div>
              </div>
            )}
          </div>

          <button
            disabled={!hasChanges || isUpdating}
            onClick={() => onUpdate(request.id, { 
              estado: status, 
              comentario_admin: adminComment,
              notas_privadas_admin: privateNotes
            })}
            className={`mt-1.5 w-full h-8 rounded-lg flex items-center justify-center gap-2 font-black uppercase tracking-wider text-[10px] transition-all ${
              hasChanges 
                ? 'bg-[#254153] text-white shadow-lg shadow-[#254153]/20 active:scale-95' 
                : 'bg-slate-100 text-slate-300 pointer-events-none'
            }`}
          >
            {isUpdating ? (
              <Loader2 className="animate-spin" size={14} />
            ) : (
              <>
                <Save size={12} />
                <span>Guardar</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

function InfoItem({ icon, label, value, subValue }: { icon: any, label: string, value: string, subValue?: string }) {
  return (
    <div className="space-y-1">
      <span className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-tighter text-[#749094]">
        {icon} {label}
      </span>
      <p className="text-xs font-bold text-[#254153] break-words" title={value}>{value}</p>
      {subValue && <p className="text-[9px] text-[#749094] break-words">{subValue}</p>}
    </div>
  )
}

function InfoField({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  if (!value) return null
  return (
    <div className="flex flex-col gap-1">
      <span className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-[#749094]">
        {icon} {label}
      </span>
      <span className="text-xs font-bold text-[#254153] break-words">{value}</span>
    </div>
  )
}
