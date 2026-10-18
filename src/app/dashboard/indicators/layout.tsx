'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { TrendingUp } from 'lucide-react'
import { indicatorBoards } from './registry'

export default function IndicatorsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const activeBoard = indicatorBoards.find((b) => b.href === pathname)

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Header BI Style */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 px-2 py-2 backdrop-blur-xl sm:px-4 sm:py-3">
        <div className="mx-auto flex w-full items-center justify-between px-2">
          <div className="flex items-center gap-3 pl-12 sm:gap-4 sm:pl-0">
            <div className="hidden h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#254153] to-[#1a2e3b] text-white shadow-lg shadow-[#254153]/20 sm:flex">
              <TrendingUp size={24} />
            </div>
            <div>
              <h1 className="text-base font-black text-[#254153] tracking-tighter uppercase sm:text-xl">Indicadores</h1>
              <p className="text-[7px] font-bold text-[#749094] uppercase tracking-widest sm:text-[9px]">
                {activeBoard?.description ?? 'Resumen Ejecutivo de Gestión TI'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col items-end mr-4">
              <span className="text-xs font-black text-[#254153]">{activeBoard?.label ?? 'Indicadores'}</span>
              <span className="text-[10px] text-[#749094] flex items-center gap-1">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> En vivo
              </span>
            </div>
          </div>
        </div>

        {indicatorBoards.length > 1 && (
          <nav className="mx-auto mt-3 flex w-full gap-2 overflow-x-auto px-2">
            {indicatorBoards.map((board) => (
              <Link
                key={board.href}
                href={board.href}
                className={`flex shrink-0 items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                  board.href === pathname
                    ? 'bg-[#254153] text-white shadow-md'
                    : 'text-[#749094] hover:bg-[#254153]/5 hover:text-[#254153]'
                }`}
              >
                <board.icon size={14} />
                {board.label}
              </Link>
            ))}
          </nav>
        )}
      </header>

      {children}
    </div>
  )
}
