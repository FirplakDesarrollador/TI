'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { ChevronDown, Check } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'

interface ColumnFilterProps {
  title: string
  paramKey: string
  options: { label: string; value: string }[]
}

export default function ColumnFilter({ title, paramKey, options }: ColumnFilterProps) {
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const dropdownRef = useRef<HTMLDivElement>(null)

  const currentValue = searchParams.get(paramKey) || ''

  const setFilter = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    // Keep fixed params if needed, but for now we just handle this key
    if (value) {
      params.set(paramKey, value)
    } else {
      params.delete(paramKey)
    }
    router.push(`?${params.toString()}`)
    setIsOpen(false)
  }

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <button 
        onClick={(e) => {
          e.preventDefault()
          setIsOpen(!isOpen)
        }}
        className={`flex items-center gap-1.5 transition-colors hover:text-[#254153] ${
          currentValue ? 'text-[#254153]' : 'text-[#749094]'
        }`}
      >
        <span className="uppercase tracking-wider">{title}</span>
        <ChevronDown size={12} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        {currentValue && (
          <div className="absolute -right-2 top-0 h-1.5 w-1.5 rounded-full bg-[#254153]" title="Filtro activo" />
        )}
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full z-50 mt-2 min-w-[160px] overflow-hidden rounded-xl border border-[#749094]/10 bg-white py-1 shadow-2xl animate-in fade-in zoom-in-95 duration-100 text-left">
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setFilter(opt.value)}
              className="flex w-full items-center justify-between px-4 py-2.5 text-left text-xs transition-colors hover:bg-[#749094]/5"
            >
              <span className={currentValue === opt.value ? 'font-bold text-[#254153]' : 'text-[#749094]'}>
                {opt.label}
              </span>
              {currentValue === opt.value && <Check size={14} className="text-[#254153]" strokeWidth={3} />}
            </button>
          ))}
          {currentValue && (
            <button
              onClick={() => setFilter('')}
              className="mt-1 w-full border-t border-[#749094]/5 px-4 py-2 text-left text-[10px] font-bold text-[#254153] transition-colors hover:bg-[#749094]/5"
            >
              Limpiar filtro
            </button>
          )}
        </div>
      )}
    </div>
  )
}
