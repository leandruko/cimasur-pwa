import React, { useState } from 'react';
import { db } from '../../lib/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { v4 as uuidv4 } from 'uuid';

export const EtiquetadoForm = () => {
  // Solo mostramos lotes que existen en fabricaciones
  const fabricaciones = useLiveQuery(() => db.fabricaciones.toArray());

  const [formData, setFormData] = useState({
    fabricacion_id: '',
    estado_qa: 'pendiente',
    observaciones: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const nuevoEtiquetado = {
      id: uuidv4(),
      ...formData,
      synced: 0,
      dirty: 1,
      fecha_etiquetado: new Date().toISOString()
    };

    await db.etiquetados.add(nuevoEtiquetado);
    alert(`Control de calidad registrado como: ${formData.estado_qa.toUpperCase()}`);
    window.location.href = '/dashboard';
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto bg-slate-900 p-8 rounded-xl border border-slate-800 space-y-6 shadow-2xl">
      <div className="border-b border-slate-800 pb-4">
        <h2 className="text-xl font-bold text-emerald-500">Control de Etiquetado y QA</h2>
        <p className="text-slate-400 text-sm">Valide la calidad del lote fabricado para su liberación.</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Seleccionar Lote</label>
          <select 
            required
            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-emerald-500 outline-none"
            onChange={(e) => setFormData({...formData, fabricacion_id: e.target.value})}
          >
            <option value="">Seleccione un lote para QA...</option>
            {fabricaciones?.map(f => (
              <option key={f.id} value={f.id}>{f.codigo_lote}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Estado de Calidad (QA)</label>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setFormData({...formData, estado_qa: 'aprobado'})}
              className={`p-3 rounded-lg border font-bold transition-all ${
                formData.estado_qa === 'aprobado' 
                ? 'bg-emerald-600 border-emerald-400 text-white shadow-lg shadow-emerald-900/40' 
                : 'bg-slate-950 border-slate-700 text-slate-500'
              }`}
            >
              ✅ APROBADO
            </button>
            <button
              type="button"
              onClick={() => setFormData({...formData, estado_qa: 'rechazado'})}
              className={`p-3 rounded-lg border font-bold transition-all ${
                formData.estado_qa === 'rechazado' 
                ? 'bg-red-600 border-red-400 text-white shadow-lg shadow-red-900/40' 
                : 'bg-slate-950 border-slate-700 text-slate-500'
              }`}
            >
              ❌ RECHAZADO
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Observaciones de Calidad</label>
          <textarea 
            rows={3}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-emerald-500 outline-none"
            placeholder="Detalle hallazgos o motivos del estado..."
            value={formData.observaciones}
            onChange={(e) => setFormData({...formData, observaciones: e.target.value})}
          />
        </div>
      </div>

      <button 
        type="submit" 
        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-lg transition-all"
      >
        REGISTRAR CONTROL DE CALIDAD
      </button>
    </form>
  );
};