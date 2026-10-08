import { TrendingUp } from 'lucide-react'

export function IndicatorsLoading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="relative flex items-center justify-center">
          <div className="absolute h-24 w-24 rounded-full border-4 border-[#254153]/10 border-t-[#254153] animate-spin" />
          <TrendingUp className="h-8 w-8 text-[#254153] animate-pulse" />
        </div>
        <p className="text-sm font-black text-[#254153] uppercase tracking-[0.2em] animate-pulse mt-4">Analizando Datos BI...</p>
      </div>
    </div>
  )
}
