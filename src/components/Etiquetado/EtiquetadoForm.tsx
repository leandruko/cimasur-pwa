import React, { useState, useEffect } from 'react'; // Añadimos useEffect
import { supabase } from '../../lib/supabase'; // Conexión directa
import { db } from '../../lib/db'; 
import { useLiveQuery } from 'dexie-react-hooks';
import { RefreshCw, Loader2, Tag } from 'lucide-react';
// 👉 IMPORTAMOS EL SERVICIO DE AUDITORÍA
import { registrarAuditoria } from '../../services/auditService';

export const EtiquetadoForm = () => {
  // 1. Usuarios desde Dexie
  const usuarios = useLiveQuery(() => db.perfiles.toArray());

  // 2. Estados para la carga online de lotes
  const [lotesOnline, setLotesOnline] = useState<any[]>([]);
  const [loadingLotes, setLoadingLotes] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });

  const [formData, setFormData] = useState({
    lote_id: '', 
    cantidad_etiquetada: '',
    vencimiento_etiqueta: '',
    qa: 'OK', 
    responsable_id: '',
  });

  // 3. FUNCIÓN PARA TRAER LOTES DESDE SUPABASE
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
      console.error("Error cargando lotes para etiquetado:", err.message);
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

    if (!formData.lote_id || !formData.responsable_id) {
      return setMensaje({ tipo: 'error', texto: "Debe seleccionar un lote y un responsable." });
    }

    setLoading(true);
    setMensaje({ tipo: '', texto: '' });

    try {
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

      // 👉 REGISTRO DE AUDITORÍA
      await registrarAuditoria(
        'ACTUALIZAR', 
        'Etiquetado', 
        `Se etiquetaron ${formData.cantidad_etiquetada || 0} unidades del lote ${formData.lote_id}. Estado QA: ${formData.qa}`
      );

      setMensaje({ tipo: 'success', texto: `✅ Etiquetado del lote ${formData.lote_id} registrado con éxito.` });
      
      setFormData({
        lote_id: '',
        cantidad_etiquetada: '',
        vencimiento_etiqueta: '',
        qa: 'OK',
        responsable_id: '',
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
          <Tag className="text-emerald-500" />
          Control de Etiquetado y QA Final (Online)
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
                <span>Lote a Etiquetar *</span>
                {loadingLotes && <Loader2 className="w-3 h-3 animate-spin text-blue-400" />}
              </label>
              <div className="flex gap-2">
                <select 
                  required
                  className="flex-1 bg-slate-800 border border-slate-700 text-white p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
                  onChange={(e) => setFormData({...formData, lote_id: e.target.value})}
                  value={formData.lote_id}
                >
                  <option value="">{loadingLotes ? 'Cargando lotes...' : 'Seleccione lote...'}</option>
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
          {loading ? (
            <>
              <Loader2 className="animate-spin" /> SINCRONIZANDO...
            </>
          ) : 'FINALIZAR ETIQUETADO Y APROBAR QA'}
        </button>
      </form>
    </div>
  );
};