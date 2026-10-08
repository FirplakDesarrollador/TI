import type { ReactNode } from 'react'

const styles = {
  indigo: {
    bg: 'bg-indigo-600',
    text: 'text-indigo-600',
    light: 'bg-indigo-50',
    shadow: 'shadow-indigo-500/20'
  },
  amber: {
    bg: 'bg-amber-500',
    text: 'text-amber-600',
    light: 'bg-amber-50',
    shadow: 'shadow-amber-500/20'
  },
  emerald: {
    bg: 'bg-emerald-500',
    text: 'text-emerald-600',
    light: 'bg-emerald-50',
    shadow: 'shadow-emerald-500/20'
  },
  rose: {
    bg: 'bg-rose-500',
    text: 'text-rose-600',
    light: 'bg-rose-50',
    shadow: 'shadow-rose-500/20'
  }
}

export type KPIColor = keyof typeof styles

interface KPICardProps {
  title: string
  value: number | string
  icon: ReactNode
  trend: string
  color: KPIColor
}

export function KPICard({ title, value, icon, trend, color }: KPICardProps) {
  const s = styles[color]

  return (
    <div className="relative overflow-hidden rounded-[1.5rem] bg-white p-4 border border-slate-200 shadow-xl shadow-slate-200/20 hover:shadow-2xl transition-all duration-300 group">
      <div className={`absolute -right-6 -top-6 h-24 w-24 rounded-full ${s.light} blur-3xl opacity-50 transition-opacity group-hover:opacity-100`} />

      <div className="relative z-10 flex items-start justify-between mb-4">
        <div className={`h-10 w-10 rounded-xl ${s.bg} flex items-center justify-center text-white shadow-lg ${s.shadow} transform group-hover:scale-110 transition-transform duration-300`}>
          {icon}
        </div>
        <div className={`text-[8px] font-black ${s.text} uppercase tracking-widest px-2 py-1 rounded ${s.light}`}>
          {trend}
        </div>
      </div>

      <div className="relative z-10 space-y-1">
        <p className="text-[10px] font-bold text-[#749094] uppercase tracking-tighter">{title}</p>
        <div className="flex items-baseline gap-2">
          <h4 className="text-2xl font-black text-[#254153]">{value}</h4>
        </div>
      </div>
    </div>
  )
}
