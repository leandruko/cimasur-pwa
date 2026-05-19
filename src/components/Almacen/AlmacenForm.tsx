import React, { useState, useEffect } from 'react'; 
import { supabase } from '../../lib/supabase';
import { db } from '../../lib/db'; 
import { useLiveQuery } from 'dexie-react-hooks';
import { RefreshCw, Loader2, Package } from 'lucide-react';
import { registrarAuditoria } from '../../services/auditService';

export const AlmacenForm = () => {
  // 1. Usuarios se mantienen de Dexie
  const usuarios = useLiveQuery(() => db.perfiles.toArray());

  // 2. Estado para lotes traídos de la nube
  const [lotesOnline, setLotesOnline] = useState<any[]>([]);
  const [loadingLotes, setLoadingLotes] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });

  const [formData, setFormData] = useState({
    lote_id: '', 
    ubicacion: '',
    temperatura_verificada: '',
    responsable_id: '',
  });

  // 3. FUNCIÓN REESTRUCTURADA: EXCLUYE LOTES QUE YA ESTÁN EN BODEGA
  const fetchLotesOnline = async () => {
    setLoadingLotes(true);
    try {
      // 1. Traemos todas las fabricaciones registradas
      const { data: fabricaciones, error: errFab } = await supabase
        .from('fabricaciones')
        .select('codigo_lote, producto')
        .order('created_at', { ascending: false }); 

      if (errFab) throw errFab;

      // 2. Traemos los lotes que YA se guardaron en la bodega
      const { data: yaAlmacenados, error: errAlm } = await supabase
        .from('almacenamientos')
        .select('lote_id');

      if (errAlm) throw errAlm;

      // Armamos un set rápido con los que ya existen en el almacén
      const setAlmacenados = new Set(yaAlmacenados?.map(a => a.lote_id) || []);

      // 3. 👉 FILTRO DE EXCLUSIÓN: Dejamos solo los que NO están en bodega aún
      const lotesPendientes = fabricaciones?.filter(f => !setAlmacenados.has(f.codigo_lote)) || [];

      setLotesOnline(lotesPendientes);
    } catch (err: any) {
      console.error("Error filtrando lotes para almacén:", err.message);
    } finally {
      setLoadingLotes(false);
    }
  };

  useEffect(() => {
    fetchLotesOnline();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.lote_id || !formData.responsable_id || !formData.ubicacion) {
      return setMensaje({ tipo: 'error', texto: "Debe completar los campos obligatorios." });
    }

    setLoading(true);
    setMensaje({ tipo: '', texto: '' });

    try {
      const { error } = await supabase
        .from('almacenamientos')
        .upsert([{
          lote_id: formData.lote_id,
          ubicacion: formData.ubicacion,
          temperatura_verificada: parseFloat(formData.temperatura_verificada) || 0,
          responsable_id: formData.responsable_id,
          created_at: new Date().toISOString()
        }], { onConflict: 'lote_id' });

      if (error) throw error;

      await registrarAuditoria(
        'ACTUALIZAR', 
        'Almacén', 
        `El lote ${formData.lote_id} fue almacenado en la ubicación: ${formData.ubicacion}`
      );

      setMensaje({ tipo: 'success', texto: `✅ Lote ${formData.lote_id} almacenado correctamente.` });
      
      // Reseteamos el formulario limpiando el lote_id para obligar una nueva selección
      setFormData({
        lote_id: '',
        ubicacion: '',
        temperatura_verificada: '',
        responsable_id: formData.responsable_id, // Dejamos el responsable seleccionado por comodidad
      });

      // 👉 ACTUALIZACIÓN EN VIVO: Removemos el lote guardado del selector de inmediato
      await fetchLotesOnline();

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
            <Package className="text-cyan-500" size={20} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800 tracking-tight uppercase">
              Ingreso a Almacenamiento
            </h2>
            <p className="text-slate-500 text-xs font-medium">
              Gestione las ubicaciones físicas de los lotes y verifique los rangos térmicos de resguardo.
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
          
          {/* LOTE FABRICADO */}
          <div className="flex flex-col space-y-1.5">
            <label className="flex justify-between items-center text-xs font-bold text-slate-500 uppercase tracking-wider">
              <span>Lote Fabricado *</span>
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
                  {loadingLotes ? 'Cargando lotes disponibles...' : lotesOnline.length === 0 ? 'No hay lotes pendientes de almacenamiento' : 'Seleccione el lote...'}
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

          {/* UBICACIÓN FÍSICA */}
          <div className="flex flex-col space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ubicación Física *</label>
            <input 
              required
              type="text"
              placeholder="Ej: Bodega Central - Sector A1"
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 p-3 rounded-xl text-sm outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-all font-medium placeholder:text-slate-400"
              onChange={(e) => setFormData({...formData, ubicacion: e.target.value})}
              value={formData.ubicacion}
            />
          </div>

          {/* TEMPERATURA */}
          <div className="flex flex-col space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Temperatura (°C)</label>
            <input 
              type="number"
              step="0.1"
              placeholder="Ej: 15.5"
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 p-3 rounded-xl text-sm outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-all font-medium font-mono placeholder:text-slate-400"
              onChange={(e) => setFormData({...formData, temperatura_verificada: e.target.value})}
              value={formData.temperatura_verificada}
            />
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
            ) : 'REGISTRAR ALMACENAMIENTO'}
          </button>
        </div>
      </form>
    </div>
  );
};