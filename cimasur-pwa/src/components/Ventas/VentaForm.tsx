import React, { useState } from 'react';
import { db } from '../../lib/db';
import { useLiveQuery } from 'dexie-react-hooks';

export const VentaForm = () => {
  const fabricaciones = useLiveQuery(() => db.fabricaciones.toArray());

  const [formData, setFormData] = useState({
    lote_id: '',
    nro_cotizacion: '',
    cliente: '',
    cantidad_vendida: '',
    tipo_venta: 'Inventario', // Valor por defecto del SALE_TYPE
    nro_factura: '',
    estado: 'Pendiente'       // Valor por defecto del SALE_STATUS
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.lote_id || !formData.cliente || !formData.cantidad_vendida) {
      return alert("Complete los campos obligatorios: Lote, Cliente y Cantidad.");
    }

    try {
      const nuevaVenta = {
        id: crypto.randomUUID(), // Generamos ID único para la venta
        lote_id: formData.lote_id,
        nro_cotizacion: formData.nro_cotizacion,
        cliente: formData.cliente,
        cantidad_vendida: parseInt(formData.cantidad_vendida) || 0,
        tipo_venta: formData.tipo_venta,
        nro_factura: formData.nro_factura || null,
        estado: formData.estado,
        fecha_registro: new Date().toISOString(),
        synced: 0,
        dirty: 1
      };

      await db.ventas.add(nuevaVenta);
      
      alert(`✅ Venta a ${formData.cliente} registrada con éxito.`);
      window.location.href = '/dashboard';
    } catch (error) {
      console.error(error);
      alert("❌ Error al procesar la venta.");
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      {/* CORRECCIÓN: Agregado onSubmit={handleSubmit} */}
      <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl space-y-6">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
          <span className="w-2 h-8 bg-indigo-500 rounded-full"></span>
          Registro de Venta y Despacho
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* SELECCIÓN DE PRODUCTO Y CLIENTE */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Lote a Vender</label>
              {/* CORRECCIÓN: Agregado value={formData.lote_id} */}
              <select 
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
              <label className="block text-sm font-medium text-slate-400 mb-1">Cliente / Institución</label>
              {/* CORRECCIÓN: Agregado value={formData.cliente} */}
              <input 
                type="text"
                placeholder="Nombre del cliente"
                className="w-full bg-slate-800 border border-slate-700 text-white p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                onChange={(e) => setFormData({...formData, cliente: e.target.value})}
                value={formData.cliente}
              />
            </div>
          </div>

          {/* DOCUMENTACIÓN Y CANTIDAD */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">N° Cotización</label>
                {/* CORRECCIÓN: Agregado value={formData.nro_cotizacion} */}
                <input 
                  type="text"
                  className="w-full bg-slate-800 border border-slate-700 text-white p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                  onChange={(e) => setFormData({...formData, nro_cotizacion: e.target.value})}
                  value={formData.nro_cotizacion}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Cant. Vendida</label>
                {/* CORRECCIÓN: Agregado value={formData.cantidad_vendida} */}
                <input 
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
                {/* CORRECCIÓN: Agregado value={formData.tipo_venta} */}
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
                {/* CORRECCIÓN: Agregado value={formData.estado} */}
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
            {/* CORRECCIÓN: Agregado value={formData.nro_factura} */}
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
          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-xl shadow-lg transition-all transform active:scale-95"
        >
          REGISTRAR VENTA Y ACTUALIZAR STOCK
        </button>
      </form>
    </div>
  );
};