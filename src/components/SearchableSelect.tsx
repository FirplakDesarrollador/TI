'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Search, ChevronDown, Check, X } from 'lucide-react'

interface Option {
  id: string | number
  label: string
  sublabel?: string
}

interface SearchableSelectProps {
  options: Option[]
  placeholder: string
  label: string
  value: string | number
  onChange: (value: string | number) => void
  required?: boolean
  disabled?: boolean
  icon?: React.ReactNode
  className?: string
}

export function SearchableSelect({
  options,
  placeholder,
  label,
  value,
  onChange,
  required = false,
  disabled = false,
  icon,
  className
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  const selectedOption = options.find(opt => opt.id.toString() === value.toString())

  const filteredOptions = options.filter(opt =>
    opt.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (opt.sublabel && opt.sublabel.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="space-y-2" ref={containerRef}>
      <label className="text-sm font-bold text-[#254153] flex items-center gap-2">
        {icon && <span className="text-[#749094]">{icon}</span>}
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      <div className="relative">
        <button
          type="button"
          disabled={disabled}
          onClick={() => setIsOpen(!isOpen)}
          className={className || `w-full flex items-center justify-between rounded-xl border border-[#749094]/20 bg-[#749094]/5 px-4 py-3 text-sm transition-all focus:border-[#254153]/30 focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#254153]/5 ${
            disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
          }`}
        >
          <span className={selectedOption ? 'text-[#254153] font-medium' : 'text-[#749094]/50'}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronDown
            size={18}
            className={`text-[#749094] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {isOpen && (
          <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-2xl border border-[#749094]/10 bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="sticky top-0 bg-white p-3 border-b border-[#749094]/5">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#749094]/50" size={16} />
                <input
                  autoFocus
                  type="text"
                  placeholder="Buscar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-lg border border-[#749094]/10 bg-[#749094]/5 py-2 pl-10 pr-4 text-xs focus:border-[#254153]/30 focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <div className="max-h-60 overflow-y-auto p-1 custom-scrollbar">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => {
                      onChange(option.id)
                      setIsOpen(false)
                      setSearchTerm('')
                    }}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-[#254153]/5 ${
                      value.toString() === option.id.toString() ? 'bg-[#254153]/5 text-[#254153] font-bold' : 'text-[#749094]'
                    }`}
                  >
                    <div>
                      <div className="truncate">{option.label}</div>
                      {option.sublabel && (
                        <div className="text-[10px] font-normal text-[#749094]/70">{option.sublabel}</div>
                      )}
                    </div>
                    {value.toString() === option.id.toString() && <Check size={14} className="text-[#254153]" />}
                  </button>
                ))
              ) : (
                <div className="px-3 py-8 text-center text-xs text-[#749094]/50">
                  No se encontraron resultados
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
