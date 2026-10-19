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
  availability: number | null // % de pings exitosos en el período
  avgLatency: number | null // ms, solo pings UP
  maxLatency: number | null
  uptimeMin: number // según incidentes registrados
  downtimeMin: number
  incidentAvailability: number
  openIncident: boolean // caída en curso al final del período
}

export interface DateRange {
  from: Date
  to: Date
}

export interface RangePreset {
  key: string
  label: string
  hours: number
}

export const PRESETS: RangePreset[] = [
  { key: '1h', label: '1 h', hours: 1 },
  { key: '6h', label: '6 h', hours: 6 },
  { key: '24h', label: '24 h', hours: 24 },
  { key: '7d', label: '7 días', hours: 168 },
]

// Los pings se agregan en el navegador (~27 mil filas por día), así que el rango se limita
export const MAX_RANGE_DAYS = 7

// Tamaño de intervalo según la duración del rango, para mantener ~60–100 barras
export function bucketMinutesFor(range: DateRange) {
  const hours = (range.to.getTime() - range.from.getTime()) / 3600e3
  if (hours <= 1) return 1
  if (hours <= 6) return 5
  if (hours <= 24) return 15
  if (hours <= 72) return 60
  return 120
}

const PAGE_SIZE = 10000 // max-rows configurado en Supabase
const STALE_AFTER_MIN = 5 // sin pings en este tiempo => "Sin datos"
// Kuma envía ~1 ping/min con desfase de milisegundos (14:29:59.994 en vez de 14:30:00),
// así que un intervalo puede quedar vacío aunque no se haya perdido nada. Si el último ping
// del intervalo anterior cubre el intervalo vacío dentro de esta tolerancia, se hereda su estado.
const PING_GRACE_MS = 2 * 60e3

const PRIVATE_IPV4 = /^(10\.\d{1,3}|192\.168|172\.(1[6-9]|2\d|3[01]))\.\d{1,3}\.\d{1,3}$/

// En dim_monitores conviven AP's, monitores de prueba y referencias externas (8.8.8.8).
// Se consideran AP's los monitores con IP privada que no son de prueba.
export function isAccessPoint(m: Monitor) {
  return PRIVATE_IPV4.test(m.target_ip_url ?? '') && !/test|prueba/i.test(m.nombre_monitor)
}

