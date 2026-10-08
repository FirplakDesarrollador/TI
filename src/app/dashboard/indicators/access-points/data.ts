import type { SupabaseClient } from '@supabase/supabase-js'

export interface Monitor {
  id: number
  nombre_monitor: string
  tipo_monitor: string
  target_ip_url: string
  proveedor_isp: string
  sede_empresa: string
  created_at: string
}

interface Ping {
  monitor_id: number
  fecha_hora: string
  ping_ms: number | null
  estado_codigo: number
}

export interface Incident {
  id: number
  monitor_id: number
  fecha_inicio: string
  fecha_fin: string | null
  duracion_minutos: number | null
}

export type ApStatus = 'up' | 'down' | 'stale'

export interface ApSummary {
  monitor: Monitor
  status: ApStatus
  lastSeen: Date | null
  availability: number | null // % en la ventana seleccionada
  avgLatency: number | null // ms, solo pings UP
  maxLatency: number | null
  downtime30dMin: number
  availability30d: number
  openIncident: boolean
}

export interface WindowOption {
  key: string
  label: string
  hours: number
  bucketMin: number
}

export const WINDOWS: WindowOption[] = [
  { key: '1h', label: '1 h', hours: 1, bucketMin: 1 },
  { key: '6h', label: '6 h', hours: 6, bucketMin: 5 },
  { key: '24h', label: '24 h', hours: 24, bucketMin: 15 },
]

const PAGE_SIZE = 10000 // max-rows configurado en Supabase
const STALE_AFTER_MIN = 5 // sin pings en este tiempo => "Sin datos"
const SLA_DAYS = 30

const PRIVATE_IPV4 = /^(10\.\d{1,3}|192\.168|172\.(1[6-9]|2\d|3[01]))\.\d{1,3}\.\d{1,3}$/

// En dim_monitores conviven AP's, monitores de prueba y referencias externas (8.8.8.8).
// Se consideran AP's los monitores con IP privada que no son de prueba.
export function isAccessPoint(m: Monitor) {
  return PRIVATE_IPV4.test(m.target_ip_url ?? '') && !/test|prueba/i.test(m.nombre_monitor)
}

async function fetchPings(supabase: SupabaseClient, ids: number[], since: Date) {
  const base = () =>
    supabase
      .from('fact_pings_continuos')
      .select('monitor_id, fecha_hora, ping_ms, estado_codigo', { count: 'exact' })
      .in('monitor_id', ids)
      .gte('fecha_hora', since.toISOString())
      .order('id')

  const first = await base().range(0, PAGE_SIZE - 1)
  if (first.error) throw first.error

  const total = first.count ?? 0
  const pages = Math.ceil(total / PAGE_SIZE)
  const rest = await Promise.all(
    Array.from({ length: Math.max(pages - 1, 0) }, (_, i) =>
      base().range((i + 1) * PAGE_SIZE, (i + 2) * PAGE_SIZE - 1),
    ),
  )
  for (const r of rest) if (r.error) throw r.error

  return [first, ...rest].flatMap((r) => (r.data ?? []) as Ping[])
}

