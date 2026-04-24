import { Sidebar } from '@/components/Sidebar'
import { LogoFPK } from '@/components/LogoFPK'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar />
      <div className="flex flex-1 flex-col min-w-0">
        {/* Top Header for Mobile */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-center border-b border-[#749094]/10 bg-white/80 backdrop-blur-md lg:hidden">
          <LogoFPK size="sm" />
        </header>
        
        <main className="flex-1 lg:ml-64 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
