'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Filter, X, ChevronDown } from 'lucide-react'
import { useState } from 'react'

export default function FilterPanel() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isOpen, setIsOpen] = useState(false)

  const currentStatus = searchParams.get('status') || ''

  const setFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    router.push(`?${params.toString()}`)
  }

  const clearFilters = () => {
    router.push('?')
    setIsOpen(false)
  }

  const statusOptions = [
    { label: 'Todos', value: '' },
    { label: 'Asignados', value: 'asignado' },
    { label: 'Disponibles', value: 'disponible' },
    { label: 'Sin Registro', value: 'Sin Registro' },
  ]

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-center gap-2 rounded-2xl border border-[#749094]/20 px-4 py-3 text-sm font-semibold shadow-sm transition-all hover:bg-[#749094]/5 ${
          currentStatus ? 'bg-[#254153] text-white' : 'bg-white text-[#749094] hover:text-[#254153]'
        }`}
      >
        <Filter size={18} />
        {currentStatus ? `Estado: ${currentStatus}` : 'Filtros'}
        <ChevronDown size={14} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full z-20 mt-2 w-64 origin-top-right rounded-2xl border border-[#749094]/10 bg-white p-4 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#749094]">Filtrar por Estado</span>
              {currentStatus && (
                <button 
                  onClick={clearFilters}
                  className="text-[10px] font-bold text-[#254153] hover:underline"
                >
                  Limpiar
                </button>
              )}
            </div>
            
            <div className="space-y-1">
              {statusOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    setFilter('status', opt.value)
                    setIsOpen(false)
                  }}
                  className={`w-full rounded-xl px-3 py-2 text-left text-sm transition-colors ${
                    currentStatus === opt.value 
                      ? 'bg-[#254153] font-bold text-white' 
                      : 'text-[#749094] hover:bg-[#749094]/5 hover:text-[#254153]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <div className="mt-4 border-t border-[#749094]/10 pt-3">
              <button
                onClick={() => setIsOpen(false)}
                className="w-full rounded-xl bg-[#749094]/5 py-2 text-xs font-bold text-[#749094] transition-colors hover:bg-[#749094]/10 hover:text-[#254153]"
              >
                Cerrar
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