export async function loadApData(supabase: SupabaseClient, window: WindowOption) {
  const now = new Date()
  const since = new Date(now.getTime() - window.hours * 3600e3)
  const slaSince = new Date(now.getTime() - SLA_DAYS * 86400e3)

  const { data: monitorRows, error: mErr } = await supabase.from('dim_monitores').select('*')
  if (mErr) throw mErr

  const aps = ((monitorRows ?? []) as Monitor[])
    .filter(isAccessPoint)
    .sort((a, b) => a.nombre_monitor.localeCompare(b.nombre_monitor, 'es'))
  const ids = aps.map((m) => m.id)

  const [pings, incidentsRes] = await Promise.all([
    fetchPings(supabase, ids, since),
    supabase
      .from('fact_caidas_incidentes')
      .select('id, monitor_id, fecha_inicio, fecha_fin, duracion_minutos')
      .in('monitor_id', ids)
      .or(`fecha_fin.is.null,fecha_fin.gte.${slaSince.toISOString()}`)
      .order('fecha_inicio', { ascending: false }),
  ])
  if (incidentsRes.error) throw incidentsRes.error
  const incidents = (incidentsRes.data ?? []) as Incident[]

  // Buckets de tiempo alineados al tamaño de intervalo
  const bucketMs = window.bucketMin * 60e3
  const firstBucket = Math.floor(since.getTime() / bucketMs) * bucketMs
  const bucketCount = Math.ceil((now.getTime() - firstBucket) / bucketMs)
  const buckets = Array.from({ length: bucketCount }, (_, i) => new Date(firstBucket + i * bucketMs))
  const bucketIndex = (t: number) => Math.min(Math.floor((t - firstBucket) / bucketMs), bucketCount - 1)

  type Cell = { up: number; total: number; latSum: number; latN: number }
  const newCell = (): Cell => ({ up: 0, total: 0, latSum: 0, latN: 0 })
  const grid = new Map<number, Cell[]>(ids.map((id) => [id, buckets.map(newCell)]))
  const overall = buckets.map(newCell)
  const last = new Map<number, Ping>()

  for (const p of pings) {
    const t = new Date(p.fecha_hora).getTime()
    const cell = grid.get(p.monitor_id)?.[bucketIndex(t)]
    if (!cell) continue
    const all = overall[bucketIndex(t)]
    const isUp = p.estado_codigo === 1
    cell.total++
    all.total++
    if (isUp) {
      cell.up++
      all.up++
      if (p.ping_ms != null) {
        cell.latSum += p.ping_ms
        cell.latN++
        all.latSum += p.ping_ms
        all.latN++
      }
    }
    const prev = last.get(p.monitor_id)
    if (!prev || prev.fecha_hora < p.fecha_hora) last.set(p.monitor_id, p)
  }

  const summaries: ApSummary[] = aps.map((m) => {
    const cells = grid.get(m.id)!
    const up = cells.reduce((a, c) => a + c.up, 0)
    const total = cells.reduce((a, c) => a + c.total, 0)
    const latN = cells.reduce((a, c) => a + c.latN, 0)
    const latSum = cells.reduce((a, c) => a + c.latSum, 0)
    const lat = pings.filter((p) => p.monitor_id === m.id && p.estado_codigo === 1 && p.ping_ms != null)
    const lastPing = last.get(m.id)
    const lastSeen = lastPing ? new Date(lastPing.fecha_hora) : null
    const stale = !lastSeen || now.getTime() - lastSeen.getTime() > STALE_AFTER_MIN * 60e3

    // Disponibilidad 30 días a partir de incidentes, recortando al alta del monitor
    const periodStart = Math.max(slaSince.getTime(), new Date(m.created_at).getTime())
    const periodMin = (now.getTime() - periodStart) / 60e3
    const own = incidents.filter((i) => i.monitor_id === m.id)
    const downtime = own.reduce((acc, i) => {
      const start = Math.max(new Date(i.fecha_inicio).getTime(), periodStart)
      const end = i.fecha_fin ? new Date(i.fecha_fin).getTime() : now.getTime()
      return acc + Math.max(end - start, 0) / 60e3
    }, 0)

    return {
      monitor: m,
      status: stale ? 'stale' : lastPing!.estado_codigo === 1 ? 'up' : 'down',
      lastSeen,
      availability: total ? (up / total) * 100 : null,
      avgLatency: latN ? latSum / latN : null,
      maxLatency: lat.length ? Math.max(...lat.map((p) => p.ping_ms!)) : null,
      downtime30dMin: downtime,
      availability30d: periodMin > 0 ? Math.max(0, 100 - (downtime / periodMin) * 100) : 100,
      openIncident: own.some((i) => !i.fecha_fin),
    }
  })

  return {
    aps,
    buckets,
    summaries,
    incidents,
    // [bucketIdx, apIdx, disponibilidad %] — null si no hubo pings en ese intervalo
    heatmap: aps.flatMap((m, apIdx) =>
      grid.get(m.id)!.map((c, b) => [b, apIdx, c.total ? Math.round((c.up / c.total) * 1000) / 10 : null] as const),
    ),
    latencyByAp: new Map(
      aps.map((m) => [m.id, grid.get(m.id)!.map((c) => (c.latN ? c.latSum / c.latN : null))]),
    ),
    latencyOverall: overall.map((c) => (c.latN ? c.latSum / c.latN : null)),
    bucketMin: window.bucketMin,
    pingCount: pings.length,
    loadedAt: now,
  }
}

export type ApData = Awaited<ReturnType<typeof loadApData>>
