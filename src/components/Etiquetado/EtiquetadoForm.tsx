import React, { useState, useEffect } from 'react'; 
import { supabase } from '../../lib/supabase'; 
import { db } from '../../lib/db'; 
import { useLiveQuery } from 'dexie-react-hooks';
import { RefreshCw, Loader2, Tag } from 'lucide-react';
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
    qa: 'CONFORME', // 👉 Adaptado al nuevo estándar
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

  useEffect(() => {
    fetchLotesOnline();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.lote_id || !formData.responsable_id) {
      return setMensaje({ tipo: 'error', texto: "Debe seleccionar un lote y un responsable." });
    }

    //  ¡INCIDENCIA SOLUCIONADA! Ahora sí llama correctamente a la función de estado
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

      await registrarAuditoria(
        'ACTUALIZAR', 
        'Etiquetado', 
        `Se etiquetaron ${formData.cantidad_etiquetada || 0} unidades del lote ${formData.lote_id}. Estado QA: ${formData.qa}`
      );

      setMensaje({ tipo: 'success', texto: `✅ Etiquetado del lote ${formData.lote_id} registrado con éxito.` });
      
      // Preservamos el lote_id y el responsable_id para que no desaparezca de la pantalla
      setFormData(prev => ({
        ...prev,
        cantidad_etiquetada: '',
        vencimiento_etiqueta: '',
      }));

    } catch (error: any) {
      setMensaje({ tipo: 'error', texto: `❌ Error: ${error.message}` });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="bg-white border border-slate-100 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
        
        <div className="flex items-center gap-2.5 border-b border-slate-100 pb-6">
          <div className="p-2 bg-cyan-50 rounded-xl">
            <Tag className="text-cyan-500" size={20} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800 tracking-tight uppercase">
              Control de Etiquetado y QA Final
            </h2>
            <p className="text-slate-500 text-xs font-medium">
              Gestione el empaque secundario y realice el visado de control de calidad final antes de su distribución.
            </p>
          </div>
        </div>

        {mensaje.texto && (
          <div className={`p-4 rounded-xl border text-xs font-bold animate-in fade-in duration-300 ${
            mensaje.tipo === 'success' 
              ? 'bg-green-50 border-green-100 text-green-700' 
              : 'bg-red-50 border-red-100 text-red-700'
          }`}>
            {mensaje.texto}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          
          {/* LOTE A ETIQUETAR */}
          <div className="flex flex-col space-y-1.5">
            <label className="flex justify-between items-center text-xs font-bold text-slate-500 uppercase tracking-wider">
              <span>Lote a Etiquetar *</span>
              {loadingLotes && <Loader2 className="w-3 h-3 animate-spin text-cyan-500" />}
            </label>
            <div className="flex gap-2">
              <select 
                required
                className="flex-1 bg-slate-50 border border-slate-200 text-slate-800 p-3 rounded-xl text-sm outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-all font-medium"
                onChange={(e) => setFormData({...formData, lote_id: e.target.value})}
                value={formData.lote_id}
              >
                <option value="" className="text-slate-400">
                  {loadingLotes ? 'Cargando lotes...' : 'Seleccione lote...'}
                </option>
                {lotesOnline.map(f => (
                  <option key={f.codigo_lote} value={f.codigo_lote} className="text-slate-800">
                    {f.codigo_lote} - {f.producto}
                  </option>
                ))}
              </select>
              <button 
                type="button" 
                onClick={fetchLotesOnline} 
                className="bg-slate-100 hover:bg-slate-200 text-slate-600 p-3 rounded-xl transition-colors border border-slate-200"
              >
                <RefreshCw size={16} className={loadingLotes ? "animate-spin text-cyan-500" : ""} />
              </button>
            </div>
          </div>

          {/* RESPONSABLE */}
          <div className="flex flex-col space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Responsable *</label>
            <select 
              required
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 p-3 rounded-xl text-sm outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-all font-medium"
              onChange={(e) => setFormData({...formData, responsable_id: e.target.value})}
              value={formData.responsable_id}
            >
              <option value="" className="text-slate-400">Seleccione responsable...</option>
              {usuarios?.map(u => <option key={u.id} value={u.id} className="text-slate-800 font-bold">{u.nombre_completo}</option>)}
            </select>
          </div>

          {/* CANTIDAD ETIQUETADA Y VENCIMIENTO */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cant. Etiquetada</label>
              <input 
                type="number"
                placeholder="0"
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 p-3 rounded-xl text-sm outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-all font-medium font-mono placeholder:text-slate-400"
                onChange={(e) => setFormData({...formData, cantidad_etiquetada: e.target.value})}
                value={formData.cantidad_etiquetada}
              />
            </div>
            <div className="flex flex-col space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Venc. Etiqueta</label>
              <input 
                type="date"
                className="w-full bg-slate-50 border border-slate-200 text-slate-600 p-3 rounded-xl text-sm outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-all font-medium"
                onChange={(e) => setFormData({...formData, vencimiento_etiqueta: e.target.value})}
                value={formData.vencimiento_etiqueta}
              />
            </div>
          </div>

          {/* VALIDACIÓN QA (INCIDENCIA ADAPTADA: conforme / rechazado) */}
          <div className="flex flex-col space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Validación QA *</label>
            <select 
              className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-sm outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-all font-bold text-slate-800"
              onChange={(e) => setFormData({...formData, qa: e.target.value})}
              value={formData.qa}
            >
              <option value="CONFORME" className="text-green-600 font-bold">conforme</option>
              <option value="RECHAZADO" className="text-red-600 font-bold">rechazado</option>
            </select>
          </div>

        </div>

        <div className="pt-4 border-t border-slate-100">
          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-3.5 rounded-xl shadow-sm transition-all transform active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2 uppercase tracking-wider text-xs"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={14} /> SINCRONIZANDO...
              </>
            ) : 'FINALIZAR ETIQUETADO Y APROBAR QA'}
          </button>
        </div>
      </form>
    </div>
  );
};