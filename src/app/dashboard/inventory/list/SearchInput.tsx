'use client'

import { Search } from 'lucide-react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useTransition, useEffect, useState } from 'react'

export default function SearchInput() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '')

  useEffect(() => {
    // Only trigger if the search term in the state is different from the one in the URL
    const currentQuery = searchParams.get('q') || ''
    if (searchTerm === currentQuery) return

    const delayDebounceFn = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString())
      if (searchTerm) {
        params.set('q', searchTerm)
      } else {
        params.delete('q')
      }
      
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`)
      })
    }, 500)

    return () => clearTimeout(delayDebounceFn)
  }, [searchTerm, pathname, router, searchParams])

  return (
    <div className="relative flex-1 max-w-md">
      <Search 
        className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${isPending ? 'text-[#254153]' : 'text-[#749094]'}`} 
        size={18} 
      />
      <input 
        type="text" 
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Buscar por serial, referencia o nombre..."
        className="w-full rounded-2xl border border-[#749094]/20 bg-white py-3 pl-12 pr-4 text-sm shadow-sm transition-all focus:border-[#254153]/30 focus:outline-none focus:ring-4 focus:ring-[#254153]/5 placeholder:text-[#749094]/60 text-[#254153]"
      />
      {isPending && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#254153] border-t-transparent"></div>
        </div>
      )}
    </div>
  )
}
