import React from 'react';
import { useOrdenes } from '../hooks/useOrdenes';
import dayjs from 'dayjs';

export const OrdenesList = () => {
  const { ordenes, stats, loading } = useOrdenes();

  if (loading) return <div className="text-slate-400">Cargando base de datos local...</div>;

  return (
    <div className="space-y-6">
      {/* Cards de Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-slate-900 border-l-4 border-blue-600 rounded">
          <p className="text-slate-400 text-sm uppercase">Total Órdenes</p>
          <p className="text-2xl font-bold">{stats?.total}</p>
        </div>
        <div className="p-4 bg-slate-900 border-l-4 border-amber-500 rounded">
          <p className="text-slate-400 text-sm uppercase">Pendientes</p>
          <p className="text-2xl font-bold">{stats?.pendientes}</p>
        </div>
        <div className="p-4 bg-slate-900 border-l-4 border-green-500 rounded">
          <p className="text-slate-400 text-sm uppercase">Sincronizadas</p>
          <p className="text-2xl font-bold">{stats?.sincronizadas}</p>
        </div>
      </div>

      {/* Tabla/Lista de Órdenes */}
      <div className="overflow-x-auto bg-slate-900 rounded-lg border border-slate-800">
        <table className="w-full text-left">
          <thead className="bg-slate-800 text-slate-300 text-sm">
            <tr>
              <th className="p-4 font-medium">ID / Cliente</th>
              <th className="p-4 font-medium">Estado</th>
              <th className="p-4 font-medium">Fecha</th>
              <th className="p-4 font-medium text-right">Sinc.</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {ordenes?.map((orden) => (
              <tr key={orden.id} className="hover:bg-slate-800/50 transition-colors">
                <td className="p-4">
                  <div className="font-bold text-blue-400">{orden.id.slice(0, 8)}</div>
                  <div className="text-sm text-slate-400">{orden.cliente}</div>
                </td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                    orden.estado === 'pendiente' ? 'bg-amber-900/50 text-amber-400' : 'bg-green-900/50 text-green-400'
                  }`}>
                    {orden.estado}
                  </span>
                </td>
                <td className="p-4 text-sm text-slate-400">
                  {dayjs(orden.created_at).format('DD/MM/YYYY HH:mm')}
                </td>
                <td className="p-4 text-right">
                  {orden.synced ? (
                    <span className="text-green-500" title="Sincronizado">✔</span>
                  ) : (
                    <span className="text-slate-500 animate-pulse" title="Pendiente de red">☁</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {ordenes?.length === 0 && (
          <div className="p-8 text-center text-slate-500 italic">No hay órdenes registradas localmente.</div>
        )}
      </div>
    </div>
  );
};