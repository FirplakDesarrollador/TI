import { LayoutDashboard, Wifi, type LucideIcon } from 'lucide-react'

export interface IndicatorBoard {
  label: string
  description: string
  href: string
  icon: LucideIcon
}

// Registro de tableros del módulo de indicadores.
// Para añadir uno nuevo: crear la carpeta en /dashboard/indicators/<slug>/page.tsx
// y registrarlo aquí; aparecerá en las pestañas del módulo y en el Sidebar.
export const indicatorBoards: IndicatorBoard[] = [
  {
    label: 'Resumen General',
    description: 'Inventario, solicitudes y entregas',
    href: '/dashboard/indicators',
    icon: LayoutDashboard,
  },
  {
    label: "Red · Access Points",
    description: "Disponibilidad y latencia de los AP's",
    href: '/dashboard/indicators/access-points',
    icon: Wifi,
  },
]
