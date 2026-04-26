import React, { useState } from 'react';
import { db } from '../../lib/db';
import { useLiveQuery } from 'dexie-react-hooks';

export const ReclamoForm = () => {
  const fabricaciones = useLiveQuery(() => db.fabricaciones.toArray());

  const [formData, setFormData] = useState({
    lote_id: '',
    cliente: '',
    tipo_problema: 'Reacción adversa', // PROBLEM_TYPE
    detalles: '',
    estado: 'Abierto'                 // CLAIM_STATUS
  });

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!formData.lote_id || !formData.detalles) {
    return alert("El lote y los detalles son obligatorios para el reporte.");
  }

  try {
    const nuevoReclamo = {
      id: crypto.randomUUID(),
      lote_id: formData.lote_id,
      cliente: formData.cliente,
      tipo_problema: formData.tipo_problema,
      detalles: formData.detalles,
      estado: formData.estado,
      fecha_registro: new Date().toISOString(),
      synced: 0,
      dirty: 1
    };

    await db.reclamos.add(nuevoReclamo);
    
    alert(`✅ Reclamo registrado para el lote ${formData.lote_id}.`);
    window.location.href = '/dashboard';
  } catch (error) {
    console.error(error);
    alert("❌ Error al registrar el reclamo.");
  }
};


  return (
    <div className="max-w-4xl mx-auto p-4">
      <form className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl space-y-6">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
          <span className="w-2 h-8 bg-red-500 rounded-full"></span>
          Gestión de Reclamos e Incidencias
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* VINCULACIÓN Y CLIENTE */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Lote Relacionado</label>
              <select 
                required
                className="w-full bg-slate-800 border border-slate-700 text-white p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-red-500"
                onChange={(e) => setFormData({...formData, lote_id: e.target.value})}
              >
                <option value="">Seleccione el lote...</option>
                {fabricaciones?.map(f => (
                  <option key={f.codigo_lote} value={f.codigo_lote}>{f.codigo_lote} - {f.producto}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Cliente que Reporta</label>
              <input 
                type="text" required
                placeholder="Nombre o Institución"
                className="w-full bg-slate-800 border border-slate-700 text-white p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-red-500"
                onChange={(e) => setFormData({...formData, cliente: e.target.value})}
              />
            </div>
          </div>

          {/* CATEGORIZACIÓN */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Tipo de Problema</label>
              <select 
                className="w-full bg-slate-800 border border-slate-700 text-white p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-red-500"
                onChange={(e) => setFormData({...formData, tipo_problema: e.target.value})}
              >
                <option value="Reacción adversa">Reacción adversa</option>
                <option value="Contaminación">Contaminación</option>
                <option value="Etiqueta incorrecta">Etiqueta incorrecta</option>
                <option value="Fallo terapéutico">Fallo terapéutico</option>
                <option value="Otro">Otro</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Estado del Reclamo</label>
              <select 
                className="w-full bg-slate-800 border border-slate-700 text-white p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-red-500"
                onChange={(e) => setFormData({...formData, estado: e.target.value})}
              >
                <option value="Abierto">Abierto</option>
                <option value="Investigando">Investigando</option>
                <option value="Cerrado">Cerrado</option>
              </select>
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-400 mb-1">Detalles del Reclamo</label>
            <textarea 
              required rows={4}
              placeholder="Describa detalladamente el problema reportado..."
              className="w-full bg-slate-800 border border-slate-700 text-white p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-red-500"
              onChange={(e) => setFormData({...formData, detalles: e.target.value})}
            ></textarea>
          </div>
        </div>

        <button 
          type="submit"
          className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-4 rounded-xl shadow-lg transition-all transform active:scale-95"
        >
          REGISTRAR RECLAMO / INCIDENCIA
        </button>
      </form>
    </div>
  );
};