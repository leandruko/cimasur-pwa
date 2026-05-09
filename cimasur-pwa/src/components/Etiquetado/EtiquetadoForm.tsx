import React, { useState } from 'react';
import { supabase } from '../../lib/supabase'; // Conexión directa a Supabase
import { db } from '../../lib/db'; // Para lectura rápida de lotes y responsables
import { useLiveQuery } from 'dexie-react-hooks';

export const EtiquetadoForm = () => {
  // Obtenemos los datos maestros de la memoria local para rapidez
  const fabricaciones = useLiveQuery(() => db.fabricaciones.toArray());
  const usuarios = useLiveQuery(() => db.perfiles.toArray());

  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });

  const [formData, setFormData] = useState({
    lote_id: '', 
    cantidad_etiquetada: '',
    vencimiento_etiqueta: '',
    qa: 'OK', // Cambiado a formato de texto OK/NO
    responsable_id: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.lote_id || !formData.responsable_id) {
      return setMensaje({ tipo: 'error', texto: "Debe seleccionar un lote y un responsable." });
    }

    setLoading(true);
    setMensaje({ tipo: '', texto: '' });

    try {
      // INSERCIÓN O ACTUALIZACIÓN DIRECTA EN SUPABASE
      // Usamos .upsert para manejar la relación 1:1 con el lote
      const { error } = await supabase
        .from('etiquetados')
        .upsert([{
          lote_id: formData.lote_id,
          cantidad_etiquetada: parseInt(formData.cantidad_etiquetada) || 0,
          vencimiento_etiqueta: formData.vencimiento_etiqueta,
          qa: formData.qa,
          responsable_id: formData.responsable_id,
          created_at: new Date().toISOString()
        }], { onConflict: 'lote_id' });

      if (error) throw error;

      setMensaje({ tipo: 'success', texto: `✅ Etiquetado del lote ${formData.lote_id} registrado con éxito en la nube.` });
      
      // Limpiar formulario
      setFormData({
        lote_id: '',
        cantidad_etiquetada: '',
        vencimiento_etiqueta: '',
        qa: 'OK',
        responsable_id: '',
      });

    } catch (error: any) {
      console.error(error);
      setMensaje({ tipo: 'error', texto: `❌ Error al guardar en Supabase: ${error.message}` });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl space-y-6">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
          <span className="w-2 h-8 bg-emerald-500 rounded-full"></span>
          Control de Etiquetado y QA Final (Online)
        </h2>

        {mensaje.texto && (
          <div className={`p-4 rounded-xl border ${mensaje.tipo === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
            {mensaje.texto}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Lote a Etiquetar *</label>
              <select 
                required
                className="w-full bg-slate-800 border border-slate-700 text-white p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
                onChange={(e) => setFormData({...formData, lote_id: e.target.value})}
                value={formData.lote_id}
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
              <label className="block text-sm font-medium text-slate-400 mb-1">Responsable *</label>
              <select 
                required
                className="w-full bg-slate-800 border border-slate-700 text-white p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
                onChange={(e) => setFormData({...formData, responsable_id: e.target.value})}
                value={formData.responsable_id}
              >
                <option value="">Seleccione responsable...</option>
                {usuarios?.map(u => <option key={u.id} value={u.id}>{u.nombre_completo}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Cant. Etiquetada</label>
                <input 
                  type="number"
                  placeholder="0"
                  className="w-full bg-slate-800 border border-slate-700 text-white p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
                  onChange={(e) => setFormData({...formData, cantidad_etiquetada: e.target.value})}
                  value={formData.cantidad_etiquetada}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Venc. Etiqueta</label>
                <input 
                  type="date"
                  className="w-full bg-slate-800 border border-slate-700 text-white p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
                  onChange={(e) => setFormData({...formData, vencimiento_etiqueta: e.target.value})}
                  value={formData.vencimiento_etiqueta}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Validación QA *</label>
              <select 
                className="w-full bg-slate-800 border border-slate-700 text-white p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
                onChange={(e) => setFormData({...formData, qa: e.target.value})}
                value={formData.qa}
              >
                <option value="OK">✅ OK (Aprobado)</option>
                <option value="NO">❌ NO (Rechazado)</option>
              </select>
            </div>
          </div>
        </div>

        <button 
          type="submit"
          disabled={loading}
          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-xl shadow-lg transition-all transform active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? 'SINCRONIZANDO...' : 'FINALIZAR ETIQUETADO Y APROBAR QA'}
        </button>
      </form>
    </div>
  );
};