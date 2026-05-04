import React, { useState } from 'react';
import { db } from '../../lib/db';
import { generarCodigoBase } from '../../lib/utils/codigos';
import { useLiveQuery } from 'dexie-react-hooks';

export const BaseForm = () => {
  // 1. SELECTORES REACTIVOS
  // Traemos los datos de las tablas maestras sincronizadas por el SyncManager
  const tiposBase = useLiveQuery(() => db.tipo_base.toArray()) || [];
  const responsables = useLiveQuery(() => db.perfiles.toArray()) || [];

  const [codigoGenerado, setCodigoGenerado] = useState('');
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });
  
  const [formData, setFormData] = useState({
    tipo_id: '',
    proveedor: '',
    lote_materia_prima: '',
    cantidad: '',
    concentracion: '',
    fecha_elaboracion: '',
    fecha_vencimiento: '',
    responsable_id: '',
    qa: 'OK' // Mantenemos el estado de texto para OK/NO[cite: 1]
  });

  const handleGenerarCodigo = async () => {
    if (!formData.tipo_id) {
      setMensaje({ tipo: 'error', texto: 'Selecciona el Tipo de Base primero.' });
      return;
    }
    try {
      const tipoSeleccionado = tiposBase.find(t => String(t.id) === String(formData.tipo_id));
      const codigo = await generarCodigoBase(tipoSeleccionado?.nombre || 'GEN');
      setCodigoGenerado(codigo);
      setMensaje({ tipo: 'success', texto: 'Código generado correctamente.' });
    } catch (error) {
      setMensaje({ tipo: 'error', texto: 'Error al generar el código.' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!codigoGenerado) {
      setMensaje({ tipo: 'error', texto: 'Debes generar el código base antes de registrar.' });
      return;
    }

    try {
      const nuevaBase = {
        codigo: codigoGenerado,
        tipo_id: formData.tipo_id,
        proveedor: formData.proveedor,
        lote_materia_prima: formData.lote_materia_prima,
        cantidad: formData.cantidad,
        concentracion: formData.concentracion,
        fecha_elaboracion: formData.fecha_elaboracion,
        fecha_vencimiento: formData.fecha_vencimiento,
        responsable_id: formData.responsable_id,
        qa: formData.qa, // Guarda "OK" o "NO"[cite: 1]
        created_at: new Date().toISOString(),
        synced: 0,
        dirty: 1
      };

      await db.bases.add(nuevaBase);

      setMensaje({ tipo: 'success', texto: `Base registrada: ${codigoGenerado}` });
      
      // Reset del formulario
      setFormData({
        tipo_id: '', proveedor: '', lote_materia_prima: '', cantidad: '',
        concentracion: '', fecha_elaboracion: '', fecha_vencimiento: '',
        responsable_id: '', qa: 'OK'
      });
      setCodigoGenerado('');
    } catch (error) {
      setMensaje({ tipo: 'error', texto: 'Error al registrar localmente.' });
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl space-y-6">
        
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <span className="w-2 h-8 bg-blue-500 rounded-full"></span>
            Registrar Base (SALINA, ALCOHOL, ADE)
          </h2>
          {codigoGenerado && (
            <div className="bg-blue-500/10 border border-blue-500/20 px-4 py-2 rounded-lg font-mono font-bold text-blue-400">
              {codigoGenerado}
            </div>
          )}
        </div>

        {mensaje.texto && (
          <div className={`p-4 rounded-xl border ${
            mensaje.tipo === 'success' 
              ? 'bg-green-500/10 border-green-500/20 text-green-400' 
              : 'bg-red-500/10 border-red-500/20 text-red-400'
          }`}>
            {mensaje.texto}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* TIPO */}
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Tipo:</label>
            <div className="flex gap-2">
              <select 
                required
                className="flex-1 bg-slate-800 border border-slate-700 text-white p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.tipo_id}
                onChange={(e) => setFormData({...formData, tipo_id: e.target.value})}
              >
                <option value="">----------</option>
                {tiposBase.map(t => (
                  <option key={t.id} value={t.id}>{t.nombre}</option>
                ))}
              </select>
              <button 
                type="button" 
                onClick={handleGenerarCodigo}
                className="bg-blue-600 hover:bg-blue-500 text-white px-4 rounded-lg font-bold text-xs"
              >
                Generar Código
              </button>
            </div>
          </div>

          {/* PROVEEDOR */}
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Proveedor:</label>
            <input 
              type="text" placeholder="Ej: Prov. X"
              className="w-full bg-slate-800 border border-slate-700 text-white p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.proveedor}
              onChange={(e) => setFormData({...formData, proveedor: e.target.value})}
            />
          </div>

          {/* LOTE MP Y CANTIDAD */}
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Lote materia prima:</label>
            <input 
              type="text" placeholder="Ej: Lote 123"
              className="w-full bg-slate-800 border border-slate-700 text-white p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.lote_materia_prima}
              onChange={(e) => setFormData({...formData, lote_materia_prima: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Cantidad:</label>
            <input 
              type="text" placeholder="Ej: 5 L"
              className="w-full bg-slate-800 border border-slate-700 text-white p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.cantidad}
              onChange={(e) => setFormData({...formData, cantidad: e.target.value})}
            />
          </div>

          {/* CONCENTRACIÓN */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-400 mb-1">Concentración:</label>
            <input 
              type="text" placeholder="Ej: 0,9%"
              className="w-full bg-slate-800 border border-slate-700 text-white p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.concentracion}
              onChange={(e) => setFormData({...formData, concentracion: e.target.value})}
            />
          </div>

          {/* FECHAS */}
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Fecha de Elaboración:</label>
            <input 
              type="date"
              className="w-full bg-slate-800 border border-slate-700 text-white p-2.5 rounded-lg outline-none"
              value={formData.fecha_elaboracion}
              onChange={(e) => setFormData({...formData, fecha_elaboracion: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Vencimiento:</label>
            <input 
              type="date"
              className="w-full bg-slate-800 border border-slate-700 text-white p-2.5 rounded-lg outline-none"
              value={formData.fecha_vencimiento}
              onChange={(e) => setFormData({...formData, fecha_vencimiento: e.target.value})}
            />
          </div>

          {/* RESPONSABLE (CORREGIDO) */}
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Responsable *:</label>
            <select 
              required
              className="w-full bg-slate-800 border border-slate-700 text-white p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.responsable_id}
              onChange={(e) => setFormData({...formData, responsable_id: e.target.value})}
            >
              <option value="">-- Selecciona --</option>
              {responsables.map(r => (
                <option key={r.id} value={r.id}>
                  {r.nombre_completo || r.email}
                </option>
              ))}
            </select>
          </div>

          {/* QA (OK/NO)[cite: 1] */}
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">QA *:</label>
            <select 
              required
              className="w-full bg-slate-800 border border-slate-700 text-white p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.qa}
              onChange={(e) => setFormData({...formData, qa: e.target.value})}
            >
              <option value="OK">✅ OK</option>
              <option value="NO">❌ NO</option>
            </select>
          </div>
        </div>

        <button 
          type="submit"
          disabled={!codigoGenerado}
          className="w-full bg-teal-600 hover:bg-teal-500 text-white font-bold py-4 rounded-xl shadow-lg transition-all transform active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <span>✔</span> Registrar Base
        </button>
      </form>
    </div>
  );
};