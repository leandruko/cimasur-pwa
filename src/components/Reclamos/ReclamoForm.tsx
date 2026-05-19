import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase'; // Conexión directa a Supabase
import { db } from '../../lib/db'; 
import { RefreshCw, Loader2, AlertTriangle } from 'lucide-react';
import { registrarAuditoria } from '../../services/auditService';

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
          tipo_problema: formData.tipo_reclamo, 
          detalles: formData.descripcion, 
          estado: formData.estado,
          created_at: new Date().toISOString()
        }]);

      if (error) throw error;

      await registrarAuditoria(
        'CREAR', 
        'Reclamos', 
        `ALERTA: Se registró un reclamo de tipo "${formData.tipo_reclamo}" para el lote ${formData.lote_id}. Cliente: ${formData.cliente || 'No especificado'}`
      );

      setMensaje({ 
        tipo: 'success', 
        texto: `✅ Reclamo registrado con éxito.` 
      });
      
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
    <div className="w-full">
      {/* TARJETA BLANCA DE ALTA FIDELIDAD SEGÚN REQUERIMIENTO */}
      <form onSubmit={handleSubmit} className="bg-white border border-slate-100 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
        
        {/* CABECERA CON ICONO CIAN */}
        <div className="flex items-center gap-2.5 border-b border-slate-100 pb-6">
          <div className="p-2 bg-cyan-50 rounded-xl">
            <AlertTriangle className="text-cyan-500" size={20} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800 tracking-tight uppercase">
              Gestión de Reclamos e Incidencias
            </h2>
            <p className="text-slate-500 text-xs font-medium">
              Registre reportes de anomalías, fallos terapéuticos o desviaciones analíticas informadas por clientes.
            </p>
          </div>
        </div>

        {/* FEEDBACK DEL ESTADO */}
        {mensaje.texto && (
          <div className={`p-4 rounded-xl border text-xs font-bold animate-in fade-in duration-300 ${
            mensaje.tipo === 'success' 
              ? 'bg-green-50 border-green-100 text-green-700' 
              : 'bg-red-50 border-red-100 text-red-700'
          }`}>
            {mensaje.texto}
          </div>
        )}

        {/* GRID DE ENTRADAS CON TRATAMIENTO CLARO */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          
          {/* LOTE RELACIONADO */}
          <div className="flex flex-col space-y-1.5">
            <label className="flex justify-between items-center text-xs font-bold text-slate-500 uppercase tracking-wider">
              <span>Lote Relacionado *</span>
              {loadingLotes && <Loader2 className="w-3 h-3 animate-spin text-cyan-500" />}
            </label>
            <div className="flex gap-2">
              <select 
                required
                className="flex-1 bg-slate-50 border border-slate-200 text-slate-800 p-3 rounded-xl text-sm outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-all font-medium"
                onChange={(e) => setFormData({...formData, lote_id: e.target.value})}
                value={formData.lote_id}
              >
                <option value="" className="text-slate-400">{loadingLotes ? 'Cargando lotes...' : 'Seleccione el lote...'}</option>
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

          {/* CLIENTE QUE REPORTA */}
          <div className="flex flex-col space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cliente que Reporta</label>
            <input 
              type="text" 
              placeholder="Nombre de la institución o comprador"
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 p-3 rounded-xl text-sm outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-all font-medium placeholder:text-slate-400"
              onChange={(e) => setFormData({...formData, cliente: e.target.value})}
              value={formData.cliente}
            />
          </div>

          {/* TIPO DE PROBLEMA */}
          <div className="flex flex-col space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tipo de Problema</label>
            <select 
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 p-3 rounded-xl text-sm outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-all font-medium"
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

          {/* ESTADO */}
          <div className="flex flex-col space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Estado</label>
            <select 
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 p-3 rounded-xl text-sm outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-all font-medium"
              onChange={(e) => setFormData({...formData, estado: e.target.value})}
              value={formData.estado}
            >
              <option value="Abierto">Abierto</option>
              <option value="Investigando">Investigando</option>
              <option value="Cerrado">Cerrado</option>
            </select>
          </div>

          {/* DESCRIPCIÓN DE LA INCIDENCIA */}
          <div className="md:col-span-2 flex flex-col space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Descripción de la Incidencia *</label>
            <textarea 
              required 
              rows={4}
              placeholder="Describa de manera pormenorizada el inconveniente detectado con el producto..."
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 p-3 rounded-xl text-sm outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-all font-medium placeholder:text-slate-400"
              onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
              value={formData.descripcion}
            ></textarea>
          </div>
        </div>

        {/* BOTÓN UNIFICADO EN CIAN */}
        <div className="pt-4 border-t border-slate-100">
          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-3.5 rounded-xl shadow-sm transition-all transform active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2 uppercase tracking-wider text-xs"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={14} /> ENVIANDO REPORTE...
              </>
            ) : 'REGISTRAR RECLAMO / INCIDENCIA'}
          </button>
        </div>
      </form>
    </div>
  );
};