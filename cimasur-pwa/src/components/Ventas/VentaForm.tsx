import React, { useState } from 'react';
import { db } from '../../lib/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { v4 as uuidv4 } from 'uuid';

export const VentaForm = () => {
  // Obtenemos solo los lotes que ya están en el sistema
  const fabricaciones = useLiveQuery(() => db.fabricaciones.toArray());

  const [formData, setFormData] = useState({
    fabricacion_id: '',
    cliente: '',
    nro_documento: '',
    cantidad_vendida: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const nuevaVenta = {
      id: uuidv4(),
      ...formData,
      cantidad_vendida: parseFloat(formData.cantidad_vendida),
      synced: 0,
      dirty: 1,
      fecha_venta: new Date().toISOString()
    };

    await db.ventas.add(nuevaVenta);
    alert("Venta registrada exitosamente. Ciclo de trazabilidad completado.");
    window.location.href = '/dashboard';
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto bg-slate-900 p-8 rounded-xl border border-slate-800 space-y-6 shadow-2xl">
      <div className="border-b border-slate-800 pb-4">
        <h2 className="text-xl font-bold text-indigo-400">Registro de Venta y Despacho</h2>
        <p className="text-slate-400 text-sm">Vincule un lote a un cliente para finalizar su trazabilidad.</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Seleccionar Lote para Venta</label>
          <select 
            required
            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white outline-none focus:ring-2 focus:ring-indigo-500"
            onChange={(e) => setFormData({...formData, fabricacion_id: e.target.value})}
          >
            <option value="">Seleccione un lote...</option>
            {fabricaciones?.map(f => (
              <option key={f.id} value={f.id}>{f.codigo_lote}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Cliente / Entidad</label>
          <input 
            type="text" required placeholder="Nombre del cliente o empresa"
            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white outline-none focus:ring-2 focus:ring-indigo-500"
            onChange={(e) => setFormData({...formData, cliente: e.target.value})}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">N° Factura / Guía</label>
            <input 
              type="text" required placeholder="Ej: F-1002"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white outline-none focus:ring-2 focus:ring-indigo-500"
              onChange={(e) => setFormData({...formData, nro_documento: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Cantidad Vendida</label>
            <input 
              type="number" step="0.1" required placeholder="Ej: 10.5"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white outline-none focus:ring-2 focus:ring-indigo-500"
              onChange={(e) => setFormData({...formData, cantidad_vendida: e.target.value})}
            />
          </div>
        </div>
      </div>

      <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-lg shadow-lg shadow-indigo-900/20 transition-all">
        FINALIZAR Y REGISTRAR VENTA
      </button>
    </form>
  );
};