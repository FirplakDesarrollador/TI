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
  const queryParams = await searchParams
  const searchTerm = queryParams.q
  const statusFilter = queryParams.status
  const priceRangeFilter = queryParams.priceRange
  const supabase = await createServerSupabaseClient()
  
  // Fetch products with their historical status ordered by latest first
  let query = supabase
    .from('ti_productos')
    .select(`
      *,
      ti_historial_stock (
        estado,
        created_at
      )
    `)

  if (searchTerm) {
    query = query.or(`num_serial.ilike.%${searchTerm}%,referencia.ilike.%${searchTerm}%,nombre_dispositivo.ilike.%${searchTerm}%,detalle_producto.ilike.%${searchTerm}%`)
  }

  const { data: devices, error } = await query
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching inventory:', error)
  }

  const products = (devices || []).map((p: any) => {
    // Take the most recent historical status
    const latestHistory = p.ti_historial_stock?.sort((a: any, b: any) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )[0]
    
    // If we have history, use that status, otherwise "disponible" (assuming no history means available)
    const currentStatus = latestHistory?.estado || 'Sin Registro'
    
    // Determine the "last updated" date for sorting (Latest of creation or history)
    const lastUpdate = latestHistory 
      ? new Date(latestHistory.created_at).getTime() 
      : new Date(p.created_at).getTime()
    
    return {
      ...p,
      latest_estado: currentStatus,
      last_update_ts: lastUpdate
    }
  }).sort((a: any, b: any) => b.last_update_ts - a.last_update_ts)
    .filter((p: any) => {
    // Apply status filter
    if (statusFilter && p.latest_estado !== statusFilter) return false
    
    // Apply price filter
    if (priceRangeFilter) {
      const price = Number(p.precio_producto) || 0
      if (priceRangeFilter === 'low' && price >= 1000000) return false
      if (priceRangeFilter === 'medium' && (price < 1000000 || price > 5000000)) return false
      if (priceRangeFilter === 'high' && price <= 5000000) return false
    }
    
    return true
  })

  return (
    <div className="min-h-screen bg-white p-8 font-sans text-[#254153]">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link 
              href="/dashboard"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#749094] shadow-sm ring-1 ring-[#749094]/20 transition-all hover:text-[#254153] hover:ring-[#749094]/40"
            >
              <ArrowLeft size={20} />
            </Link>
            <h1 className="text-2xl font-bold text-[#254153]">Productos en Inventario</h1>
          </div>
          
          <Link
            href="/dashboard/inventory/add"
            className="hidden rounded-xl bg-[#254153] px-5 py-2.5 text-sm font-bold text-white transition-all hover:bg-[#1a2e3b] sm:block"
          >
            + Nuevo Producto
          </Link>
        </header>

        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 items-center gap-3">
            <SearchInput />
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-2 rounded-xl border border-[#749094]/20 bg-white px-4 py-2.5 text-sm font-semibold text-[#254153] shadow-sm transition-all hover:bg-[#749094]/5">
                <Filter size={18} className="text-[#749094]" />
                Filtrar
              </button>
              {(statusFilter || priceRangeFilter || searchTerm) && (
                <Link
                  href="/dashboard/inventory/list"
                  className="flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 transition-all hover:bg-red-100"
                >
                  <PackageOpen size={18} />
                  Limpiar Filtros
                </Link>
              )}
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-3xl border border-[#749094]/10 bg-white shadow-xl shadow-[#749094]/5">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[#749094]/10 bg-[#749094]/5 text-xs font-bold uppercase tracking-wider text-[#749094]">
                  <th className="px-6 py-4 text-left">Serial</th>
                  <th className="px-6 py-4 text-left">Referencia</th>
                  <th className="px-6 py-4">Dispositivo</th>
                  <th className="px-6 py-4">
                    <ColumnFilter 
                      title="Precio" 
                      paramKey="priceRange" 
                      options={[
                        { label: 'Cualquiera', value: '' },
                        { label: 'Menos de $1M', value: 'low' },
                        { label: '$1M - $5M', value: 'medium' },
                        { label: 'Más de $5M', value: 'high' }
                      ]} 
                    />
                  </th>
                  <th className="px-6 py-4">
                    <ColumnFilter 
                      title="Estado" 
                      paramKey="status" 
                      options={[
                        { label: 'Todos', value: '' },
                        { label: 'Asignados', value: 'asignado' },
                        { label: 'Disponibles', value: 'disponible' },
                        { label: 'Sin Registro', value: 'Sin Registro' }
                      ]} 
                    />
                  </th>
                  <th className="px-6 py-4 text-left">Detalle</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#749094]/10 text-sm">
                {products.map((device: any) => (
                  <tr key={device.id} className="transition-colors hover:bg-[#749094]/5">
                    <td className="px-6 py-4 font-semibold text-[#254153]">
                      {device.num_serial || 'Sin Serial'}
                    </td>
                    <td className="px-6 py-4 text-[#749094] font-medium">
                      {device.referencia || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-[#749094] font-medium">
                      {device.nombre_dispositivo}
                    </td>
                    <td className="px-6 py-4 text-[#749094]">
                      {device.precio_producto ? `$${Number(device.precio_producto).toLocaleString()}` : 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${
                        device.latest_estado === 'asignado' ? 'bg-amber-50 text-amber-600' :
                        device.latest_estado === 'Sin Registro' ? 'bg-[#749094]/10 text-[#749094]' :
                        'bg-emerald-50 text-emerald-600'
                      }`}>
                        {device.latest_estado}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-[#749094]/80 max-w-xs truncate">{device.detalle_producto || 'Sin detalle'}</td>
                    <td className="px-6 py-4 text-right">
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
