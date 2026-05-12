'use client'

import { useState, useEffect } from 'react'
import { MoreHorizontal, X, Save, Loader2, UserCheck, History, Wrench, CheckCircle2, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import DeviceHistoryModal from '@/components/DeviceHistoryModal'

export default function ActionMenu({ device }: { device: any }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isRepairing, setIsRepairing] = useState(false)
  const [isMarkingRepaired, setIsMarkingRepaired] = useState(false)
  const [showRepairConfirm, setShowRepairConfirm] = useState(false)
  const [showReturnConfirm, setShowReturnConfirm] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [formData, setFormData] = useState({
    num_serial: device.num_serial || '',
    referencia: device.referencia || '',
    nombre_dispositivo: device.nombre_dispositivo || '',
    precio_producto: device.precio_producto || '',
    detalle_producto: device.detalle_producto || '',
    categoria_id: device.categoria_id || '',
    nueva_categoria: ''
  })

  const [categories, setCategories] = useState<{ id: number, categoria: string }[]>([])

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function fetchCategories() {
      const { data, error } = await supabase
        .from('ti_categorias_productos')
        .select('id, categoria')
        .order('categoria', { ascending: true })
      
      if (data) setCategories(data)
      if (error) console.error('Error fetching categories:', error)
    }
    fetchCategories()
  }, [supabase])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleRepair = async () => {
    setIsRepairing(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      const { error } = await supabase
        .from('ti_historial_stock')
        .insert({
          producto_id: device.id,
          estado: 'reparacion',
          usuario: user?.email || 'Sistema',
          observaciones_tecnicas: 'Enviado a reparación desde el panel de inventario',
          observacion_salvedad: 'Cambio de estado a reparación'
        })

      if (error) throw error
      
      setShowRepairConfirm(false)
      router.refresh()
    } catch (error) {
      console.error('Error sending to repair:', error)
      alert('Error al enviar a reparación')
    } finally {
      setIsRepairing(false)
    }
  }

  const handleReturnFromRepair = async () => {
    setIsMarkingRepaired(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      const { error } = await supabase
        .from('ti_historial_stock')
        .insert({
          producto_id: device.id,
          estado: 'disponible',
          usuario: user?.email || 'Sistema',
          observaciones_tecnicas: 'Retornado de reparación - Operativo',
          observacion_salvedad: 'Equipo reparado y disponible'
        })

      if (error) throw error
      
      setShowReturnConfirm(false)
      router.refresh()
    } catch (error) {
      console.error('Error returning from repair:', error)
      alert('Error al marcar como reparado')
    } finally {
      setIsMarkingRepaired(false)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      // 1. Eliminar de ti_asignaciones_pdf (relacionado por device_id)
      const { error: pdfError } = await supabase
        .from('ti_asignaciones_pdf')
        .delete()
        .eq('device_id', device.id)
      if (pdfError) throw pdfError

      // 2. Eliminar de ti_historial_stock (relacionado por producto_id)
      const { error: historyError } = await supabase
        .from('ti_historial_stock')
        .delete()
        .eq('producto_id', device.id)
      if (historyError) throw historyError

      // 3. Finalmente eliminar el producto
      const { error } = await supabase
        .from('ti_productos')
        .delete()
        .eq('id', device.id)

      if (error) throw error
      
      setShowDeleteConfirm(false)
      router.refresh()
    } catch (error) {
      console.error('Error deleting product:', error)
      alert('No se pudo eliminar el producto por completo. Verifique si tiene dependencias adicionales.')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      let finalCategoriaId = formData.categoria_id === 'otro' ? null : (formData.categoria_id ? Number(formData.categoria_id) : null)

      // Manejar nueva categoría si se seleccionó "Otro"
      if (formData.categoria_id === 'otro' && formData.nueva_categoria.trim()) {
        const catName = formData.nueva_categoria.trim()
        
        // Verificar si ya existe
        const { data: existingCat } = await supabase
          .from('ti_categorias_productos')
          .select('id')
          .ilike('categoria', catName)
          .maybeSingle()

        if (existingCat) {
          finalCategoriaId = existingCat.id
        } else {
          // Crear la nueva categoría
          const { data: newCat, error: catError } = await supabase
            .from('ti_categorias_productos')
            .insert([{ categoria: catName }])
            .select('id')
            .single()

          if (catError) throw catError
          finalCategoriaId = newCat.id
        }
      }

      const { error } = await supabase
        .from('ti_productos')
        .update({
          num_serial: formData.num_serial,
          referencia: formData.referencia,
          nombre_dispositivo: formData.nombre_dispositivo,
          precio_producto: formData.precio_producto ? Number(formData.precio_producto) : null,
          detalle_producto: formData.detalle_producto,
          categoria_id: finalCategoriaId
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
      <div className="flex items-center justify-end gap-1.5">
        {device.latest_estado === 'reparacion' ? (
          <button 
            onClick={() => setShowReturnConfirm(true)}
            disabled={isMarkingRepaired}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-emerald-600 bg-emerald-50 transition-all hover:bg-emerald-100"
            title="Marcar como Reparado"
          >
            {isMarkingRepaired ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
          </button>
        ) : (
          <button 
            onClick={() => setShowRepairConfirm(true)}
            disabled={isRepairing || device.latest_estado === 'reparacion'}
            className={`flex h-7 w-7 items-center justify-center rounded-lg transition-all ${
              device.latest_estado === 'reparacion' 
                ? 'text-rose-400 bg-rose-50 cursor-not-allowed opacity-50' 
                : 'text-[#749094] hover:bg-rose-50 hover:text-rose-600'
            }`}
            title="Mandar a Reparación"
          >
            {isRepairing ? <Loader2 size={16} className="animate-spin" /> : <Wrench size={16} />}
          </button>
        )}
        <button 
          onClick={() => setIsHistoryOpen(true)}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-[#749094] transition-all hover:bg-[#749094]/10 hover:text-[#254153]"
          title="Ver historial de asignaciones"
        >
          <History size={16} />
        </button>
        <Link 
          href={`/dashboard/inventory/assign?device_id=${device.id}`}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-[#749094] transition-all hover:bg-[#749094]/10 hover:text-[#254153]"
          title="Generar Acta de Asignación"
        >
          <UserCheck size={16} />
        </Link>
        <button 
          onClick={() => setIsOpen(true)}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-[#749094] transition-all hover:bg-[#749094]/10 hover:text-[#254153]"
          title="Editar producto"
        >
          <MoreHorizontal size={16} />
        </button>
        <button 
          onClick={() => setShowDeleteConfirm(true)}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-rose-300 transition-all hover:bg-rose-50 hover:text-rose-600"
          title="Eliminar producto"
        >
          <Trash2 size={16} />
        </button>
      </div>

      <DeviceHistoryModal 
        deviceId={device.id}
        deviceName={device.nombre_dispositivo}
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
      />

      {/* Custom Repair Confirmation Modal */}
      {showRepairConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
           <div 
            className="absolute inset-0 bg-[#254153]/40 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={() => !isRepairing && setShowRepairConfirm(false)}
           />
           <div className="relative w-full max-w-sm overflow-hidden rounded-[2.5rem] bg-white p-8 shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="mb-6 flex justify-center">
                 <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
                    <Wrench size={32} />
                 </div>
              </div>
              <h3 className="mb-2 text-center text-lg font-black text-[#254153]">Confirmar Reparación</h3>
              <p className="mb-8 text-center text-sm text-[#749094] leading-relaxed">
                ¿Estás seguro de mandar el dispositivo <span className="font-bold text-[#254153]">"{device.num_serial || device.nombre_dispositivo}"</span> a reparación?
              </p>
              <div className="flex flex-col gap-3">
                 <button
                    onClick={handleRepair}
                    disabled={isRepairing}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#254153] py-3 text-sm font-bold text-white transition-all hover:bg-[#1a2e3b] active:scale-95 disabled:opacity-50"
                 >
                    {isRepairing ? <Loader2 size={18} className="animate-spin" /> : 'Confirmar Envío'}
                 </button>
                 <button
                    onClick={() => setShowRepairConfirm(false)}
                    disabled={isRepairing}
                    className="w-full rounded-2xl bg-slate-50 py-3 text-sm font-bold text-[#749094] transition-all hover:bg-slate-100 active:scale-95 disabled:opacity-50"
                 >
                    Cancelar
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* Custom Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
           <div 
            className="absolute inset-0 bg-[#254153]/40 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={() => !isDeleting && setShowDeleteConfirm(false)}
           />
           <div className="relative w-full max-w-sm overflow-hidden rounded-[2.5rem] bg-white p-8 shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="mb-6 flex justify-center">
                 <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
                    <Trash2 size={32} />
                 </div>
              </div>
              <h3 className="mb-2 text-center text-lg font-black text-[#254153]">Eliminar Producto</h3>
              <p className="mb-8 text-center text-sm text-[#749094] leading-relaxed">
                ¿Estás completamente seguro de eliminar el producto <span className="font-bold text-[#254153]">"{device.num_serial || device.nombre_dispositivo}"</span>?<br/>
                <span className="text-xs text-rose-500 font-bold uppercase tracking-tighter mt-2 block">Esta acción no se puede deshacer.</span>
              </p>
              <div className="flex flex-col gap-3">
                 <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-rose-600 py-3 text-sm font-bold text-white transition-all hover:bg-rose-700 active:scale-95 disabled:opacity-50"
                 >
                    {isDeleting ? <Loader2 size={18} className="animate-spin" /> : 'Sí, Eliminar Permanentemente'}
                 </button>
                 <button
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={isDeleting}
                    className="w-full rounded-2xl bg-slate-50 py-3 text-sm font-bold text-[#749094] transition-all hover:bg-slate-100 active:scale-95 disabled:opacity-50"
                 >
                    Cancelar
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* Custom Return from Repair Confirmation Modal */}
      {showReturnConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
           <div 
            className="absolute inset-0 bg-[#254153]/40 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={() => !isMarkingRepaired && setShowReturnConfirm(false)}
           />
           <div className="relative w-full max-w-sm overflow-hidden rounded-[2.5rem] bg-white p-8 shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="mb-6 flex justify-center">
                 <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                    <CheckCircle2 size={32} />
                 </div>
              </div>
              <h3 className="mb-2 text-center text-lg font-black text-[#254153]">¿Equipo Reparado?</h3>
              <p className="mb-8 text-center text-sm text-[#749094] leading-relaxed">
                ¿Deseas marcar el dispositivo <span className="font-bold text-[#254153]">"{device.num_serial || device.nombre_dispositivo}"</span> como reparado y ponerlo disponible en inventario?
              </p>
              <div className="flex flex-col gap-3">
                 <button
                    onClick={handleReturnFromRepair}
                    disabled={isMarkingRepaired}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3 text-sm font-bold text-white transition-all hover:bg-emerald-700 active:scale-95 disabled:opacity-50"
                 >
                    {isMarkingRepaired ? <Loader2 size={18} className="animate-spin" /> : 'Sí, está listo'}
                 </button>
                 <button
                    onClick={() => setShowReturnConfirm(false)}
                    disabled={isMarkingRepaired}
                    className="w-full rounded-2xl bg-slate-50 py-3 text-sm font-bold text-[#749094] transition-all hover:bg-slate-100 active:scale-95 disabled:opacity-50"
                 >
                    Cancelar
                 </button>
              </div>
           </div>
        </div>
      )}

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
                    className="w-full rounded-lg border border-[#749094]/20 bg-[#749094]/5 px-3 py-2 text-sm text-[#254153] placeholder:text-[#749094]/50 focus:border-[#254153]/30 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#254153]/5"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#749094]">Referencia</label>
                  <input 
                    name="referencia"
                    value={formData.referencia}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-[#749094]/20 bg-[#749094]/5 px-3 py-2 text-sm text-[#254153] placeholder:text-[#749094]/50 focus:border-[#254153]/30 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#254153]/5"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#749094]">Dispositivo</label>
                <input 
                  name="nombre_dispositivo"
                  value={formData.nombre_dispositivo}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-[#749094]/20 bg-[#749094]/5 px-3 py-2 text-sm text-[#254153] placeholder:text-[#749094]/50 focus:border-[#254153]/30 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#254153]/5"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#749094]">Precio</label>
                <input 
                  type="number"
                  name="precio_producto"
                  value={formData.precio_producto}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-[#749094]/20 bg-[#749094]/5 px-3 py-2 text-sm text-[#254153] placeholder:text-[#749094]/50 focus:border-[#254153]/30 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#254153]/5"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#749094]">Categoría</label>
                <select
                  name="categoria_id"
                  value={formData.categoria_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, categoria_id: e.target.value }))}
                  className="w-full rounded-lg border border-[#749094]/20 bg-[#749094]/5 px-3 py-2 text-sm text-[#254153] focus:border-[#254153]/30 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#254153]/5"
                >
                  <option value="">Seleccionar categoría...</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.categoria}
                    </option>
                  ))}
                  <option value="otro">+ Otra categoría...</option>
                </select>

                {formData.categoria_id === 'otro' && (
                  <div className="mt-3 space-y-1 animate-in fade-in slide-in-from-top-2 duration-300">
                    <label className="text-xs font-semibold text-[#749094]">Nombre de la nueva categoría *</label>
                    <input 
                      required
                      name="nueva_categoria"
                      value={formData.nueva_categoria}
                      onChange={(e) => setFormData(prev => ({ ...prev, nueva_categoria: e.target.value }))}
                      type="text" 
                      placeholder="Ej. Tablets"
                      className="w-full rounded-xl border border-[#749094]/20 bg-[#749094]/5 px-4 py-2.5 text-sm transition-all focus:border-[#254153]/30 focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#254153]/5"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#749094]">Detalle</label>
                <textarea 
                  name="detalle_producto"
                  value={formData.detalle_producto}
                  onChange={handleChange}
                  rows={3}
                  className="w-full rounded-lg border border-[#749094]/20 bg-[#749094]/5 px-3 py-2 text-sm text-[#254153] placeholder:text-[#749094]/50 focus:border-[#254153]/30 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#254153]/5"
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
