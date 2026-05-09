import React, { useState } from 'react';
import { supabase } from '../../lib/supabase'; // Conexión directa a Supabase
import { db } from '../../lib/db'; // Para leer lotes fabricados de la memoria local
import { useLiveQuery } from 'dexie-react-hooks';

export const ReclamoForm = () => {
  // Obtenemos los lotes para vincular el reclamo
  const fabricaciones = useLiveQuery(() => db.fabricaciones.toArray());

  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });

  const [formData, setFormData] = useState({
    lote_id: '',
    cliente: '',
    tipo_reclamo: 'Reacción adversa',
    descripcion: '',
    estado: 'Abierto'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.lote_id || !formData.descripcion) {
      return setMensaje({ tipo: 'error', texto: "El lote y la descripción son obligatorios." });
    }

    setLoading(true);
    setMensaje({ tipo: '', texto: '' });

    try {
      // INSERCIÓN DIRECTA EN SUPABASE
      const { error } = await supabase
        .from('reclamos')
        .insert([{
          id: crypto.randomUUID(),
          lote_id: formData.lote_id,
          cliente: formData.cliente,
          tipo_reclamo: formData.tipo_reclamo,
          descripcion: formData.descripcion,
          estado: formData.estado,
          created_at: new Date().toISOString()
        }]);

      if (error) throw error;

      setMensaje({ 
        tipo: 'success', 
        texto: `✅ Reclamo registrado con éxito para el lote ${formData.lote_id}.` 
      });
      
      // Limpiar formulario
      setFormData({
        lote_id: '',
        cliente: '',
        tipo_reclamo: 'Reacción adversa',
        descripcion: '',
        estado: 'Abierto'
      });

    } catch (error: any) {
      console.error(error);
      setMensaje({ tipo: 'error', texto: `❌ Error al guardar reclamo: ${error.message}` });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl space-y-6">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
          <span className="w-2 h-8 bg-red-500 rounded-full"></span>
          Gestión de Reclamos e Incidencias (Online)
        </h2>

        {mensaje.texto && (
          <div className={`p-4 rounded-xl border ${mensaje.tipo === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
            {mensaje.texto}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Lote Relacionado *</label>
              <select 
                required
                className="w-full bg-slate-800 border border-slate-700 text-white p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-red-500"
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
              <label className="block text-sm font-medium text-slate-400 mb-1">Cliente que Reporta</label>
              <input 
                type="text" 
                placeholder="Nombre o Institución"
                className="w-full bg-slate-800 border border-slate-700 text-white p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-red-500"
                onChange={(e) => setFormData({...formData, cliente: e.target.value})}
                value={formData.cliente}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Tipo de Problema</label>
              <select 
                className="w-full bg-slate-800 border border-slate-700 text-white p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-red-500"
                onChange={(e) => setFormData({...formData, tipo_reclamo: e.target.value})}
                value={formData.tipo_reclamo}
              >
                <option value="Reacción adversa">Reacción adversa</option>
                <option value="Contaminación">Contaminación</option>
                <option value="Etiqueta incorrecta">Etiqueta incorrecta</option>
                <option value="Fallo terapéutico">Fallo terapéutico</option>
                <option value="Otro">Otro</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Estado</label>
              <select 
                className="w-full bg-slate-800 border border-slate-700 text-white p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-red-500"
                onChange={(e) => setFormData({...formData, estado: e.target.value})}
                value={formData.estado}
              >
                <option value="Abierto">Abierto</option>
                <option value="Investigando">Investigando</option>
                <option value="Cerrado">Cerrado</option>
              </select>
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-400 mb-1">Descripción de la Incidencia *</label>
            <textarea 
              required 
              rows={4}
              placeholder="Describa detalladamente el problema reportado..."
              className="w-full bg-slate-800 border border-slate-700 text-white p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-red-500"
              onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
              value={formData.descripcion}
            ></textarea>
          </div>
        </div>

        <button 
          type="submit"
          disabled={loading}
          className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-4 rounded-xl shadow-lg transition-all transform active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? 'ENVIANDO REPORTE...' : 'REGISTRAR RECLAMO / INCIDENCIA'}
        </button>
      </form>
    </div>
  );
};