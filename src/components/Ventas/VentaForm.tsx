import React, { useState, useEffect } from 'react'; // Añadimos useEffect
import { supabase } from '../../lib/supabase'; // Conexión directa a Supabase
import { db } from '../../lib/db'; 
import { useLiveQuery } from 'dexie-react-hooks';
import { RefreshCw, Loader2, ShoppingCart } from 'lucide-react';
// 👉 IMPORTAMOS EL SERVICIO DE AUDITORÍA
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

  // 2. FUNCIÓN PARA TRAER LOTES DE FABRICACIÓN DESDE LA NUBE
  const fetchLotesOnline = async () => {
    setLoadingLotes(true);
    try {
      const { data, error } = await supabase
        .from('fabricaciones')
        .select('codigo_lote, producto')
        .order('created_at', { ascending: false }); // Los más recientes primero

      if (error) throw error;
      if (data) setLotesOnline(data);
    } catch (err: any) {
      console.error("Error cargando lotes para ventas:", err.message);
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

    if (!formData.lote_id || !formData.cliente || !formData.cantidad_vendida) {
      return setMensaje({ tipo: 'error', texto: "Lote, Cliente y Cantidad son obligatorios." });
    }

    setLoading(true);
    setMensaje({ tipo: '', texto: '' });

    try {
      // INSERCIÓN DIRECTA EN SUPABASE
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

      // 👉 REGISTRO DE AUDITORÍA
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

    } catch (error: any) {
      console.error(error);
      setMensaje({ tipo: 'error', texto: `❌ Error: ${error.message}` });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl space-y-6">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
          <ShoppingCart className="text-indigo-500" />
          Registro de Venta y Despacho (Online)
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
                <span>Lote a Vender *</span>
                {loadingLotes && <Loader2 className="w-3 h-3 animate-spin text-blue-400" />}
              </label>
              <div className="flex gap-2">
                <select 
                  required
                  className="flex-1 bg-slate-800 border border-slate-700 text-white p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
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
              <label className="block text-sm font-medium text-slate-400 mb-1">Cliente / Institución *</label>
              <input 
                required
                type="text"
                placeholder="Nombre del cliente"
                className="w-full bg-slate-800 border border-slate-700 text-white p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                onChange={(e) => setFormData({...formData, cliente: e.target.value})}
                value={formData.cliente}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">N° Cotización</label>
                <input 
                  type="text"
                  className="w-full bg-slate-800 border border-slate-700 text-white p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                  onChange={(e) => setFormData({...formData, nro_cotizacion: e.target.value})}
                  value={formData.nro_cotizacion}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Cant. Vendida *</label>
                <input 
                  required
                  type="number"
                  className="w-full bg-slate-800 border border-slate-700 text-white p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                  onChange={(e) => setFormData({...formData, cantidad_vendida: e.target.value})}
                  value={formData.cantidad_vendida}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Tipo de Venta</label>
                <select 
                  className="w-full bg-slate-800 border border-slate-700 text-white p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                  onChange={(e) => setFormData({...formData, tipo_venta: e.target.value})}
                  value={formData.tipo_venta}
                >
                  <option value="Inventario">Inventario</option>
                  <option value="Producción Día">Producción Día</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Estado</label>
                <select 
                  className="w-full bg-slate-800 border border-slate-700 text-white p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                  onChange={(e) => setFormData({...formData, estado: e.target.value})}
                  value={formData.estado}
                >
                  <option value="Pendiente">Pendiente</option>
                  <option value="Entregado">Entregado</option>
                  <option value="Devuelto">Devuelto</option>
                </select>
              </div>
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-400 mb-1">N° Factura (Opcional)</label>
            <input 
              type="text"
              className="w-full bg-slate-800 border border-slate-700 text-white p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
              onChange={(e) => setFormData({...formData, nro_factura: e.target.value})}
              value={formData.nro_factura}
            />
          </div>
        </div>

        <button 
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-xl shadow-lg transition-all transform active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin" /> REGISTRANDO VENTA...
            </>
          ) : 'REGISTRAR VENTA EN LA NUBE'}
        </button>
      </form>
    </div>
  );
};