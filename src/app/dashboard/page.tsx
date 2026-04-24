"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  Package,
  PlusCircle,
  List,
  ChevronDown,
  ChevronRight,
  Settings,
  LogOut,
  User,
  UserCheck,
  Loader2,
  Table as TableIcon,
  Search,
} from "lucide-react";
import { LogoFPK } from "@/components/LogoFPK";
import { createClient } from "@/lib/supabase";

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any[]>([]);
  const [statuses, setStatuses] = useState<string[]>([]);
  const [filterText, setFilterText] = useState("");

  useEffect(() => {
    async function fetchStats() {
      const supabase = createClient();

      const { data: devices, error } = await supabase.from("ti_productos")
        .select(`
          nombre_dispositivo,
          ti_historial_stock (
            estado,
            created_at
          )
        `);

      if (error) {
        console.error("Error fetching stats:", error);
        setLoading(false);
        return;
      }

      // Process data to get latest status for each device
      const processedDevices = (devices || []).map((d) => {
        const latestHistory = (d.ti_historial_stock as any[])?.sort(
          (a: any, b: any) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        )[0];
        return {
          dispositivo: d.nombre_dispositivo || "Desconocido",
          estado: latestHistory?.estado || "Sin Registro",
        };
      });

      // Aggregate counts
      const aggregation: Record<string, Record<string, number>> = {};
      const allStatuses = new Set<string>();

      processedDevices.forEach((d) => {
        if (!aggregation[d.dispositivo]) {
          aggregation[d.dispositivo] = {};
        }
        aggregation[d.dispositivo][d.estado] =
          (aggregation[d.dispositivo][d.estado] || 0) + 1;
        allStatuses.add(d.estado);
      });

      const finalStats = Object.keys(aggregation)
        .map((device) => ({
          device,
          counts: aggregation[device],
          total: Object.values(aggregation[device]).reduce((a, b) => a + b, 0),
        }))
        .sort((a, b) => b.total - a.total);

      setStats(finalStats);
      setStatuses(Array.from(allStatuses).sort());
      setLoading(false);
    }

    fetchStats();
  }, []);

  const filteredStats = useMemo(() => {
    return stats.filter((row) =>
      row.device.toLowerCase().includes(filterText.toLowerCase()),
    );
  }, [stats, filterText]);

  const statusTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    statuses.forEach((status) => {
      totals[status] = stats.reduce(
        (acc, row) => acc + (row.counts[status] || 0),
        0,
      );
    });
    return totals;
  }, [stats, statuses]);

  const maxStatusCount = useMemo(() => {
    return Math.max(...Object.values(statusTotals), 1);
  }, [statusTotals]);

  return (
    <div className="bg-white min-h-screen">
      <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-[#749094]/10 bg-white/80 px-8 backdrop-blur-md">
        <h2 className="text-xl font-bold text-[#254153]">Panel de Control</h2>
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#749094]/10 ring-4 ring-[#749094]/5">
            <User size={20} className="text-[#254153]" />
          </div>
        </div>
      </header>

      <div className="p-8">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="animate-spin text-[#254153]" size={32} />
          </div>
        ) : (
          <>
            {/* Summary Chart Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
              <div className="lg:col-span-2 rounded-3xl border border-[#749094]/10 bg-white p-8 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-lg font-bold text-[#254153]">
                    Distribución por Estado
                  </h3>
                  <div className="text-xs font-semibold text-[#749094] uppercase tracking-wider">
                    Total: {stats.reduce((acc, row) => acc + row.total, 0)}{" "}
                    Equipos
                  </div>
                </div>
                <div className="space-y-6">
                  {statuses.map((status) => (
                    <div key={status} className="space-y-2">
                      <div className="flex justify-between text-sm font-bold">
                        <span className="text-[#254153]">{status}</span>
                        <span className="text-[#749094]">
                          {statusTotals[status]}
                        </span>
                      </div>
                      <div className="h-3 w-full rounded-full bg-[#749094]/5 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#254153] transition-all duration-1000"
                          style={{
                            width: `${(statusTotals[status] / maxStatusCount) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-[#749094]/10 bg-[#254153] p-8 text-white shadow-xl shadow-[#254153]/20 flex flex-col justify-center overflow-hidden relative">
                <div className="absolute -right-8 -bottom-8 opacity-10">
                  <TableIcon size={160} />
                </div>
                <p className="text-white/60 text-sm font-semibold uppercase tracking-widest mb-2">
                  Estado Crítico
                </p>
                <h4 className="text-5xl font-black mb-4">
                  {statusTotals["mantenimiento"] || 0}
                </h4>
                <p className="text-white/80 text-sm leading-relaxed">
                  Equipos actualmente registrados bajo estado de mantenimiento o
                  revisión técnica.
                </p>
                <div className="mt-8">
                  <Link
                    href="/dashboard/inventory/list"
                    className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-sm font-bold hover:bg-white/20 transition-colors"
                  >
                    Ver Inventario <ChevronRight size={16} />
                  </Link>
                </div>
              </div>
            </div>

            {/* Indicators Table Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-[#254153] rounded-lg text-white">
                    <TableIcon size={20} />
                  </div>
                  <h3 className="text-lg font-bold text-[#254153]">
                    Indicadores de Equipos
                  </h3>
                </div>
                <p className="text-sm text-[#749094]">
                  Resumen detallado de inventario por tipo de dispositivo y
                  estado actual.
                </p>
              </div>

              <div className="relative w-full max-sm:max-w-none max-w-sm">
                <Search
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-[#749094]"
                  size={18}
                />
                <input
                  type="text"
                  value={filterText}
                  onChange={(e) => setFilterText(e.target.value)}
                  placeholder="Filtrar por dispositivo..."
                  className="w-full rounded-2xl border border-[#749094]/20 bg-white py-3 pl-12 pr-4 text-sm shadow-sm transition-all focus:border-[#254153]/30 focus:outline-none focus:ring-4 focus:ring-[#254153]/5 placeholder:text-[#749094]/50"
                />
              </div>
            </div>

            <div className="overflow-hidden rounded-3xl border border-[#749094]/10 bg-white shadow-xl shadow-[#749094]/5">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-[#749094]/10 bg-[#749094]/5 text-xs font-bold uppercase tracking-wider text-[#749094]">
                      <th className="px-6 py-4">Dispositivo</th>
                      {statuses.map((status) => (
                        <th key={status} className="px-6 py-4 text-center">
                          {status}
                        </th>
                      ))}
                      <th className="px-6 py-4 text-right bg-[#254153]/5 text-[#254153]">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#749094]/10 text-sm">
                    {filteredStats.map((row) => (
                      <tr
                        key={row.device}
                        className="transition-colors hover:bg-[#749094]/5"
                      >
                        <td className="px-6 py-4 font-bold text-[#254153]">
                          {row.device}
                        </td>
                        {statuses.map((status) => (
                          <td key={status} className="px-6 py-4 text-center">
                            <span
                              className={`inline-flex items-center justify-center min-w-[2.5rem] px-2 py-1 rounded-lg font-semibold ${
                                row.counts[status]
                                  ? "bg-white border border-[#749094]/20 text-[#254153] shadow-sm"
                                  : "text-[#749094]/30"
                              }`}
                            >
                              {row.counts[status] || 0}
                            </span>
                          </td>
                        ))}
                        <td className="px-6 py-4 text-right font-black text-[#254153] bg-[#254153]/5">
                          {row.total}
                        </td>
                      </tr>
                    ))}
                    {filteredStats.length === 0 && (
                      <tr>
                        <td
                          colSpan={statuses.length + 2}
                          className="px-6 py-12 text-center text-[#749094]"
                        >
                          {filterText
                            ? `No se encontraron resultados para "${filterText}"`
                            : "No hay datos disponibles para mostrar."}
                        </td>
                      </tr>
                    )}
                  </tbody>
                  {filteredStats.length > 0 && (
                    <tfoot>
                      <tr className="bg-[#254153] text-white font-bold">
                        <td className="px-6 py-4 rounded-bl-3xl">
                          TOTAL GENERAL
                        </td>
                        {statuses.map((status) => (
                          <td key={status} className="px-6 py-4 text-center">
                            {filteredStats.reduce(
                              (acc, row) => acc + (row.counts[status] || 0),
                              0,
                            )}
                          </td>
                        ))}
                        <td className="px-6 py-4 text-right rounded-br-3xl">
                          {filteredStats.reduce(
                            (acc, row) => acc + row.total,
                            0,
                          )}
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
