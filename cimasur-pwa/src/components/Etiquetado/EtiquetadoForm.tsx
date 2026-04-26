import React, { useState } from 'react';
import { db } from '../../lib/db';
import { useLiveQuery } from 'dexie-react-hooks';

export const EtiquetadoForm = () => {
  // Selectores dinámicos
  const fabricaciones = useLiveQuery(() => db.fabricaciones.toArray());
  const usuarios = useLiveQuery(() => db.perfiles.toArray());

  const [formData, setFormData] = useState({
    lote_id: '', // Relación 1:1 con Fabricacion.codigo_lote
    cantidad_etiquetada: '',
    vencimiento_etiqueta: '',
    qa: 'true',
    responsable_id: '',
  });
  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!formData.lote_id || !formData.responsable_id) {
    return alert("Debe seleccionar un lote y un responsable para el registro.");
  }

  try {
    const nuevoEtiquetado = {
      lote_id: formData.lote_id, // Primary Key (1:1 con Fabricacion)
      cantidad_etiquetada: parseInt(formData.cantidad_etiquetada),
      vencimiento_etiqueta: formData.vencimiento_etiqueta,
      qa: formData.qa === 'true',
      responsable_id: formData.responsable_id,
      fecha_registro: new Date().toISOString(),
      synced: 0,
      dirty: 1
    };

    // Usamos .put para cumplir con el comportamiento OneToOne de Django (update or create)
    await db.etiquetados.put(nuevoEtiquetado);
    
    alert(`✅ Etiquetado del lote ${formData.lote_id} registrado correctamente.`);
    window.location.href = '/dashboard';
  } catch (error) {
    console.error(error);
    alert("❌ Error al registrar el etiquetado.");
  }
};

  return (
    <div className="max-w-4xl mx-auto p-4">
      <form className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl space-y-6">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
          <span className="w-2 h-8 bg-emerald-500 rounded-full"></span>
          Control de Etiquetado y QA Final
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* SELECCIÓN DE LOTE Y RESPONSABLE */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Lote a Etiquetar</label>
              <select 
                className="w-full bg-slate-800 border border-slate-700 text-white p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
                onChange={(e) => setFormData({...formData, lote_id: e.target.value})}
              >
                <option value="">Seleccione lote...</option>
                {fabricaciones?.map(f => (
                  <option key={f.codigo_lote} value={f.codigo_lote}>
                    {f.codigo_lote} - {f.producto}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Responsable del Proceso</label>
              <select 
                className="w-full bg-slate-800 border border-slate-700 text-white p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
                onChange={(e) => setFormData({...formData, responsable_id: e.target.value})}
              >
                <option value="">Seleccione responsable...</option>
                {usuarios?.map(u => <option key={u.id} value={u.id}>{u.nombre_completo}</option>)}
              </select>
            </div>
          </div>

          {/* DATOS TÉCNICOS DEL ETIQUETADO */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Cant. Etiquetada</label>
                <input 
                  type="number"
                  placeholder="0"
                  className="w-full bg-slate-800 border border-slate-700 text-white p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
                  onChange={(e) => setFormData({...formData, cantidad_etiquetada: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Venc. Etiqueta</label>
                <input 
                  type="date"
                  className="w-full bg-slate-800 border border-slate-700 text-white p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
                  onChange={(e) => setFormData({...formData, vencimiento_etiqueta: e.target.value})}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Validación QA (Etiqueta/Envase)</label>
              <select 
                className="w-full bg-slate-800 border border-slate-700 text-white p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
                onChange={(e) => setFormData({...formData, qa: e.target.value})}
              >
                <option value="true">✅ OK (Aprobado)</option>
                <option value="false">❌ NO (Rechazado)</option>
              </select>
            </div>
          </div>

        </div>

        <button 
          type="submit"
          className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-bold py-4 rounded-xl shadow-lg transform transition active:scale-95"
        >
          FINALIZAR ETIQUETADO Y APROBAR QA
        </button>
      </form>
    </div>
  );
};