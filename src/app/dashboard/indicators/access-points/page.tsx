"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Clock,
  Gauge,
  RefreshCw,
  Wifi,
  WifiOff,
} from "lucide-react";
import { createClient } from "@/lib/supabase";
import { KPICard } from "../_components/KPICard";
import { IndicatorsLoading } from "../_components/IndicatorsLoading";
import { EChart, type EChartOption } from "../_components/EChart";
import { WINDOWS, loadApData, type ApData, type ApStatus } from "./data";

const REFRESH_MS = 60_000;

// Colores de rol: marca para series únicas, estado para disponibilidad
const C = {
  brand: "#254153",
  brandSoft: "rgba(37, 65, 83, 0.12)",
  ink: "#254153",
  muted: "#749094",
  axis: "#94a3b8",
  grid: "#eef2f6",
  good: "#0ca30c",
  warning: "#fab219",
  critical: "#d03b3b",
  empty: "#e2e8f0",
};

const TOOLTIP_BASE = {
  backgroundColor: "#ffffff",
  borderColor: "#e2e8f0",
  borderWidth: 1,
  padding: [8, 12],
  textStyle: { color: C.ink, fontSize: 12 },
  extraCssText: "border-radius:12px;box-shadow:0 10px 15px -3px rgb(0 0 0 / 0.1);",
};

const STATUS_META: Record<ApStatus, { label: string; className: string; icon: typeof Wifi }> = {
  up: { label: "En línea", className: "bg-emerald-50 text-emerald-700", icon: Wifi },
  down: { label: "Caído", className: "bg-rose-50 text-rose-700", icon: WifiOff },
  stale: { label: "Sin datos", className: "bg-slate-100 text-slate-500", icon: Clock },
};

