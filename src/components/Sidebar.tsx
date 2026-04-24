'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  PlusCircle, 
  List, 
  UserCheck, 
  Table as TableIcon,
  LogOut,
  Home,
  Menu,
  X
} from 'lucide-react'
import { LogoFPK } from './LogoFPK'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'

export function Sidebar() {
  const pathname = usePathname()
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    async function getUser() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      setUserEmail(user?.email || null)
    }
    getUser()
  }, [])

  const authorizedEmails = [
    'aprendiz.desarrollo@firplak.com',
    'juan.bedoya@firplak.com',
    'analista2.desarrollo@firplak.com',
    'daniel.jimenez@firplak.com',
    'alejandro.isaza@firplak.com'
  ]

  const isAuthorized = userEmail && authorizedEmails.includes(userEmail)

  const isActive = (path: string) => pathname === path

  const navItems = [
    {
      label: 'Menú Principal',
      href: '/',
      icon: Home,
    },
    ...(isAuthorized ? [{
      label: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
    }] : []),
  ]

  const inventoryItems = isAuthorized ? [
    {
      label: 'Ingresar Producto',
      href: '/dashboard/inventory/add',
      icon: PlusCircle,
    },
    {
      label: 'Productos en Inventario',
      href: '/dashboard/inventory/list',
      icon: List,
    },
    {
      label: 'Asignar Dispositivo',
      href: '/dashboard/inventory/assign',
      icon: UserCheck,
    },
    {
      label: 'Gestión de Asignaciones',
      href: '/dashboard/inventory/assignments',
      icon: TableIcon,
    },
  ] : []

  return (
    <>
      {/* Mobile Toggle Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 flex h-10 w-10 items-center justify-center rounded-xl bg-[#254153] text-white shadow-lg transition-all active:scale-95 lg:hidden"
        aria-label="Toggle Menu"
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-[#254153]/20 backdrop-blur-sm transition-all animate-in fade-in duration-300 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 border-r border-[#749094]/10 bg-white lg:bg-[#749094]/5 shadow-xl lg:shadow-none transition-all duration-300 ease-in-out overflow-y-auto
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
      <div className="flex h-16 items-center border-b border-[#749094]/10 px-6">
        <LogoFPK size="sm" />
      </div>

      <nav className="flex flex-col gap-1 p-4">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setIsOpen(false)}
            className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all ${
              isActive(item.href)
                ? 'bg-[#254153] text-white shadow-md'
                : 'text-[#749094] hover:bg-[#254153]/5 hover:text-[#254153]'
            }`}
          >
            <item.icon size={20} />
            {item.label}
          </Link>
        ))}

        {inventoryItems.length > 0 && (
          <div className="mt-6 mb-2 px-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#749094]/50">Gestión de Inventario</p>
          </div>
        )}

        {inventoryItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setIsOpen(false)}
            className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all ${
              isActive(item.href)
                ? 'bg-[#254153] text-white shadow-md'
                : 'text-[#749094] hover:bg-[#254153]/5 hover:text-[#254153]'
            }`}
          >
            <item.icon size={20} />
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="mt-auto border-t border-[#749094]/10 p-4">
        <form action="/auth/signout" method="post">
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-[#749094] transition-colors hover:bg-rose-50 hover:text-rose-600"
          >
            <LogOut size={20} />
            Cerrar Sesión
          </button>
        </form>
      </div>
    </aside>
    </>
  )
}
