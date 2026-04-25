import React from 'react';
import { useOrdenes } from '../hooks/useOrdenes';
import { exportOrdenesToExcel } from '../services/excelService';
import { generateTrazabilidadPDF } from '../services/reportService';
import dayjs from 'dayjs';

export const OrdenesList = () => {
  const { ordenes, stats, loading } = useOrdenes();

  if (loading) return <div className="text-slate-400 font-mono italic">Cargando base de datos local...</div>;

  return (
    <div className="space-y-6">
      {/* Header con Exportación Masiva */}
      <div className="flex justify-between items-end">
        <h2 className="text-xl font-semibold text-slate-300">Registros de Laboratorio</h2>
        <button 
          onClick={() => exportOrdenesToExcel(ordenes || [])}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white text-sm font-bold rounded-lg transition-all shadow-lg shadow-emerald-900/20"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="Ref 12" />
            <path d="M9 17v-2a2 2 0 012-2h2a2 2 0 012 2v2m-6-10V7a2 2 0 012-2h2a2 2 0 012 2v2m0 0h2a2 2 0 012 2v3a2 2 0 01-2 2h-1M6.5 18H3.5a.5.5 0 01-.5-.5v-9a.5.5 0 01.5-.5h3a.5.5 0 01.5.5v9a.5.5 0 01-.5.5z" />
          </svg>
          Exportar Excel (.xlsx)
        </button>
      </div>

      {/* Cards de Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-slate-900 border-l-4 border-blue-600 rounded shadow-md">
          <p className="text-slate-400 text-xs uppercase font-bold tracking-wider">Total Órdenes</p>
          <p className="text-2xl font-bold text-white">{stats?.total}</p>
        </div>
        <div className="p-4 bg-slate-900 border-l-4 border-amber-500 rounded shadow-md">
          <p className="text-slate-400 text-xs uppercase font-bold tracking-wider">Pendientes</p>
          <p className="text-2xl font-bold text-white">{stats?.pendientes}</p>
        </div>
        <div className="p-4 bg-slate-900 border-l-4 border-green-500 rounded shadow-md">
          <p className="text-slate-400 text-xs uppercase font-bold tracking-wider">Sincronizadas</p>
          <p className="text-2xl font-bold text-white">{stats?.sincronizadas}</p>
        </div>
      </div>

      {/* Tabla de Órdenes */}
      <div className="overflow-x-auto bg-slate-900 rounded-lg border border-slate-800 shadow-xl">
        <table className="w-full text-left">
          <thead className="bg-slate-800/50 text-slate-300 text-xs uppercase tracking-widest">
            <tr>
              <th className="p-4 font-semibold">ID / Cliente</th>
              <th className="p-4 font-semibold">Estado</th>
              <th className="p-4 font-semibold">Fecha Registro</th>
              <th className="p-4 font-semibold text-center">Sinc.</th>
              <th className="p-4 font-semibold text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 text-sm">
            {ordenes?.map((orden) => (
              <tr key={orden.id} className="hover:bg-slate-800/30 transition-colors group">
                <td className="p-4">
                  <div className="font-mono font-bold text-blue-400">#{orden.id.slice(0, 8)}</div>
                  <div className="text-slate-300 font-medium">{orden.cliente}</div>
                </td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-tighter ${
                    orden.estado === 'pendiente' ? 'bg-amber-900/30 text-amber-500 border border-amber-800' : 'bg-emerald-900/30 text-emerald-500 border border-emerald-800'
                  }`}>
                    {orden.estado}
                  </span>
                </td>
                <td className="p-4 text-slate-400 font-mono">
                  {dayjs(orden.created_at).format('DD/MM/YYYY HH:mm')}
                </td>
                <td className="p-4 text-center">
                  {orden.synced ? (
                    <span className="text-emerald-500 text-lg" title="Sincronizado con Supabase">●</span>
                  ) : (
                    <span className="text-slate-600 animate-pulse text-lg" title="Pendiente de sincronización">○</span>
                  )}
                </td>
                <td className="p-4 text-right">
                  <button 
                    onClick={() => generateTrazabilidadPDF(orden)}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-slate-800 hover:bg-red-900/40 text-slate-300 hover:text-red-400 border border-slate-700 rounded transition-all text-xs font-bold"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    PDF
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {ordenes?.length === 0 && (
          <div className="p-12 text-center text-slate-500 font-medium italic bg-slate-900/50">
             No se encontraron registros en la base de datos local.
          </div>
        )}
      </div>
    </div>
  );
};