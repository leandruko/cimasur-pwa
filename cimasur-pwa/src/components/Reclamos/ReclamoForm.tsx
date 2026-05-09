import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase'; // Conexión directa a Supabase
import { db } from '../../lib/db'; 
import { RefreshCw, Loader2, AlertTriangle } from 'lucide-react';

export const ReclamoForm = () => {
  // 1. Estados para los lotes traídos de la nube
  const [lotesOnline, setLotesOnline] = useState<any[]>([]);
  const [loadingLotes, setLoadingLotes] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });

  const [formData, setFormData] = useState({
    lote_id: '',
    cliente: '',
    tipo_reclamo: 'Reacción adversa',
    descripcion: '',
    estado: 'Abierto'
  });

  // 2. FUNCIÓN PARA TRAER LOTES DE FABRICACIÓN DESDE LA NUBE
  const fetchLotesOnline = async () => {
    setLoadingLotes(true);
    try {
      const { data, error } = await supabase
        .from('fabricaciones')
        .select('codigo_lote, producto')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setLotesOnline(data);
    } catch (err: any) {
      console.error("Error cargando lotes para reclamos:", err.message);
    } finally {
      setLoadingLotes(false);
    }
  };

  // Carga automática inicial
  useEffect(() => {
    fetchLotesOnline();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.lote_id || !formData.descripcion) {
      return setMensaje({ tipo: 'error', texto: "El lote y la descripción son obligatorios." });
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('reclamos')
        .insert([{
          id: crypto.randomUUID(),
          lote_id: formData.lote_id,
          cliente: formData.cliente,
          
          // 1. Cambiamos 'tipo_reclamo' por 'tipo_problema' (según el error anterior)
          tipo_problema: formData.tipo_reclamo, 
          
          // 2. CAMBIO ACTUAL: Cambiamos 'descripcion' por 'detalles'
          detalles: formData.descripcion, 
          
          estado: formData.estado,
          created_at: new Date().toISOString()
        }]);

      if (error) throw error;

      setMensaje({ 
        tipo: 'success', 
        texto: `✅ Reclamo registrado con éxito.` 
      });
      
      // Limpiar formulario...
      setFormData({
        lote_id: '', cliente: '', tipo_reclamo: 'Reacción adversa',
        descripcion: '', estado: 'Abierto'
      });

    } catch (error: any) {
      setMensaje({ tipo: 'error', texto: `❌ Error: ${error.message}` });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl space-y-6">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
          <AlertTriangle className="text-red-500" />
          Gestión de Reclamos e Incidencias (Online)
        </h2>

        {mensaje.texto && (
          <div className={`p-4 rounded-xl border animate-in fade-in ${
            mensaje.tipo === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'
          }`}>
            {mensaje.texto}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <div className="space-y-4">
            <div>
              <label className="flex justify-between text-sm font-medium text-slate-400 mb-1">
                <span>Lote Relacionado *</span>
                {loadingLotes && <Loader2 className="w-3 h-3 animate-spin text-blue-400" />}
              </label>
              <div className="flex gap-2">
                <select 
                  required
                  className="flex-1 bg-slate-800 border border-slate-700 text-white p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-red-500"
                  onChange={(e) => setFormData({...formData, lote_id: e.target.value})}
                  value={formData.lote_id}
                >
                  <option value="">{loadingLotes ? 'Cargando lotes...' : 'Seleccione el lote...'}</option>
                  {lotesOnline.map(f => (
                    <option key={f.codigo_lote} value={f.codigo_lote}>
                      {f.codigo_lote} - {f.producto}
                    </option>
                  ))}
                </select>
                <button type="button" onClick={fetchLotesOnline} className="bg-slate-700 hover:bg-slate-600 text-white p-2.5 rounded-lg transition-colors">
                  <RefreshCw size={16} className={loadingLotes ? "animate-spin" : ""} />
                </button>
              </div>
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
          {loading ? (
            <>
              <Loader2 className="animate-spin" /> ENVIANDO REPORTE...
            </>
          ) : 'REGISTRAR RECLAMO / INCIDENCIA'}
        </button>
      </form>
    </div>
  );
};