import React, { useState } from 'react';
import { supabase } from '../../lib/supabase'; // Conexión directa a Supabase
import { db } from '../../lib/db'; // Para lectura rápida de lotes fabricados
import { useLiveQuery } from 'dexie-react-hooks';

export const VentaForm = () => {
  // Obtenemos los lotes disponibles desde la copia local (Maestros)
  const fabricaciones = useLiveQuery(() => db.fabricaciones.toArray());

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
          id: crypto.randomUUID(), // ID único para la transacción
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

      setMensaje({ 
        tipo: 'success', 
        texto: `✅ Venta a "${formData.cliente}" registrada exitosamente en la nube.` 
      });
      
      // Limpiar formulario tras éxito
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
      setMensaje({ tipo: 'error', texto: `❌ Error al procesar venta: ${error.message}` });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl space-y-6">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
          <span className="w-2 h-8 bg-indigo-500 rounded-full"></span>
          Registro de Venta y Despacho (Online)
        </h2>

        {mensaje.texto && (
          <div className={`p-4 rounded-xl border ${mensaje.tipo === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
            {mensaje.texto}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Lote a Vender *</label>
              <select 
                required
                className="w-full bg-slate-800 border border-slate-700 text-white p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
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
          {loading ? 'REGISTRANDO VENTA...' : 'REGISTRAR VENTA EN LA NUBE'}
        </button>
      </form>
    </div>
  );
};