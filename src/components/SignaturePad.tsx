'use client'

import React, { useRef, useEffect } from 'react'
import SignaturePad from 'signature_pad'
import { Eraser } from 'lucide-react'

interface SignaturePadComponentProps {
  onSave: (signatureData: string) => void
  onClear: () => void
}

export const SignaturePadComponent: React.FC<SignaturePadComponentProps> = ({ onSave, onClear }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const signaturePadRef = useRef<SignaturePad | null>(null)
  const onSaveRef = useRef(onSave)

  // Update the ref whenever onSave changes, so we always have the latest one
  // without triggering the useEffect again.
  useEffect(() => {
    onSaveRef.current = onSave
  }, [onSave])

  useEffect(() => {
    if (canvasRef.current) {
      signaturePadRef.current = new SignaturePad(canvasRef.current, {
        backgroundColor: 'rgb(255, 255, 255)',
        penColor: 'rgb(0, 0, 0)',
        minWidth: 0.5,
        maxWidth: 2.5
      })

      const resizeCanvas = () => {
        if (canvasRef.current && signaturePadRef.current) {
          const ratio = Math.max(window.devicePixelRatio || 1, 1)
          const canvas = canvasRef.current
          const parent = canvas.parentElement
          
          if (parent) {
            // Save current drawing to restore it if possible, 
            // but signature_pad recommends clearing on resize.
            // To avoid flickering, we only resize if dimensions actually changed.
            const newWidth = parent.offsetWidth * ratio
            const newHeight = parent.offsetHeight * ratio
            
            if (canvas.width !== newWidth || canvas.height !== newHeight) {
              canvas.width = newWidth
              canvas.height = newHeight
              canvas.getContext('2d')?.scale(ratio, ratio)
              signaturePadRef.current.clear()
            }
          }
        }
      }

      signaturePadRef.current.addEventListener('endStroke', () => {
        const data = signaturePadRef.current?.toDataURL('image/png')
        if (data) onSaveRef.current(data)
      })

      window.addEventListener('resize', resizeCanvas)
      setTimeout(resizeCanvas, 100)

      return () => {
        window.removeEventListener('resize', resizeCanvas)
        signaturePadRef.current?.off()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Run only once

  const handleClear = () => {
    signaturePadRef.current?.clear()
    onClear()
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-[#749094]">Firma Digital Colaborador</label>
        <button
          type="button"
          onClick={handleClear}
          className="flex items-center gap-1.5 text-xs font-bold text-rose-500 transition-all hover:text-rose-600 active:scale-95"
        >
          <Eraser size={14} />
          Limpiar
        </button>
      </div>
      <div className="relative h-44 w-full overflow-hidden rounded-2xl border-2 border-dashed border-[#749094]/30 bg-white transition-all focus-within:border-[#254153]/40">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full touch-none cursor-crosshair"
        />
      </div>
      <p className="text-[11px] font-medium text-[#749094]/70 italic text-center">
        Por favor firme dentro del cuadro anterior utilizando su mouse o pantalla táctil.
      </p>
    </div>
  )
}
