import React, { useState, useEffect } from 'react'; // Añadimos useEffect
import { supabase } from '../../lib/supabase';
import { db } from '../../lib/db'; 
import { useLiveQuery } from 'dexie-react-hooks';
import { RefreshCw, Loader2, Package } from 'lucide-react';
// 👉 IMPORTAMOS EL SERVICIO DE AUDITORÍA
import { registrarAuditoria } from '../../services/auditService';

export const AlmacenForm = () => {
  // 1. Usuarios se mantienen de Dexie (cambian poco)
  const usuarios = useLiveQuery(() => db.perfiles.toArray());

  // 2. NUEVO: Estado para lotes traídos de la nube
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

  // 3. FUNCIÓN PARA TRAER LOTES DE FABRICACIÓN DESDE LA NUBE
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
      console.error("Error cargando lotes:", err.message);
    } finally {
      setLoadingLotes(false);
    }
  };

  // Carga automática al abrir el formulario
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

      // 👉 REGISTRO DE AUDITORÍA
      await registrarAuditoria(
        'ACTUALIZAR', 
        'Almacén', 
        `El lote ${formData.lote_id} fue almacenado en la ubicación: ${formData.ubicacion}`
      );

      setMensaje({ tipo: 'success', texto: `✅ Lote ${formData.lote_id} almacenado correctamente.` });
      
      setFormData({
        lote_id: '',
        ubicacion: '',
        temperatura_verificada: '',
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
          <Package className="text-amber-500" />
          Ingreso a Almacenamiento (Online)
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
                <span>Lote Fabricado *</span>
                {loadingLotes && <Loader2 className="w-3 h-3 animate-spin text-blue-400" />}
              </label>
              <div className="flex gap-2">
                <select 
                  required
                  className="flex-1 bg-slate-800 border border-slate-700 text-white p-2.5 rounded-lg outline-none"
                  onChange={(e) => setFormData({...formData, lote_id: e.target.value})}
                  value={formData.lote_id}
                >
                  <option value="">{loadingLotes ? 'Cargando lotes...' : 'Seleccione el lote...'}</option>
                  {lotesOnline.length > 0 ? (
                    lotesOnline.map(f => (
                      <option key={f.codigo_lote} value={f.codigo_lote}>
                        {f.codigo_lote} - {f.producto}
                      </option>
                    ))
                  ) : (
                    <option disabled>No se encontraron lotes en la nube</option>
                  )}
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
          className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-4 rounded-xl shadow-lg transition-all transform active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin" /> SINCRONIZANDO...
            </>
          ) : 'REGISTRAR ALMACENAMIENTO'}
        </button>
      </form>
    </div>
  );
};