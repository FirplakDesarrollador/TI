import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    }
  )

  const { data, error } = await supabase.from('ti_historial_stock').select('*').limit(5)
  
  if (error) {
    return new Response(JSON.stringify({ error }), { status: 500 })
  }
  
  return new Response(JSON.stringify({ 
    columns: data.length > 0 ? Object.keys(data[0]) : [],
    data: data 
  }), { status: 200 })
}
