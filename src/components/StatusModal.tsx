'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2, XCircle, AlertCircle, X } from 'lucide-react'

export type ModalType = 'success' | 'error' | 'info' | 'warning'

interface StatusModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  message: string
  type?: ModalType
}

export function StatusModal({ isOpen, onClose, title, message, type = 'info' }: StatusModalProps) {
  const [isRendered, setIsRendered] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setIsRendered(true)
      // Prevent scrolling when modal is open
      document.body.style.overflow = 'hidden'
    } else {
      const timer = setTimeout(() => {
        setIsRendered(false)
        document.body.style.overflow = 'unset'
      }, 300) // Match animation duration
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  if (!isRendered && !isOpen) return null

  const icons = {
    success: <CheckCircle2 className="text-emerald-500" size={48} />,
    error: <XCircle className="text-rose-500" size={48} />,
    warning: <AlertCircle className="text-amber-500" size={48} />,
    info: <AlertCircle className="text-[#254153]" size={48} />,
  }

  const borderColors = {
    success: 'border-emerald-100',
    error: 'border-rose-100',
    warning: 'border-amber-100',
    info: 'border-[#254153]/10',
  }

  return (
    <div 
      className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-all duration-300 ${
        isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      {/* Backdrop with blur */}
      <div 
        className="absolute inset-0 bg-[#254153]/20 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div 
        className={`relative w-full max-w-sm overflow-hidden rounded-3xl border bg-white p-8 shadow-2xl transition-all duration-300 ${
          borderColors[type]
        } ${
          isOpen ? 'translate-y-0 scale-100' : 'translate-y-8 scale-95'
        }`}
      >
        <button 
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-2 text-[#749094] transition-colors hover:bg-[#749094]/10 hover:text-[#254153]"
        >
          <X size={20} />
        </button>

        <div className="flex flex-col items-center text-center">
          <div className="mb-4 animate-in zoom-in duration-500 fill-mode-backwards">
            {icons[type]}
          </div>
          
          <h3 className="mb-2 text-xl font-bold text-[#254153]">
            {title}
          </h3>
          
          <p className="mb-8 text-sm font-medium text-[#749094]">
            {message}
          </p>

          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-2xl bg-[#254153] py-4 text-sm font-bold text-white shadow-lg shadow-[#254153]/20 transition-all hover:bg-[#1a2e3b] active:scale-[0.98]"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  )
}
