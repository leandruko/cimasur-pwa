import React, { useState, useEffect } from 'react'; 
import { supabase } from '../../lib/supabase'; 
import { db } from '../../lib/db'; 
import { useLiveQuery } from 'dexie-react-hooks';
import { RefreshCw, Loader2, ShoppingCart } from 'lucide-react';
import { registrarAuditoria } from '../../services/auditService';

export const VentaForm = () => {
  // 1. Estados para los lotes traídos de la nube
  const [lotesOnline, setLotesOnline] = useState<any[]>([]);
  const [loadingLotes, setLoadingLotes] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });

  const [formData, setFormData] = useState({
    lote_id: '',
    nro_cotizacion: '',
    cliente: '',
    cantidad_vendida: '',
    tipo_venta: 'Inventario', 
    nro_factura: '',
    estado: 'Pendiente'
  });

  // 2. FUNCIÓN OPTIMIZADA: FILTRA Y QUITA LOS LOTES QUE YA FUERON VENDIDOS
  const fetchLotesOnline = async () => {
    setLoadingLotes(true);
    try {
      // A. Traemos todas las fabricaciones registradas
      const { data: fabricaciones, error: errFab } = await supabase
        .from('fabricaciones')
        .select('codigo_lote, producto')
        .order('created_at', { ascending: false });

      if (error || errFab) throw errFab || error;

      // B. Traemos la lista de los lotes que YA registran una venta
      const { data: yaVendidos, error: errVentas } = await supabase
        .from('ventas')
        .select('lote_id');

      if (errVentas) throw errVentas;

      // Creamos un Set con los IDs vendidos para una exclusión ultra rápida
      const setVendidos = new Set(yaVendidos?.map(v => v.lote_id) || []);

      // C. 👉 FILTRO DE EXCLUSIÓN: Dejamos solo los lotes que NO se han vendido todavía
      const lotesDisponibles = fabricaciones?.filter(f => !setVendidos.has(f.codigo_lote)) || [];

      setLotesOnline(lotesDisponibles);
    } catch (err: any) {
      console.error("Error cargando lotes para ventas:", err.message);
    } finally {
      setLoadingLotes(false);
    }
  };

  useEffect(() => {
    fetchLotesOnline();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.lote_id || !formData.cliente || !formData.cantidad_vendida) {
      return setMensaje({ tipo: 'error', texto: "Lote, Cliente y Cantidad son obligatorios." });
    }

    setLoading(true);
    setMensaje({ tipo: '', texto: '' });

    try {
      const { error } = await supabase
        .from('ventas')
        .insert([{
          id: crypto.randomUUID(),
          lote_id: formData.lote_id,
          nro_cotizacion: formData.nro_cotizacion || null,
          cliente: formData.cliente,
          cantidad_vendida: parseInt(formData.cantidad_vendida) || 0,
          tipo_venta: formData.tipo_venta,
          nro_factura: formData.nro_factura || null,
          estado: formData.estado,
          created_at: new Date().toISOString()
        }]);

      if (error) throw error;

      await registrarAuditoria(
        'CREAR', 
        'Ventas', 
        `Registró venta de ${formData.cantidad_vendida} unidades del lote ${formData.lote_id} al cliente: ${formData.cliente}`
      );

      setMensaje({ 
        tipo: 'success', 
        texto: `✅ Venta a "${formData.cliente}" registrada exitosamente en la nube.` 
      });
      
      setFormData({
        lote_id: '',
        nro_cotizacion: '',
        cliente: '',
        cantidad_vendida: '',
        tipo_venta: 'Inventario',
        nro_factura: '',
        estado: 'Pendiente'
      });

      // 👉 ACTUALIZACIÓN EN CALIENTE: Volvemos a ejecutar el filtro para remover el lote de inmediato
      await fetchLotesOnline();

    } catch (error: any) {
      console.error(error);
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
            <ShoppingCart className="text-cyan-500" size={20} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800 tracking-tight uppercase">
              Registro de Venta y Despacho
            </h2>
            <p className="text-slate-500 text-xs font-medium">
              Registre las salidas de productos terminados hacia clientes y controle los estados de facturación.
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
          
          {/* LOTE A VENDER */}
          <div className="flex flex-col space-y-1.5">
            <label className="flex justify-between items-center text-xs font-bold text-slate-500 uppercase tracking-wider">
              <span>Lote a Vender *</span>
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
                  {loadingLotes ? 'Cargando lotes disponibles...' : lotesOnline.length === 0 ? 'No hay lotes pendientes de venta' : 'Seleccione lote...'}
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

          {/* CLIENTE / INSTITUCIÓN */}
          <div className="flex flex-col space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cliente / Institución *</label>
            <input 
              required
              type="text"
              placeholder="Nombre de la entidad receptora"
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 p-3 rounded-xl text-sm outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-all font-medium placeholder:text-slate-400"
              onChange={(e) => setFormData({...formData, cliente: e.target.value})}
              value={formData.cliente}
            />
          </div>

          {/* NRO COTIZACIÓN Y CANTIDAD VENDIDA */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">N° Cotización</label>
              <input 
                type="text"
                placeholder="Ej: COT-2024"
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 p-3 rounded-xl text-sm outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-all font-medium font-mono placeholder:text-slate-400"
                onChange={(e) => setFormData({...formData, nro_cotizacion: e.target.value})}
                value={formData.nro_cotizacion}
              />
            </div>
            <div className="flex flex-col space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cant. Vendida *</label>
              <input 
                required
                type="number"
                placeholder="0"
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 p-3 rounded-xl text-sm outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-all font-medium font-mono placeholder:text-slate-400"
                onChange={(e) => setFormData({...formData, cantidad_vendida: e.target.value})}
                value={formData.cantidad_vendida}
              />
            </div>
          </div>

          {/* TIPO DE VENTA Y ESTADO */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tipo de Venta</label>
              <select 
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 p-3 rounded-xl text-sm outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-all font-medium"
                onChange={(e) => setFormData({...formData, tipo_venta: e.target.value})}
                value={formData.tipo_venta}
              >
                <option value="Inventario">Inventario</option>
                <option value="Producción Día">Producción Día</option>
              </select>
            </div>
            <div className="flex flex-col space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Estado</label>
              <select 
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 p-3 rounded-xl text-sm outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-all font-medium"
                onChange={(e) => setFormData({...formData, estado: e.target.value})}
                value={formData.estado}
              >
                <option value="Pendiente">Pendiente</option>
                <option value="Entregado">Entregado</option>
                <option value="Devuelto">Devuelto</option>
              </select>
            </div>
          </div>

          {/* NRO FACTURA */}
          <div className="md:col-span-2 flex flex-col space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">N° Factura (Opcional)</label>
            <input 
              type="text"
              placeholder="Ej: FACT-98231"
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 p-3 rounded-xl text-sm outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-all font-medium font-mono placeholder:text-slate-400"
              onChange={(e) => setFormData({...formData, nro_factura: e.target.value})}
              value={formData.nro_factura}
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
                <Loader2 className="animate-spin" size={14} /> REGISTRANDO VENTA...
              </>
            ) : 'REGISTRAR VENTA EN LA NUBE'}
          </button>y
        </div>
      </form>
    </div>
  );
};