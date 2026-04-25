import React, { useState } from 'react';
import { db } from '../../lib/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { v4 as uuidv4 } from 'uuid';

export const ReclamoForm = () => {
  const fabricaciones = useLiveQuery(() => db.fabricaciones.toArray());

  const [formData, setFormData] = useState({
    fabricacion_id: '',
    descripcion: '',
    resolucion: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const nuevoReclamo = {
      id: uuidv4(),
      ...formData,
      synced: 0,
      dirty: 1,
      fecha_reclamo: new Date().toISOString()
    };

    await db.reclamos.add(nuevoReclamo);
    alert("Reclamo registrado. Se ha marcado en el historial del lote.");
    window.location.href = '/dashboard';
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto bg-slate-900 p-8 rounded-xl border border-slate-800 space-y-6 shadow-2xl">
      <div className="border-b border-slate-800 pb-4">
        <h2 className="text-xl font-bold text-red-500">Gestión de Reclamos</h2>
        <p className="text-slate-400 text-sm">Registre incidencias reportadas por clientes sobre un lote.</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Lote Afectado</label>
          <select 
            required
            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-red-500 outline-none"
            onChange={(e) => setFormData({...formData, fabricacion_id: e.target.value})}
          >
            <option value="">Seleccione el lote del reclamo...</option>
            {fabricaciones?.map(f => (
              <option key={f.id} value={f.id}>{f.codigo_lote}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Descripción del Problema</label>
          <textarea 
            required rows={3}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-red-500 outline-none"
            placeholder="¿Qué reportó el cliente?"
            onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Resolución / Acción Tomada</label>
          <textarea 
            rows={2}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-red-500 outline-none"
            placeholder="Ej: Se repuso el producto, se eliminó el lote..."
            onChange={(e) => setFormData({...formData, resolucion: e.target.value})}
          />
        </div>
      </div>

      <button type="submit" className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-lg transition-all">
        REGISTRAR INCIDENCIA
      </button>
    </form>
  );
};