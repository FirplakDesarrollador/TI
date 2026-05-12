'use client'

import Link from 'next/link'
import { ArrowLeft, Save, PackagePlus, Loader2 } from 'lucide-react'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function AddProduct() {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    num_serial: '',
    referencia: '',
    nombre_dispositivo: '',
    precio_producto: '',
    detalle_producto: '',
    categoria_id: '',
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      let finalCategoriaId = formData.categoria_id === 'otro' ? null : (formData.categoria_id ? Number(formData.categoria_id) : null)

      // Manejar nueva categoría si se seleccionó "Otro"
      if (formData.categoria_id === 'otro' && formData.nueva_categoria.trim()) {
        const catName = formData.nueva_categoria.trim()
        
        // Verificar si ya existe para evitar duplicados
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

      // 1. Insert product
      const { data: productData, error: productError } = await supabase
        .from('ti_productos')
        .insert([{
          num_serial: formData.num_serial || null,
          referencia: formData.referencia || null,
          nombre_dispositivo: formData.nombre_dispositivo,
          precio_producto: formData.precio_producto ? Number(formData.precio_producto) : null,
          detalle_producto: formData.detalle_producto || null,
          categoria_id: finalCategoriaId,
        }])
        .select('id')
        .single()

      if (productError) throw productError

      // 2. Insert initial history record as 'disponible'
      const { data: { user } } = await supabase.auth.getUser()
      const userEmail = user?.email || 'sistema@nexus.com'

      const { error: historyError } = await supabase
        .from('ti_historial_stock')
        .insert([{
          producto_id: productData.id,
          estado: 'disponible',
          usuario: userEmail,
          observaciones_tecnicas: 'Ingreso inicial al inventario',
          observacion_salvedad: 'Nuevo producto'
        }])

      if (historyError) throw historyError

      router.push('/dashboard/inventory/list')
      router.refresh()
    } catch (error) {
      console.error('Error saving product:', error)
      alert('Error al guardar el producto. Por favor intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white p-2 md:p-4 font-sans text-[#254153]">
      <div className="mx-auto max-w-2xl">
        <header className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link 
              href="/dashboard/inventory/list"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-[#749094] shadow-sm ring-1 ring-[#749094]/20 transition-all hover:text-[#254153] hover:ring-[#749094]/40"
            >
              <ArrowLeft size={18} />
            </Link>
            <h1 className="text-xl font-black text-[#254153]">Ingresar Producto</h1>
          </div>
        </header>

        <div className="overflow-hidden rounded-3xl border border-[#749094]/10 bg-white shadow-xl shadow-[#749094]/5">
          <div className="border-b border-[#749094]/5 bg-[#749094]/5 px-4 py-2">
            <div className="flex items-center gap-3 text-[#254153]">
              <PackagePlus size={18} />
              <span className="text-sm font-black uppercase tracking-tight">Nuevo Producto</span>
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="p-4 space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-[#749094] uppercase tracking-tighter">Nombre del Dispositivo *</label>
                <input 
                  required
                  name="nombre_dispositivo"
                  value={formData.nombre_dispositivo}
                  onChange={handleChange}
                  type="text" 
                  placeholder="Ej. Servidor Dell R740"
                  className="w-full rounded-lg border border-[#749094]/20 bg-[#749094]/5 px-3 py-1.5 text-[12px] transition-all focus:border-[#254153]/30 focus:bg-white focus:outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-[#749094]">Número de Serial</label>
                <input 
                  name="num_serial"
                  value={formData.num_serial}
                  onChange={handleChange}
                  type="text" 
                  placeholder="Ej. ABC123XYZ"
                  className="w-full rounded-xl border border-[#749094]/20 bg-[#749094]/5 px-4 py-3 text-sm transition-all focus:border-[#254153]/30 focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#254153]/5"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-[#749094]">Referencia</label>
                <input 
                  name="referencia"
                  value={formData.referencia}
                  onChange={handleChange}
                  type="text" 
                  placeholder="Ej. PowerEdge R740"
                  className="w-full rounded-xl border border-[#749094]/20 bg-[#749094]/5 px-4 py-3 text-sm transition-all focus:border-[#254153]/30 focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#254153]/5"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-[#749094]">Precio</label>
                <input 
                  name="precio_producto"
                  value={formData.precio_producto}
                  onChange={handleChange}
                  type="number" 
                  placeholder="0.00"
                  className="w-full rounded-xl border border-[#749094]/20 bg-[#749094]/5 px-4 py-3 text-sm transition-all focus:border-[#254153]/30 focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#254153]/5"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-[#749094]">Categoría *</label>
                <select
                  required
                  name="categoria_id"
                  value={formData.categoria_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, categoria_id: e.target.value }))}
                  className="w-full rounded-xl border border-[#749094]/20 bg-[#749094]/5 px-4 py-3 text-sm transition-all focus:border-[#254153]/30 focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#254153]/5"
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
                  <div className="mt-4 space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                    <label className="text-sm font-semibold text-[#749094]">Nombre de la nueva categoría *</label>
                    <input 
                      required
                      name="nueva_categoria"
                      value={formData.nueva_categoria}
                      onChange={handleChange}
                      type="text" 
                      placeholder="Ej. Accesorios de Red"
                      className="w-full rounded-xl border border-[#749094]/20 bg-[#749094]/5 px-4 py-3 text-sm transition-all focus:border-[#254153]/30 focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#254153]/5"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-[#749094]">Descripción / Detalles</label>
              <textarea 
                name="detalle_producto"
                value={formData.detalle_producto}
                onChange={handleChange}
                rows={4}
                placeholder="Detalles adicionales del producto..."
                className="w-full rounded-xl border border-[#749094]/20 bg-[#749094]/5 px-4 py-3 text-sm transition-all focus:border-[#254153]/30 focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#254153]/5"
              ></textarea>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#254153] px-6 py-2.5 text-[12px] font-black uppercase tracking-widest text-white shadow-lg shadow-[#254153]/20 transition-all hover:bg-[#1a2e3b] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                {loading ? 'Guardando...' : 'Guardar Producto'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