async function fetchPings(supabase: SupabaseClient, ids: number[], since: Date, until: Date) {
  const base = () =>
    supabase
      .from('fact_pings_continuos')
      .select('monitor_id, fecha_hora, ping_ms, estado_codigo', { count: 'exact' })
      .in('monitor_id', ids)
      .gte('fecha_hora', since.toISOString())
      .lte('fecha_hora', until.toISOString())
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

export async function loadApData(supabase: SupabaseClient, range: DateRange) {
  // Fin efectivo del período: nunca en el futuro
  const now = new Date(Math.min(range.to.getTime(), Date.now()))
  const since = range.from
  const bucketMin = bucketMinutesFor(range)

  const { data: monitorRows, error: mErr } = await supabase.from('dim_monitores').select('*')
  if (mErr) throw mErr

  const aps = ((monitorRows ?? []) as Monitor[])
    .filter(isAccessPoint)
    .sort((a, b) => a.nombre_monitor.localeCompare(b.nombre_monitor, 'es'))
  const ids = aps.map((m) => m.id)

  // Buckets de tiempo alineados al tamaño de intervalo
  const bucketMs = bucketMin * 60e3
  const firstBucket = Math.floor(since.getTime() / bucketMs) * bucketMs

  // Se consulta desde el inicio del primer intervalo (no a mitad) y con margen hacia atrás,
  // para que el primer intervalo tenga su ping y un ping previo que lo cubra
  const [fetched, incidentsRes] = await Promise.all([
    fetchPings(supabase, ids, new Date(firstBucket - PING_GRACE_MS), now),
    // Incidentes que se cruzan con el período
    supabase
      .from('fact_caidas_incidentes')
      .select('id, monitor_id, fecha_inicio, fecha_fin, duracion_minutos')
      .in('monitor_id', ids)
      .lte('fecha_inicio', now.toISOString())
      .or(`fecha_fin.is.null,fecha_fin.gte.${since.toISOString()}`)
      .order('fecha_inicio', { ascending: false }),
  ])
  if (incidentsRes.error) throw incidentsRes.error
  const incidents = (incidentsRes.data ?? []) as Incident[]

  const pings = fetched.filter((p) => new Date(p.fecha_hora).getTime() >= firstBucket)
  const bucketCount = Math.ceil((now.getTime() - firstBucket) / bucketMs)
  const buckets = Array.from({ length: bucketCount }, (_, i) => new Date(firstBucket + i * bucketMs))
  const bucketIndex = (t: number) => Math.min(Math.floor((t - firstBucket) / bucketMs), bucketCount - 1)

  type Cell = { up: number; total: number; latSum: number; latN: number; lastT: number; lastUp: boolean }
  const newCell = (): Cell => ({ up: 0, total: 0, latSum: 0, latN: 0, lastT: 0, lastUp: false })
  const grid = new Map<number, Cell[]>(ids.map((id) => [id, buckets.map(newCell)]))
  const overall = buckets.map(newCell)
  const last = new Map<number, Ping>()

  // Pings justo antes de la ventana: no cuentan, solo sirven para cubrir el primer intervalo
  const seeds = new Map<number, Cell>(ids.map((id) => [id, newCell()]))
  const overallSeed = newCell()
  const record = (cell: Cell, t: number, p: Ping) => {
    const isUp = p.estado_codigo === 1
    cell.total++
    if (t > cell.lastT) {
      cell.lastT = t
      cell.lastUp = isUp
    }
    if (isUp && p.ping_ms != null) {
      cell.latSum += p.ping_ms
      cell.latN++
    }
  }
  for (const p of fetched) {
    const t = new Date(p.fecha_hora).getTime()
    if (t >= firstBucket) continue
    const seed = seeds.get(p.monitor_id)
    if (seed) record(seed, t, p)
    record(overallSeed, t, p)
  }

  for (const p of pings) {
    const t = new Date(p.fecha_hora).getTime()
    const cell = grid.get(p.monitor_id)?.[bucketIndex(t)]
    if (!cell) continue
    const all = overall[bucketIndex(t)]
    const isUp = p.estado_codigo === 1
    cell.total++
    all.total++
    if (t > cell.lastT) {
      cell.lastT = t
      cell.lastUp = isUp
    }
    if (t > all.lastT) {
      all.lastT = t
      all.lastUp = isUp
    }
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

  // Para cada intervalo, la celda con datos que lo representa: la suya, o la última celda con
  // pings si ese último ping cae dentro de la tolerancia (medida hasta "ahora" en el intervalo en curso)
  const resolveCells = (cells: Cell[], seed: Cell) => {
    let carry: Cell | null = seed.total ? seed : null
    return cells.map((c, b) => {
      if (c.total) {
        carry = c
        return c
      }
      const ref = Math.min(firstBucket + (b + 1) * bucketMs, now.getTime())
      return carry && ref - carry.lastT <= PING_GRACE_MS ? carry : null
    })
  }

  const availabilitySeries = (cells: Cell[], seed: Cell) =>
    resolveCells(cells, seed).map((src, b) => {
      if (!src) return null
      if (src === cells[b]) return Math.round((src.up / src.total) * 1000) / 10
      return src.lastUp ? 100 : 0
    })

  const latencySeries = (cells: Cell[], seed: Cell) =>
    resolveCells(cells, seed).map((src) => (src?.latN ? src.latSum / src.latN : null))

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

    // Tiempo en servicio del período a partir de incidentes, recortando al alta del monitor
    const periodStart = Math.max(since.getTime(), new Date(m.created_at).getTime())
    const periodMin = Math.max((now.getTime() - periodStart) / 60e3, 0)
    const own = incidents.filter((i) => i.monitor_id === m.id)
    const downtime = own.reduce((acc, i) => {
      const start = Math.max(new Date(i.fecha_inicio).getTime(), periodStart)
      const end = Math.min(i.fecha_fin ? new Date(i.fecha_fin).getTime() : now.getTime(), now.getTime())
      return acc + Math.max(end - start, 0) / 60e3
    }, 0)

    return {
      monitor: m,
      status: stale ? 'stale' : lastPing!.estado_codigo === 1 ? 'up' : 'down',
      lastSeen,
      availability: total ? (up / total) * 100 : null,
      avgLatency: latN ? latSum / latN : null,
      maxLatency: lat.length ? Math.max(...lat.map((p) => p.ping_ms!)) : null,
      uptimeMin: Math.max(periodMin - downtime, 0),
      downtimeMin: downtime,
      incidentAvailability: periodMin > 0 ? Math.max(0, 100 - (downtime / periodMin) * 100) : 100,
      openIncident: own.some((i) => !i.fecha_fin || new Date(i.fecha_fin) > now),
    }
  })

  return {
    aps,
    buckets,
    summaries,
    incidents,
    // [bucketIdx, apIdx, disponibilidad %] — null si no hubo pings en ese intervalo ni uno anterior que lo cubra
    heatmap: aps.flatMap((m, apIdx) =>
      availabilitySeries(grid.get(m.id)!, seeds.get(m.id)!).map((v, b) => [b, apIdx, v] as const),
    ),
    latencyByAp: new Map(aps.map((m) => [m.id, latencySeries(grid.get(m.id)!, seeds.get(m.id)!)])),
    latencyOverall: latencySeries(overall, overallSeed),
    bucketMin,
    range: { from: since, to: now },
    pingCount: pings.length,
    loadedAt: new Date(),
  }
}

export type ApData = Awaited<ReturnType<typeof loadApData>>
