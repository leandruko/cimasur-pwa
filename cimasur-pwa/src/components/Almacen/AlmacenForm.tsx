import React, { useState } from 'react';
import { db } from '../../lib/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { v4 as uuidv4 } from 'uuid';

export const AlmacenForm = () => {
  // Obtenemos fabricaciones para vincular el lote
  const fabricaciones = useLiveQuery(() => db.fabricaciones.toArray());

  const [formData, setFormData] = useState({
    fabricacion_id: '',
    bodega: '',
    estante: '',
    temperatura_control: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const nuevoRegistro = {
      id: uuidv4(),
      ...formData,
      temperatura_control: parseFloat(formData.temperatura_control),
      synced: 0,
      dirty: 1,
      fecha_ingreso: new Date().toISOString()
    };

    await db.almacenamientos.add(nuevoRegistro);
    alert("Ubicación y temperatura registradas con éxito.");
    window.location.href = '/dashboard';
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto bg-slate-900 p-8 rounded-xl border border-slate-800 space-y-6">
      <div className="border-b border-slate-800 pb-4">
        <h2 className="text-xl font-bold text-amber-500">Control de Almacenamiento</h2>
        <p className="text-slate-400 text-sm">Asigne una ubicación física y registre la temperatura del lote.</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm text-slate-300 mb-2">Seleccionar Lote Fabricado</label>
          <select 
            required
            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white outline-none focus:ring-2 focus:ring-amber-500"
            onChange={(e) => setFormData({...formData, fabricacion_id: e.target.value})}
          >
            <option value="">Seleccione un lote...</option>
            {fabricaciones?.map(f => (
              <option key={f.id} value={f.id}>{f.codigo_lote}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-slate-300 mb-2">Bodega</label>
            <input 
              type="text" required placeholder="Ej: Bodega Central"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white outline-none focus:ring-2 focus:ring-amber-500"
              onChange={(e) => setFormData({...formData, bodega: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-2">Estante / Posición</label>
            <input 
              type="text" required placeholder="Ej: A-12"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white outline-none focus:ring-2 focus:ring-amber-500"
              onChange={(e) => setFormData({...formData, estante: e.target.value})}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm text-slate-300 mb-2">Temperatura Controlada (°C)</label>
          <input 
            type="number" step="0.1" required placeholder="Ej: 18.5"
            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white outline-none focus:ring-2 focus:ring-amber-500"
            onChange={(e) => setFormData({...formData, temperatura_control: e.target.value})}
          />
        </div>
      </div>

      <button type="submit" className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-3 rounded-lg shadow-lg shadow-amber-900/20 transition-all">
        GUARDAR EN ALMACÉN
      </button>
    </form>
  );
};