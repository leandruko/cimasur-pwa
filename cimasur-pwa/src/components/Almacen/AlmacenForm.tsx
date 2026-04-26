import React, { useState } from 'react';
import { db } from '../../lib/db';
import { useLiveQuery } from 'dexie-react-hooks';

export const AlmacenForm = () => {
  // Obtenemos los lotes fabricados y los usuarios para los selectores
  const fabricaciones = useLiveQuery(() => db.fabricaciones.toArray());
  const usuarios = useLiveQuery(() => db.perfiles.toArray());

  const [formData, setFormData] = useState({
    lote_id: '', // Relación 1:1 con Fabricacion.codigo_lote
    ubicacion: '',
    temperatura_verificada: '',
    responsable_id: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.lote_id || !formData.responsable_id || !formData.ubicacion) {
      return alert("Debe seleccionar un lote, una ubicación y un responsable.");
    }

    try {
      const nuevoAlmacen = {
        lote_id: formData.lote_id, // Usamos el código del lote como ID
        ubicacion: formData.ubicacion,
        temperatura_verificada: parseFloat(formData.temperatura_verificada) || 0,
        responsable_id: formData.responsable_id,
        fecha_registro: new Date().toISOString(),
        synced: 0,
        dirty: 1
      };

      // Al ser 1:1, usamos .put para que si ya existe, se actualice (comportamiento Django)
      await db.almacenamientos.put(nuevoAlmacen);
      
      alert(`✅ Ubicación del lote ${formData.lote_id} registrada con éxito.`);
      window.location.href = '/dashboard';
    } catch (error) {
      console.error(error);
      alert("❌ Error al registrar el almacenamiento.");
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      {/* CORRECCIÓN: Agregado onSubmit={handleSubmit} */}
      <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl space-y-6">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
          <span className="w-2 h-8 bg-amber-500 rounded-full"></span>
          Ingreso a Almacenamiento
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* SELECCIÓN DE LOTE */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Lote Fabricado</label>
              {/* CORRECCIÓN: Agregado value={formData.lote_id} */}
              <select 
                className="w-full bg-slate-800 border border-slate-700 text-white p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-amber-500"
                onChange={(e) => setFormData({...formData, lote_id: e.target.value})}
                value={formData.lote_id}
              >
                <option value="">Seleccione el lote...</option>
                {fabricaciones?.map(f => (
                  <option key={f.codigo_lote} value={f.codigo_lote}>
                    {f.codigo_lote} - {f.producto}
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-slate-500 mt-1 italic font-mono uppercase">Solo lotes registrados en fabricación</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Responsable del Ingreso</label>
              {/* CORRECCIÓN: Agregado value={formData.responsable_id} */}
              <select 
                className="w-full bg-slate-800 border border-slate-700 text-white p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-amber-500"
                onChange={(e) => setFormData({...formData, responsable_id: e.target.value})}
                value={formData.responsable_id}
              >
                <option value="">Seleccione responsable...</option>
                {usuarios?.map(u => <option key={u.id} value={u.id}>{u.nombre_completo}</option>)}
              </select>
            </div>
          </div>

          {/* DATOS DE UBICACIÓN Y CONTROL */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Ubicación Física (Bodega/Estante)</label>
              {/* CORRECCIÓN: Agregado value={formData.ubicacion} */}
              <input 
                type="text"
                placeholder="Ej: Bodega Central - Sector A1"
                className="w-full bg-slate-800 border border-slate-700 text-white p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-amber-500"
                onChange={(e) => setFormData({...formData, ubicacion: e.target.value})}
                value={formData.ubicacion}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Temperatura Verificada (°C)</label>
              {/* CORRECCIÓN: Agregado value={formData.temperatura_verificada} */}
              <input 
                type="number"
                step="0.1"
                placeholder="Ej: 15.5"
                className="w-full bg-slate-800 border border-slate-700 text-white p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-amber-500"
                onChange={(e) => setFormData({...formData, temperatura_verificada: e.target.value})}
                value={formData.temperatura_verificada}
              />
            </div>
          </div>

        </div>

        <button 
          type="submit"
          className="w-full bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold py-4 rounded-xl shadow-lg transform transition active:scale-95"
        >
          REGISTRAR UBICACIÓN Y CONTROL
        </button>
      </form>
    </div>
  );
};