'use client'

import { useState } from 'react'
import { MoreHorizontal, X, Save, Loader2, UserCheck, History } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import DeviceHistoryModal from '@/components/DeviceHistoryModal'

export default function ActionMenu({ device }: { device: any }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    num_serial: device.num_serial || '',
    referencia: device.referencia || '',
    nombre_dispositivo: device.nombre_dispositivo || '',
    precio_producto: device.precio_producto || '',
    detalle_producto: device.detalle_producto || ''
  })
  
  const router = useRouter()
  const supabase = createClient()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      const { error } = await supabase
        .from('ti_productos')
        .update({
          num_serial: formData.num_serial,
          referencia: formData.referencia,
          nombre_dispositivo: formData.nombre_dispositivo,
          precio_producto: formData.precio_producto ? Number(formData.precio_producto) : null,
          detalle_producto: formData.detalle_producto
        })
        .eq('id', device.id)

      if (error) throw error

      setIsOpen(false)
      router.refresh()
    } catch (error) {
      console.error('Error updating product:', error)
      alert('Error al actualizar el producto')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <div className="flex items-center justify-end gap-3">
        <button 
          onClick={() => setIsHistoryOpen(true)}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-[#749094] transition-all hover:bg-[#749094]/10 hover:text-[#254153]"
          title="Ver historial de asignaciones"
        >
          <History size={18} />
        </button>
        <Link 
          href={`/dashboard/inventory/assign?device_id=${device.id}`}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-[#749094] transition-all hover:bg-[#749094]/10 hover:text-[#254153]"
          title="Generar Acta de Asignación"
        >
          <UserCheck size={18} />
        </Link>
        <button 
          onClick={() => setIsOpen(true)}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-[#749094] transition-all hover:bg-[#749094]/10 hover:text-[#254153]"
          title="Editar producto"
        >
          <MoreHorizontal size={18} />
        </button>
      </div>

      <DeviceHistoryModal 
        deviceId={device.id}
        deviceName={device.nombre_dispositivo}
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
      />

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#254153]/50 p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl text-left border border-[#749094]/10">
            <div className="flex items-center justify-between border-b border-[#749094]/5 bg-[#749094]/5 px-6 py-4">
              <h2 className="text-lg font-bold text-[#254153]">Editar Producto</h2>
              <button 
                onClick={() => setIsOpen(false)}
                className="rounded-full p-2 text-[#749094] hover:bg-[#749094]/10 hover:text-[#254153] transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#749094]">Serial</label>
                  <input 
                    name="num_serial"
                    value={formData.num_serial}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-[#749094]/20 bg-[#749094]/5 px-3 py-2 text-sm focus:border-[#254153]/30 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#254153]/5"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#749094]">Referencia</label>
                  <input 
                    name="referencia"
                    value={formData.referencia}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-[#749094]/20 bg-[#749094]/5 px-3 py-2 text-sm focus:border-[#254153]/30 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#254153]/5"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#749094]">Dispositivo</label>
                <input 
                  name="nombre_dispositivo"
                  value={formData.nombre_dispositivo}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-[#749094]/20 bg-[#749094]/5 px-3 py-2 text-sm focus:border-[#254153]/30 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#254153]/5"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#749094]">Precio</label>
                <input 
                  type="number"
                  name="precio_producto"
                  value={formData.precio_producto}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-[#749094]/20 bg-[#749094]/5 px-3 py-2 text-sm focus:border-[#254153]/30 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#254153]/5"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#749094]">Detalle</label>
                <textarea 
                  name="detalle_producto"
                  value={formData.detalle_producto}
                  onChange={handleChange}
                  rows={3}
                  className="w-full rounded-lg border border-[#749094]/20 bg-[#749094]/5 px-3 py-2 text-sm focus:border-[#254153]/30 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#254153]/5"
                />
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-[#749094]/10">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="rounded-lg px-4 py-2.5 text-sm font-semibold text-[#749094] hover:bg-[#749094]/10 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 rounded-lg bg-[#254153] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#1a2e3b] transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
