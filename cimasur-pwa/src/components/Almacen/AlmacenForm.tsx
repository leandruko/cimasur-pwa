import React, { useState } from 'react';
import { supabase } from '../../lib/supabase'; // Conexión directa
import { db } from '../../lib/db'; // Para leer responsables y lotes rápido
import { useLiveQuery } from 'dexie-react-hooks';

export const AlmacenForm = () => {
  // Seguimos leyendo de Dexie para que los selectores carguen al instante (offline-ready para lectura)
  const fabricaciones = useLiveQuery(() => db.fabricaciones.toArray());
  const usuarios = useLiveQuery(() => db.perfiles.toArray());

  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });

  const [formData, setFormData] = useState({
    lote_id: '', 
    ubicacion: '',
    temperatura_verificada: '',
    responsable_id: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.lote_id || !formData.responsable_id || !formData.ubicacion) {
      return setMensaje({ tipo: 'error', texto: "Debe completar los campos obligatorios." });
    }

    setLoading(true);
    setMensaje({ tipo: '', texto: '' });

    try {
      // INSERCIÓN O ACTUALIZACIÓN DIRECTA EN SUPABASE
      // Usamos .upsert porque el almacenamiento suele ser 1:1 con el lote
      const { error } = await supabase
        .from('almacenamientos')
        .upsert([{
          lote_id: formData.lote_id,
          ubicacion: formData.ubicacion,
          temperatura_verificada: parseFloat(formData.temperatura_verificada) || 0,
          responsable_id: formData.responsable_id,
          created_at: new Date().toISOString()
        }], { onConflict: 'lote_id' }); // Si el lote ya tiene ubicación, se actualiza

      if (error) throw error;

      setMensaje({ tipo: 'success', texto: `✅ Lote ${formData.lote_id} almacenado correctamente en la nube.` });
      
      // Limpiar formulario
      setFormData({
        lote_id: '',
        ubicacion: '',
        temperatura_verificada: '',
        responsable_id: '',
      });

    } catch (error: any) {
      console.error(error);
      setMensaje({ tipo: 'error', texto: `❌ Error en Supabase: ${error.message}` });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl space-y-6">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
          <span className="w-2 h-8 bg-amber-500 rounded-full"></span>
          Ingreso a Almacenamiento (Online)
        </h2>

        {mensaje.texto && (
          <div className={`p-4 rounded-xl border ${mensaje.tipo === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
            {mensaje.texto}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Lote Fabricado *</label>
              <select 
                required
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
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Responsable *</label>
              <select 
                required
                className="w-full bg-slate-800 border border-slate-700 text-white p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-amber-500"
                onChange={(e) => setFormData({...formData, responsable_id: e.target.value})}
                value={formData.responsable_id}
              >
                <option value="">Seleccione responsable...</option>
                {usuarios?.map(u => <option key={u.id} value={u.id}>{u.nombre_completo}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Ubicación Física *</label>
              <input 
                required
                type="text"
                placeholder="Ej: Bodega Central - Sector A1"
                className="w-full bg-slate-800 border border-slate-700 text-white p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-amber-500"
                onChange={(e) => setFormData({...formData, ubicacion: e.target.value})}
                value={formData.ubicacion}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Temperatura (°C)</label>
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
          disabled={loading}
          className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-4 rounded-xl shadow-lg transition-all transform active:scale-95 disabled:opacity-50"
        >
          {loading ? 'CONECTANDO CON NUBE...' : 'REGISTRAR ALMACENAMIENTO'}
        </button>
      </form>
    </div>
  );
};