const timeFmt = new Intl.DateTimeFormat("es-CO", { hour: "2-digit", minute: "2-digit", hour12: false });
const dateTimeFmt = new Intl.DateTimeFormat("es-CO", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

const fmtPct = (v: number | null) => (v == null ? "—" : `${v.toFixed(v === 100 ? 0 : 1)}%`);
const fmtMs = (v: number | null) => (v == null ? "—" : `${v.toFixed(1)} ms`);

function fmtDuration(min: number) {
  if (min < 60) return `${Math.round(min)} min`;
  if (min < 1440) return `${(min / 60).toFixed(1)} h`;
  return `${(min / 1440).toFixed(1)} d`;
}

export default function AccessPointsIndicators() {
  const [windowKey, setWindowKey] = useState(WINDOWS[2].key);
  const [selectedAp, setSelectedAp] = useState<number | "all">("all");
  const [data, setData] = useState<ApData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const windowOpt = WINDOWS.find((w) => w.key === windowKey)!;

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      setData(await loadApData(createClient(), windowOpt));
      setError(null);
    } catch (err) {
      console.error("Error fetching AP indicators:", err);
      setError("No se pudieron cargar las mediciones de los AP's.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [windowOpt]);

  useEffect(() => {
    load();
    const timer = setInterval(load, REFRESH_MS);
    return () => clearInterval(timer);
  }, [load]);

  const kpis = useMemo(() => {
    if (!data) return null;
    const s = data.summaries;
    const withAvail = s.filter((a) => a.availability != null);
    const withLat = s.filter((a) => a.avgLatency != null);
    return {
      up: s.filter((a) => a.status === "up").length,
      total: s.length,
      availability: withAvail.length
        ? withAvail.reduce((acc, a) => acc + a.availability!, 0) / withAvail.length
        : null,
      latency: withLat.length ? withLat.reduce((acc, a) => acc + a.avgLatency!, 0) / withLat.length : null,
      openIncidents: s.filter((a) => a.openIncident).length,
    };
  }, [data]);

  const heatmapOption = useMemo<EChartOption | null>(() => {
    if (!data) return null;
    const labels = data.buckets.map((b) => timeFmt.format(b));
    const names = data.aps.map((m) => m.nombre_monitor);
    return {
      grid: { left: 8, right: 16, top: 8, bottom: 56, containLabel: true },
      tooltip: {
        ...TOOLTIP_BASE,
        formatter: (p: { value: [number, number, number | null] }) => {
          const [b, ap, v] = p.value;
          const start = data.buckets[b];
          const end = new Date(start.getTime() + data.bucketMin * 60e3);
          return `<b>${names[ap]}</b><br/>${timeFmt.format(start)} – ${timeFmt.format(end)}<br/>Disponibilidad: <b>${fmtPct(v)}</b>`;
        },
      },
      xAxis: {
        type: "category",
        data: labels,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: C.axis, fontSize: 10, interval: Math.ceil(labels.length / 12) - 1 },
        splitArea: { show: false },
      },
      yAxis: {
        type: "category",
        data: names,
        inverse: true,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: C.ink, fontSize: 11, fontWeight: 600 },
      },
      visualMap: {
        type: "piecewise",
        orient: "horizontal",
        left: "center",
        bottom: 0,
        itemWidth: 12,
        itemHeight: 12,
        textStyle: { color: C.muted, fontSize: 11 },
        pieces: [
          { min: 100, max: 100, label: "Disponible (100%)", color: C.good },
          { min: 50, lt: 100, label: "Intermitente (50–99%)", color: C.warning },
          { min: 0, lt: 50, label: "Caído (<50%)", color: C.critical },
        ],
        outOfRange: { color: C.empty },
      },
      series: [
        {
          type: "heatmap",
          data: data.heatmap.map(([b, ap, v]) => [b, ap, v ?? "-"]),
          itemStyle: { borderColor: "#ffffff", borderWidth: 1, borderRadius: 2 },
          emphasis: { itemStyle: { borderColor: C.ink, borderWidth: 1 } },
          progressive: 0,
        },
      ],
    };
  }, [data]);

  const latencyOption = useMemo<EChartOption | null>(() => {
    if (!data) return null;
    const values = selectedAp === "all" ? data.latencyOverall : data.latencyByAp.get(selectedAp) ?? [];
    const name =
      selectedAp === "all"
        ? "Promedio de todos los AP's"
        : data.aps.find((m) => m.id === selectedAp)?.nombre_monitor ?? "";
    return {
      grid: { left: 8, right: 16, top: 16, bottom: 8, containLabel: true },
      tooltip: {
        ...TOOLTIP_BASE,
        trigger: "axis",
        axisPointer: { type: "line", lineStyle: { color: "#cbd5e1", type: "dashed" } },
        valueFormatter: (v: number | null) => fmtMs(v),
      },
      xAxis: {
        type: "category",
        boundaryGap: false,
        data: data.buckets.map((b) => timeFmt.format(b)),
        axisLine: { lineStyle: { color: C.grid } },
        axisTick: { show: false },
        axisLabel: { color: C.axis, fontSize: 11 },
      },
      yAxis: {
        type: "value",
        min: 0,
        name: "ms",
        nameTextStyle: { color: C.axis, fontSize: 11 },
        axisLabel: { color: C.axis, fontSize: 11 },
        splitLine: { lineStyle: { color: C.grid } },
      },
      series: [
        {
          name,
          type: "line",
          data: values.map((v) => (v == null ? null : Math.round(v * 100) / 100)),
          showSymbol: false,
          symbolSize: 8,
          connectNulls: false,
          lineStyle: { width: 2, color: C.brand },
          itemStyle: { color: C.brand },
          areaStyle: { color: C.brandSoft },
        },
      ],
    };
  }, [data, selectedAp]);

  const downtimeOption = useMemo<EChartOption | null>(() => {
    if (!data) return null;
    const rows = [...data.summaries].sort((a, b) => a.downtime30dMin - b.downtime30dMin);
    return {
      grid: { left: 8, right: 96, top: 8, bottom: 8, containLabel: true },
      tooltip: {
        ...TOOLTIP_BASE,
        trigger: "item",
        formatter: (p: { dataIndex: number }) => {
          const r = rows[p.dataIndex];
          return `<b>${r.monitor.nombre_monitor}</b><br/>Sin servicio: <b>${fmtDuration(r.downtime30dMin)}</b><br/>Disponibilidad: <b>${fmtPct(r.availability30d)}</b>`;
        },
      },
      xAxis: {
        type: "value",
        name: "horas",
        nameTextStyle: { color: C.axis, fontSize: 11 },
        axisLabel: { color: C.axis, fontSize: 11 },
        splitLine: { lineStyle: { color: C.grid } },
      },
      yAxis: {
        type: "category",
        data: rows.map((r) => r.monitor.nombre_monitor),
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: C.ink, fontSize: 11, fontWeight: 600 },
      },
      series: [
        {
          type: "bar",
          data: rows.map((r) => Math.round((r.downtime30dMin / 60) * 10) / 10),
          barMaxWidth: 14,
          itemStyle: { color: C.brand, borderRadius: [0, 4, 4, 0] },
          label: {
            show: true,
            position: "right",
            color: C.muted,
            fontSize: 11,
            formatter: (p: { dataIndex: number }) => fmtPct(rows[p.dataIndex].availability30d),
          },
        },
      ],
    };
  }, [data]);

  if (loading) return <IndicatorsLoading />;

  if (error && !data) {
    return (
      <main className="p-4">
        <div className="rounded-[1.5rem] border border-rose-200 bg-rose-50 p-6 text-sm font-bold text-rose-700">{error}</div>
      </main>
    );
  }

  if (!data || !kpis) return null;

  const apNames = new Map(data.aps.map((m) => [m.id, m.nombre_monitor]));

  return (
    <main className="mx-auto w-full p-4 space-y-4">
      {/* Filtros */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
          {WINDOWS.map((w) => (
            <button
              key={w.key}
              onClick={() => setWindowKey(w.key)}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                w.key === windowKey ? "bg-[#254153] text-white shadow" : "text-[#749094] hover:bg-slate-50"
              }`}
            >
              Últimas {w.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3 text-[11px] text-[#749094]">
          {error && <span className="font-bold text-rose-600">{error}</span>}
          <span>
            {data.pingCount.toLocaleString("es-CO")} mediciones · Actualizado {timeFmt.format(data.loadedAt)}
          </span>
          <button
            onClick={load}
            disabled={refreshing}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-bold text-[#254153] shadow-sm transition-all hover:bg-slate-50 disabled:opacity-60"
          >
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
            Actualizar
          </button>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <KPICard
          title="AP's en línea"
          value={`${kpis.up} / ${kpis.total}`}
          icon={<Wifi size={24} />}
          trend="Estado actual"
          color="emerald"
        />
        <KPICard
          title="Disponibilidad promedio"
          value={fmtPct(kpis.availability)}
          icon={<Activity size={24} />}
          trend={`Últimas ${windowOpt.label}`}
          color="indigo"
        />
        <KPICard
          title="Latencia promedio"
          value={fmtMs(kpis.latency)}
          icon={<Gauge size={24} />}
          trend={`Últimas ${windowOpt.label}`}
          color="amber"
        />
        <KPICard
          title="Incidentes abiertos"
          value={kpis.openIncidents}
          icon={<AlertTriangle size={24} />}
          trend="Caídas en curso"
          color="rose"
        />
      </div>

      {/* Mapa de disponibilidad */}
      <div className="rounded-[1.5rem] bg-white p-4 border border-slate-200 shadow-xl shadow-slate-200/20">
        <div className="mb-4">
          <h3 className="text-lg font-black text-[#254153] uppercase tracking-tight">Disponibilidad por AP</h3>
          <p className="text-xs text-[#749094] font-medium">
            % de pings exitosos en intervalos de {windowOpt.bucketMin} min · Últimas {windowOpt.label}
          </p>
        </div>
        {heatmapOption && (
          <EChart
            option={heatmapOption}
            className="w-full"
            ariaLabel="Mapa de calor de disponibilidad por AP"
            style={{ height: Math.max(240, data.aps.length * 24 + 80) }}
          />
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Latencia */}
        <div className="lg:col-span-7 rounded-[1.5rem] bg-white p-4 border border-slate-200 shadow-xl shadow-slate-200/20">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="text-lg font-black text-[#254153] uppercase tracking-tight">Latencia</h3>
              <p className="text-xs text-[#749094] font-medium">Tiempo de respuesta promedio de los pings exitosos</p>
            </div>
            <select
              value={selectedAp}
              onChange={(e) => setSelectedAp(e.target.value === "all" ? "all" : Number(e.target.value))}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-[#254153] shadow-sm focus:outline-none focus:ring-4 focus:ring-[#254153]/5"
            >
              <option value="all">Todos los AP&apos;s (promedio)</option>
              {data.aps.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nombre_monitor}
                </option>
              ))}
            </select>
          </div>
          {latencyOption && (
            <EChart option={latencyOption} className="h-[320px] lg:h-[440px] w-full" ariaLabel="Gráfico de latencia en el tiempo" />
          )}
        </div>

        {/* Tiempo sin servicio 30 días */}
        <div className="lg:col-span-5 rounded-[1.5rem] bg-white p-4 border border-slate-200 shadow-xl shadow-slate-200/20">
          <div className="mb-4">
            <h3 className="text-lg font-black text-[#254153] uppercase tracking-tight">Tiempo sin servicio</h3>
            <p className="text-xs text-[#749094] font-medium">Horas caído y disponibilidad · Últimos 30 días</p>
          </div>
          {downtimeOption && (
            <EChart
              option={downtimeOption}
              className="w-full"
              ariaLabel="Horas sin servicio por AP en los últimos 30 días"
              style={{ height: Math.max(320, data.aps.length * 22 + 24) }}
            />
          )}
        </div>
      </div>

      {/* Estado actual */}
      <div className="rounded-[1.5rem] bg-white border border-slate-200 shadow-2xl shadow-[#254153]/5 overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-gradient-to-r from-white to-slate-50/50">
          <h3 className="text-base font-black text-[#254153] uppercase tracking-tight leading-none">Estado de los AP&apos;s</h3>
          <p className="text-[10px] text-[#749094] font-medium mt-1">Detalle por punto de acceso</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 text-[9px] font-black uppercase tracking-wider text-[#749094]">
                <th className="px-4 py-2 border-b border-slate-200">AP</th>
                <th className="px-4 py-2 border-b border-slate-200">IP</th>
                <th className="px-4 py-2 border-b border-slate-200">Estado</th>
                <th className="px-4 py-2 border-b border-slate-200">Última señal</th>
                <th className="px-4 py-2 text-right border-b border-slate-200">Disp. {windowOpt.label}</th>
                <th className="px-4 py-2 text-right border-b border-slate-200">Latencia prom.</th>
                <th className="px-4 py-2 text-right border-b border-slate-200">Latencia máx.</th>
                <th className="px-4 py-2 text-right bg-[#254153]/5 text-[#254153] border-b border-slate-200">Disp. 30 d</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.summaries.map((s) => {
                const meta = STATUS_META[s.status];
                return (
                  <tr key={s.monitor.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-1.5 font-bold text-[#254153] text-[12px]">{s.monitor.nombre_monitor}</td>
                    <td className="px-4 py-1.5 font-mono text-[11px] text-[#749094]">{s.monitor.target_ip_url}</td>
                    <td className="px-4 py-1.5">
                      <span className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-black uppercase ${meta.className}`}>
                        <meta.icon size={12} />
                        {meta.label}
                      </span>
                    </td>
                    <td className="px-4 py-1.5 text-[11px] text-[#749094]">
                      {s.lastSeen ? dateTimeFmt.format(s.lastSeen) : "—"}
                    </td>
                    <td className="px-4 py-1.5 text-right text-[12px] font-bold text-[#254153]">{fmtPct(s.availability)}</td>
                    <td className="px-4 py-1.5 text-right text-[12px] text-[#254153]">{fmtMs(s.avgLatency)}</td>
                    <td className="px-4 py-1.5 text-right text-[12px] text-[#254153]">{fmtMs(s.maxLatency)}</td>
                    <td className="px-4 py-1.5 text-right bg-[#254153]/[0.02] text-[13px] font-black text-[#254153]">
                      {fmtPct(s.availability30d)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Incidentes */}
      <div className="rounded-[1.5rem] bg-white border border-slate-200 shadow-2xl shadow-[#254153]/5 overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-gradient-to-r from-white to-slate-50/50">
          <h3 className="text-base font-black text-[#254153] uppercase tracking-tight leading-none">Caídas registradas</h3>
          <p className="text-[10px] text-[#749094] font-medium mt-1">Incidentes de los últimos 30 días y caídas en curso</p>
        </div>
        {data.incidents.length === 0 ? (
          <p className="p-6 text-center text-sm text-[#749094]">Sin caídas registradas en el período.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 text-[9px] font-black uppercase tracking-wider text-[#749094]">
                  <th className="px-4 py-2 border-b border-slate-200">AP</th>
                  <th className="px-4 py-2 border-b border-slate-200">Inicio</th>
                  <th className="px-4 py-2 border-b border-slate-200">Fin</th>
                  <th className="px-4 py-2 text-right border-b border-slate-200">Duración</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.incidents.map((i) => {
                  const end = i.fecha_fin ? new Date(i.fecha_fin) : data.loadedAt;
                  const minutes = (end.getTime() - new Date(i.fecha_inicio).getTime()) / 60e3;
                  return (
                    <tr key={i.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-1.5 font-bold text-[#254153] text-[12px]">{apNames.get(i.monitor_id)}</td>
                      <td className="px-4 py-1.5 text-[11px] text-[#749094]">{dateTimeFmt.format(new Date(i.fecha_inicio))}</td>
                      <td className="px-4 py-1.5 text-[11px]">
                        {i.fecha_fin ? (
                          <span className="text-[#749094]">{dateTimeFmt.format(new Date(i.fecha_fin))}</span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded bg-rose-50 px-2 py-0.5 text-[10px] font-black uppercase text-rose-700">
                            <WifiOff size={12} />
                            En curso
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-1.5 text-right text-[12px] font-bold text-[#254153]">{fmtDuration(minutes)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
