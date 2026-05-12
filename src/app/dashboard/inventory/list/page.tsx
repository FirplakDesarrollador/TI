export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { ArrowLeft, Filter, PackageOpen } from 'lucide-react'
import { createServerSupabaseClient } from '@/lib/supabase'
import ActionMenu from './ActionMenu'
import SearchInput from './SearchInput'
import ColumnFilter from './ColumnFilter'

export default async function InventoryList({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; priceRange?: string }>
}) {
  // Resolver searchParams de forma segura y evitar el string "undefined"
  const params = await (searchParams || {})
  const q = params?.q || ''
  const searchTerm = q === 'undefined' ? '' : q
  const statusFilter = (params?.status === 'undefined' ? '' : params?.status) || ''
  const priceRangeFilter = (params?.priceRange === 'undefined' ? '' : params?.priceRange) || ''

  const supabase = await createServerSupabaseClient()
  
  // Consulta simplificada para depuración
  let query = supabase
    .from('ti_productos')
    .select('*, ti_historial_stock(estado, created_at), ti_categorias_productos(categoria)')

  // Solo aplicar búsqueda si realmente hay un término válido
  if (searchTerm.trim() !== '') {
    query = query.or(`num_serial.ilike.%${searchTerm}%,referencia.ilike.%${searchTerm}%,nombre_dispositivo.ilike.%${searchTerm}%`)
  }

  // Ejecutar consulta con ordenamiento
  const { data: devices, error: fetchError } = await query.order('created_at', { ascending: false })

  if (fetchError) {
    console.error('DEBUG - Error fetching inventory:', fetchError)
  }

  // Procesar datos de forma segura
  const products = (devices || []).map((p: any) => {
    const history = p.ti_historial_stock || []
    // Tomar el último estado disponible
    const latestHistory = history.length > 0 
      ? [...history].sort((a: any, b: any) => {
          const dateA = a.created_at ? new Date(a.created_at).getTime() : 0
          const dateB = b.created_at ? new Date(b.created_at).getTime() : 0
          return dateB - dateA
        })[0]
      : null
    
    const currentStatus = latestHistory?.estado || 'Sin Registro'
    const lastUpdate = latestHistory 
      ? new Date(latestHistory.created_at).getTime() 
      : new Date(p.created_at || 0).getTime()
    
    return {
      ...p,
      latest_estado: currentStatus,
      last_update_ts: lastUpdate
    }
  })
  .sort((a: any, b: any) => (b.last_update_ts || 0) - (a.last_update_ts || 0))
  .filter((p: any) => {
    // Filtros opcionales
    if (statusFilter && statusFilter !== '' && p.latest_estado !== statusFilter) return false
    
    if (priceRangeFilter && priceRangeFilter !== '') {
      const price = Number(p.precio_producto) || 0
      if (priceRangeFilter === 'low') return price < 1000000
      if (priceRangeFilter === 'medium') return price >= 1000000 && price <= 5000000
      if (priceRangeFilter === 'high') return price > 5000000
    }
    
    return true
  })

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-2 md:p-4 font-sans text-[#254153]">
      <div className="mx-auto w-full px-2">
        <header className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link 
              href="/dashboard"
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-[#749094] shadow-sm ring-1 ring-[#749094]/10 transition-all hover:text-[#254153] hover:shadow-md"
            >
              <ArrowLeft size={18} />
            </Link>
            <div>
            <h1 className="text-base font-black text-[#254153] tracking-tight leading-none uppercase">Inventario</h1>
            <p className="text-[9px] font-bold text-[#749094] uppercase tracking-widest mt-0.5">Control de activos</p>
          </div>
        </div>
        
        <Link
          href="/dashboard/inventory/add"
          className="hidden items-center gap-2 rounded-lg bg-[#254153] px-3 py-1.5 text-[11px] font-black uppercase tracking-widest text-white shadow-lg shadow-[#254153]/20 transition-all hover:bg-[#1a2e3b] sm:flex"
        >
            <PackageOpen size={16} />
            Nuevo
          </Link>
        </header>

        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 items-center gap-3">
            <SearchInput />
            <div className="flex items-center gap-2">
              {(statusFilter || priceRangeFilter || searchTerm) && (
                <Link
                  href="/dashboard/inventory/list"
                  className="flex items-center gap-2 rounded-lg border border-red-100 bg-red-50 px-3 py-1.5 text-[11px] font-black uppercase tracking-widest text-red-600 transition-all hover:bg-red-100"
                >
                  <PackageOpen size={16} />
                  Limpiar
                </Link>
              )}
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-[1rem] border border-slate-200 bg-white shadow-xl shadow-slate-200/50">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-[8px] font-black uppercase tracking-widest text-[#749094]">
                  <th className="px-2 py-1.5">Serial</th>
                  <th className="px-2 py-1.5">Equipo</th>
                  <th className="px-2 py-1.5 text-center">Categoría</th>
                  <th className="px-2 py-1.5 text-center">Precio</th>
                  <th className="px-2 py-1.5 text-center">Estado</th>
                  <th className="hidden px-2 py-1.5 xl:table-cell">Detalle</th>
                  <th className="px-2 py-1.5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[13px]">
                {products.map((device: any) => (
                  <tr key={device.id} className="group transition-colors hover:bg-slate-50/50">
                    <td className="whitespace-nowrap px-2 py-0.5 font-bold text-[#254153]">
                      <span className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[8px] text-[#254153]">
                        {device.num_serial || 'S/N'}
                      </span>
                    </td>
                    <td className="px-2 py-0.5">
                      <div className="flex flex-col gap-0">
                        <span className="font-bold text-[#254153] line-clamp-1 leading-none text-[11px]">{device.nombre_dispositivo}</span>
                        <span className="text-[8px] text-[#749094] line-clamp-1 leading-none mt-0.5">{device.referencia || '—'}</span>
                      </div>
                    </td>
                    <td className="px-2 py-0.5 text-center">
                      <span className="inline-flex rounded bg-[#254153]/5 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-tight text-[#254153] ring-1 ring-[#254153]/10">
                        {device.ti_categorias_productos?.categoria || 'N/A'}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-2 py-0.5 text-center font-bold text-[#254153] text-[11px]">
                      {device.precio_producto ? `$${Number(device.precio_producto).toLocaleString()}` : '—'}
                    </td>
                    <td className="px-2 py-0.5 text-center">
                      <span className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[8px] font-black uppercase tracking-tight ${
                        device.latest_estado === 'asignado' ? 'bg-amber-100 text-amber-700' :
                        device.latest_estado === 'reparacion' ? 'bg-rose-100 text-rose-700' :
                        device.latest_estado === 'Sin Registro' ? 'bg-slate-100 text-slate-500' :
                        'bg-emerald-100 text-emerald-700'
                      }`}>
                        <span className={`h-1 w-1 rounded-full ${
                          device.latest_estado === 'asignado' ? 'bg-amber-500' :
                          device.latest_estado === 'reparacion' ? 'bg-rose-500' :
                          device.latest_estado === 'Sin Registro' ? 'bg-slate-400' :
                          'bg-emerald-500'
                        }`} />
                        {device.latest_estado === 'reparacion' ? 'Rep' : device.latest_estado}
                      </span>
                    </td>
                    <td className="hidden max-w-[120px] px-2 py-0.5 xl:table-cell">
                      <p className="truncate text-[8px] text-[#749094]/80" title={device.detalle_producto}>
                        {device.detalle_producto || '—'}
                      </p>
                    </td>
                    <td className="px-2 py-0.5 text-right">
                      <ActionMenu device={device} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {products.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <PackageOpen size={48} className="mb-4 text-[#749094]/20" />
              <p className="text-[#749094]">No hay productos registrados en ti_productos.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
