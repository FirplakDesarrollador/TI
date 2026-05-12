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
  Monitor,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
  AlertTriangle,
  ArrowUpRight
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { LogoFPK } from "@/components/LogoFPK";
import { createClient } from "@/lib/supabase";

const COLORS = ['#254153', '#749094', '#94A3B8', '#CBD5E1', '#E2E8F0'];

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [inventoryStats, setInventoryStats] = useState<any[]>([]);
  const [requestStats, setRequestStats] = useState<any>({ total: 0, pendiente: 0, aprobado: 0, rechazado: 0 });
  const [assignmentStats, setAssignmentStats] = useState<any[]>([]);
  const [statuses, setStatuses] = useState<string[]>([]);
  const [filterText, setFilterText] = useState("");

  const supabase = createClient();

  useEffect(() => {
    async function fetchAllData() {
      setLoading(true);
      try {
        // 1. Fetch Inventory Stats
        const { data: devices } = await supabase.from("ti_productos")
          .select(`
            nombre_dispositivo,
            ti_historial_stock (
              estado,
              created_at
            )
          `);

        // 2. Fetch Request Stats
        const { data: requests } = await supabase.from("ti_solicitudes_dispositivos").select("estado");
        
        // 3. Fetch Assignment Stats (last 6 months)
        const { data: assignments } = await supabase.from("ti_asignaciones").select("created_at");

        // Process Inventory
        const aggregation: Record<string, Record<string, number>> = {};
        const allStatuses = new Set<string>();
        const statusGlobal: Record<string, number> = {};

        (devices || []).forEach((d) => {
          const latestHistory = (d.ti_historial_stock as any[])?.sort(
            (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
          )[0];
          const estado = latestHistory?.estado || "Sin Registro";
          const nombre = d.nombre_dispositivo || "Desconocido";

          if (!aggregation[nombre]) aggregation[nombre] = {};
          aggregation[nombre][estado] = (aggregation[nombre][estado] || 0) + 1;
          statusGlobal[estado] = (statusGlobal[estado] || 0) + 1;
          allStatuses.add(estado);
        });

        setInventoryStats(Object.keys(aggregation).map(device => ({
          device,
          counts: aggregation[device],
          total: Object.values(aggregation[device]).reduce((a, b) => a + b, 0),
        })).sort((a, b) => b.total - a.total));
        
        setStatuses(Array.from(allStatuses).sort());

        // Process Requests
        const reqSummary = { total: requests?.length || 0, pendiente: 0, aprobado: 0, rechazado: 0 };
        requests?.forEach(r => {
          const s = r.estado?.toLowerCase();
          if (s === 'pendiente') reqSummary.pendiente++;
          else if (s === 'aprobado') reqSummary.aprobado++;
          else if (s === 'rechazado') reqSummary.rechazado++;
        });
        setRequestStats(reqSummary);

        // Process Assignments for Chart
        const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        const currentMonth = new Date().getMonth();
        const chartData = Array.from({ length: 6 }).map((_, i) => {
          const monthIdx = (currentMonth - (5 - i) + 12) % 12;
          return { name: months[monthIdx], value: 0 };
        });

        assignments?.forEach(a => {
          const date = new Date(a.created_at);
          const monthLabel = months[date.getMonth()];
          const dataPoint = chartData.find(d => d.name === monthLabel);
          if (dataPoint) dataPoint.value++;
        });
        setAssignmentStats(chartData);

      } catch (err) {
        console.error("Error fetching dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchAllData();
  }, []);

  const filteredStats = useMemo(() => {
    return inventoryStats.filter((row) =>
      row.device.toLowerCase().includes(filterText.toLowerCase()),
    );
  }, [inventoryStats, filterText]);

  const pieData = useMemo(() => {
    const data: Record<string, number> = {};
    inventoryStats.forEach(row => {
      Object.entries(row.counts).forEach(([status, count]) => {
        data[status] = (data[status] || 0) + (count as number);
      });
    });
    return Object.entries(data).map(([name, value]) => ({ name, value }));
  }, [inventoryStats]);

  const requestChartData = useMemo(() => [
    { name: 'Pendientes', value: requestStats.pendiente, fill: '#f59e0b' },
    { name: 'Aprobados', value: requestStats.aprobado, fill: '#10b981' },
    { name: 'Rechazados', value: requestStats.rechazado, fill: '#f43f5e' },
  ], [requestStats]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC]">
        <div className="flex flex-col items-center gap-4">
          <div className="relative flex items-center justify-center">
             <div className="absolute h-24 w-24 rounded-full border-4 border-[#254153]/10 border-t-[#254153] animate-spin" />
             <TrendingUp className="h-8 w-8 text-[#254153] animate-pulse" />
          </div>
          <p className="text-sm font-black text-[#254153] uppercase tracking-[0.2em] animate-pulse mt-4">Analizando Datos BI...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Header BI Style */}
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 px-4 py-3 backdrop-blur-xl sm:px-8 sm:py-4">
        <div className="mx-auto flex max-w-[90rem] items-center justify-between">
          <div className="flex items-center gap-3 pl-12 sm:gap-4 sm:pl-0">
            <div className="hidden h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#254153] to-[#1a2e3b] text-white shadow-lg shadow-[#254153]/20 sm:flex">
              <TrendingUp size={24} />
            </div>
            <div>
              <h1 className="text-lg font-black text-[#254153] tracking-tighter uppercase sm:text-2xl">BI Analytics</h1>
              <p className="text-[8px] font-bold text-[#749094] uppercase tracking-widest sm:text-[10px]">Resumen Ejecutivo de Gestión TI</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <div className="hidden sm:flex flex-col items-end mr-4">
                <span className="text-xs font-black text-[#254153]">Panel Principal</span>
                <span className="text-[10px] text-[#749094] flex items-center gap-1">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> En vivo
                </span>
             </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[90rem] p-8 space-y-8">
        
        {/* KPI Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          <KPICard 
            title="Inventario Activo" 
            value={inventoryStats.reduce((a, b) => a + b.total, 0)} 
            icon={<Package size={24} />} 
            trend="Total Registrado" 
            color="indigo"
          />
          <KPICard 
            title="Solicitudes Pendientes" 
            value={requestStats.pendiente} 
            icon={<Clock size={24} />} 
            trend="Requiere Aprobación" 
            color="amber"
          />
          <KPICard 
            title="Entregas Exitosas" 
            value={requestStats.aprobado} 
            icon={<CheckCircle2 size={24} />} 
            trend="Histórico Aprobado" 
            color="emerald"
          />
          <KPICard 
            title="Equipos Críticos" 
            value={inventoryStats.reduce((acc, row) => acc + (row.counts['reparacion'] || 0), 0)} 
            icon={<AlertTriangle size={24} />} 
            trend="En Reparación" 
            color="rose"
          />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Trend Chart */}
          <div className="lg:col-span-8 rounded-[2.5rem] bg-white p-8 border border-slate-200 shadow-xl shadow-slate-200/20">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-lg font-black text-[#254153] uppercase tracking-tight">Tendencia de Entregas</h3>
                <p className="text-xs text-[#749094] font-medium">Volumen de actas generadas (Últimos 6 meses)</p>
              </div>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={assignmentStats}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#254153" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#254153" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 600}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 600}} dx={-10} />
                  <Tooltip 
                    cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }}
                    contentStyle={{borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '12px 16px'}}
                    itemStyle={{fontWeight: '900', color: '#254153'}}
                    labelStyle={{color: '#749094', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px'}}
                  />
                  <Area type="monotone" dataKey="value" stroke="#254153" strokeWidth={4} fillOpacity={1} fill="url(#colorValue)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Secondary Charts Column */}
          <div className="lg:col-span-4 grid grid-rows-2 gap-8">
            {/* Distribution Pie Chart */}
            <div className="rounded-[2.5rem] bg-white p-8 border border-slate-200 shadow-xl shadow-slate-200/20 flex flex-col relative overflow-hidden">
              <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-indigo-50/50 blur-2xl" />
              <div className="mb-4 relative z-10">
                <h3 className="text-lg font-black text-[#254153] uppercase tracking-tight">Estado del Stock</h3>
              </div>
              <div className="flex-1 flex items-center justify-center relative z-10">
                 <div className="h-[140px] w-full relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={70}
                          paddingAngle={6}
                          dataKey="value"
                          stroke="none"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                          itemStyle={{fontWeight: 'bold', color: '#254153'}}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                       <span className="text-2xl font-black text-[#254153]">{inventoryStats.reduce((a, b) => a + b.total, 0)}</span>
                    </div>
                 </div>
              </div>
            </div>

            {/* Requests Status Bar Chart */}
            <div className="rounded-[2.5rem] bg-white p-8 border border-slate-200 shadow-xl shadow-slate-200/20 flex flex-col relative overflow-hidden">
              <div className="absolute -left-10 -bottom-10 h-32 w-32 rounded-full bg-emerald-50/50 blur-2xl" />
              <div className="mb-4 relative z-10">
                <h3 className="text-lg font-black text-[#254153] uppercase tracking-tight">Solicitudes</h3>
              </div>
              <div className="flex-1 flex items-end relative z-10 pb-4">
                 <div className="h-[120px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={requestChartData} margin={{top: 10, right: 0, left: -20, bottom: 0}}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 'bold'}} dy={5}/>
                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                        <Tooltip 
                          cursor={{fill: '#f1f5f9', radius: 8}}
                          contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                        />
                        <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                          {requestChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                 </div>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Table Section */}
        <div className="rounded-[2.5rem] bg-white border border-slate-200 shadow-2xl shadow-[#254153]/5 overflow-hidden">
          <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gradient-to-r from-white to-slate-50/50">
             <div>
                <h3 className="text-xl font-black text-[#254153] uppercase tracking-tight">Desglose Técnico de Inventario</h3>
                <p className="text-xs text-[#749094] font-medium mt-1">Análisis detallado por categoría de dispositivo</p>
             </div>
             <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94a3b8]" size={18} />
                <input 
                  type="text" 
                  value={filterText}
                  onChange={(e) => setFilterText(e.target.value)}
                  placeholder="Buscar equipo específico..."
                  className="pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-semibold focus:outline-none focus:border-[#254153]/30 focus:ring-4 focus:ring-[#254153]/5 transition-all w-full md:w-80 shadow-sm"
                />
             </div>
          </div>
          <div className="overflow-x-auto">
             <table className="w-full text-left border-collapse">
                <thead>
                   <tr className="bg-slate-50/80 text-[10px] font-black uppercase tracking-widest text-[#749094]">
                      <th className="px-8 py-5 border-b border-slate-200">Dispositivo</th>
                      {statuses.map(s => <th key={s} className="px-8 py-5 text-center border-b border-slate-200">{s}</th>)}
                      <th className="px-8 py-5 text-right bg-[#254153]/5 text-[#254153] border-b border-slate-200">TOTAL</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                   {filteredStats.map(row => (
                     <tr key={row.device} className="hover:bg-slate-50/80 transition-colors group">
                        <td className="px-8 py-5">
                           <div className="flex items-center gap-4">
                              <div className="h-10 w-10 rounded-xl bg-white border border-slate-100 shadow-sm flex items-center justify-center text-[#254153] group-hover:scale-110 group-hover:border-[#254153]/20 transition-all">
                                 <Monitor size={18} />
                              </div>
                              <span className="font-bold text-[#254153] text-sm">{row.device}</span>
                           </div>
                        </td>
                        {statuses.map(s => (
                          <td key={s} className="px-8 py-5 text-center">
                             <span className={`px-3 py-1.5 rounded-lg text-xs font-black transition-colors ${row.counts[s] ? 'bg-slate-100 text-[#254153] shadow-inner' : 'text-slate-300'}`}>
                                {row.counts[s] || 0}
                             </span>
                          </td>
                        ))}
                        <td className="px-8 py-5 text-right bg-[#254153]/[0.02]">
                           <span className="text-lg font-black text-[#254153]">{row.total}</span>
                        </td>
                     </tr>
                   ))}
                </tbody>
             </table>
          </div>
        </div>
      </main>
    </div>
  );
}

function KPICard({ title, value, icon, trend, color }: any) {
  const styles: any = {
    indigo: {
      bg: 'bg-indigo-600',
      text: 'text-indigo-600',
      light: 'bg-indigo-50',
      shadow: 'shadow-indigo-500/20'
    },
    amber: {
      bg: 'bg-amber-500',
      text: 'text-amber-600',
      light: 'bg-amber-50',
      shadow: 'shadow-amber-500/20'
    },
    emerald: {
      bg: 'bg-emerald-500',
      text: 'text-emerald-600',
      light: 'bg-emerald-50',
      shadow: 'shadow-emerald-500/20'
    },
    rose: {
      bg: 'bg-rose-500',
      text: 'text-rose-600',
      light: 'bg-rose-50',
      shadow: 'shadow-rose-500/20'
    }
  }

  const s = styles[color];

  return (
    <div className="relative overflow-hidden rounded-[2.5rem] bg-white p-8 border border-slate-200 shadow-xl shadow-slate-200/20 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 group">
      <div className={`absolute -right-6 -top-6 h-32 w-32 rounded-full ${s.light} blur-3xl opacity-50 transition-opacity group-hover:opacity-100`} />
      
      <div className="relative z-10 flex items-start justify-between mb-8">
        <div className={`h-14 w-14 rounded-2xl ${s.bg} flex items-center justify-center text-white shadow-lg ${s.shadow} transform group-hover:scale-110 transition-transform duration-300`}>
          {icon}
        </div>
        <div className={`text-[10px] font-black ${s.text} uppercase tracking-widest px-3 py-1.5 rounded-lg ${s.light}`}>
          {trend}
        </div>
      </div>
      
      <div className="relative z-10 space-y-2">
        <p className="text-xs font-bold text-[#749094] uppercase tracking-tighter">{title}</p>
        <div className="flex items-baseline gap-2">
          <h4 className="text-4xl font-black text-[#254153]">{value}</h4>
        </div>
      </div>
    </div>
  )
}

