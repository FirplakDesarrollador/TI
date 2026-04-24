'use client'

import React, { useRef, useEffect, useState } from 'react'
import SignaturePad from 'signature_pad'
import { Eraser, PenTool, X, Check, Trash2 } from 'lucide-react'

interface SignaturePadComponentProps {
  onSave: (signatureData: string) => void
  onClear: () => void
}

export const SignaturePadComponent: React.FC<SignaturePadComponentProps> = ({ onSave, onClear }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [signaturePreview, setSignaturePreview] = useState<string | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const signaturePadRef = useRef<SignaturePad | null>(null)

  useEffect(() => {
    if (isOpen && canvasRef.current) {
      // Initialize signature pad when modal opens
      signaturePadRef.current = new SignaturePad(canvasRef.current, {
        backgroundColor: 'rgb(255, 255, 255)',
        penColor: 'rgb(0, 0, 0)',
        minWidth: 1,
        maxWidth: 3
      })

      const resizeCanvas = () => {
        if (canvasRef.current && signaturePadRef.current) {
          const ratio = Math.max(window.devicePixelRatio || 1, 1)
          const canvas = canvasRef.current
          const parent = canvas.parentElement
          
          if (parent) {
            canvas.width = parent.offsetWidth * ratio
            canvas.height = parent.offsetHeight * ratio
            canvas.getContext('2d')?.scale(ratio, ratio)
            signaturePadRef.current.clear()
            
            // If we had a temporary signature in the pad before resize, it gets lost.
            // But since this is a fresh modal open usually, it's fine.
          }
        }
      }

      window.addEventListener('resize', resizeCanvas)
      // Small timeout to ensure parent dimensions are calculated
      setTimeout(resizeCanvas, 10)

      return () => {
        window.removeEventListener('resize', resizeCanvas)
        signaturePadRef.current?.off()
      }
    }
  }, [isOpen])

  const handleOpen = () => setIsOpen(true)
  const handleClose = () => setIsOpen(false)

  const handleClear = () => {
    signaturePadRef.current?.clear()
  }

  const handleConfirmSave = () => {
    if (signaturePadRef.current?.isEmpty()) {
      alert('Por favor realice su firma antes de guardar.')
      return
    }
    const data = signaturePadRef.current?.toDataURL('image/png')
    if (data) {
      setSignaturePreview(data)
      onSave(data)
      setIsOpen(false)
    }
  }

  const handleReset = () => {
    setSignaturePreview(null)
    onClear()
  }

  return (
    <div className="space-y-4">
      <label className="text-sm font-bold text-[#749094] uppercase tracking-wider">Firma del Colaborador</label>
      
      {!signaturePreview ? (
        <button
          type="button"
          onClick={handleOpen}
          className="flex w-full items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-[#749094]/30 bg-[#749094]/5 p-8 text-[#749094] transition-all hover:border-[#254153]/40 hover:bg-[#254153]/5 hover:text-[#254153]"
        >
          <PenTool size={24} />
          <span className="text-lg font-bold">Haga clic aquí para FIRMAR</span>
        </button>
      ) : (
        <div className="group relative overflow-hidden rounded-2xl border border-[#749094]/20 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
              <Check size={14} /> Firma capturada
            </span>
            <button
              type="button"
              onClick={handleReset}
              className="text-[#749094] hover:text-rose-500 transition-colors"
              title="Borrar firma"
            >
              <Trash2 size={18} />
            </button>
          </div>
          <div className="flex justify-center bg-gray-50 rounded-xl p-2">
            <img src={signaturePreview} alt="Firma" className="h-32 object-contain" />
          </div>
          <button
            type="button"
            onClick={handleOpen}
            className="mt-3 w-full rounded-xl bg-[#254153]/5 py-2 text-xs font-bold text-[#254153] hover:bg-[#254153]/10 transition-colors"
          >
            Cambiar Firma
          </button>
        </div>
      )}

      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#254153]/80 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="flex h-full max-h-[600px] w-full max-w-4xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#749094]/10 bg-[#749094]/5 px-8 py-6">
              <div>
                <h3 className="text-xl font-black text-[#254153]">Firma Digital</h3>
                <p className="text-sm text-[#749094]">Utilice su mouse o pantalla táctil para firmar</p>
              </div>
              <button 
                onClick={handleClose}
                className="rounded-full p-2 text-[#749094] hover:bg-rose-50 hover:text-rose-500 transition-all"
              >
                <X size={24} />
              </button>
            </div>

            {/* Canvas Area */}
            <div className="relative flex-1 bg-white p-4">
              <div className="h-full w-full rounded-2xl border-2 border-dashed border-[#749094]/20 bg-gray-50/50 relative overflow-hidden">
                <canvas
                  ref={canvasRef}
                  className="absolute inset-0 h-full w-full touch-none cursor-crosshair"
                />
              </div>
            </div>

            {/* Footer / Buttons */}
            <div className="grid grid-cols-3 gap-4 border-t border-[#749094]/10 bg-[#F8FAFC] p-8">
              <button
                type="button"
                onClick={handleClose}
                className="flex items-center justify-center gap-2 rounded-2xl border border-[#749094]/20 bg-white px-6 py-4 text-sm font-bold text-[#749094] transition-all hover:bg-gray-50 active:scale-95"
              >
                <X size={20} />
                Cancelar
              </button>
              
              <button
                type="button"
                onClick={handleClear}
                className="flex items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-6 py-4 text-sm font-bold text-rose-600 transition-all hover:bg-rose-100 active:scale-95"
              >
                <Eraser size={20} />
                Limpiar
              </button>

              <button
                type="button"
                onClick={handleConfirmSave}
                className="flex items-center justify-center gap-2 rounded-2xl bg-[#254153] px-6 py-4 text-sm font-bold text-white shadow-lg shadow-[#254153]/20 transition-all hover:bg-[#1a2e3b] active:scale-95"
              >
                <Check size={20} />
                Guardar Firma
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
