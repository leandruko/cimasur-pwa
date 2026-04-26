import React, { useState } from 'react';
import { db } from '../../lib/db';
import { generarCodigoBase } from '../../lib/utils/codigos';
import { useLiveQuery } from 'dexie-react-hooks'; // Importamos el hook reactivo

export const BaseForm = () => {
  // 1. SELECTORES REACTIVOS (Igual que en FabricacionForm)
  // Estos se llenarán solos en cuanto pullMasterData guarde los datos en Dexie
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
    qa_id: ''
  });

  // YA NO NECESITAS useEffect aquí

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
        cantidad: Number(formData.cantidad),
        concentracion: formData.concentracion,
        fecha_elaboracion: formData.fecha_elaboracion,
        fecha_vencimiento: formData.fecha_vencimiento,
        responsable_id: formData.responsable_id,
        qa_id: formData.qa_id,
        created_at: new Date().toISOString(),
        synced: 0,
        dirty: 1
      };

      await db.bases.add(nuevaBase);

      setMensaje({ tipo: 'success', texto: `Lote registrado: ${codigoGenerado}` });
      setFormData({
        tipo_id: '', proveedor: '', lote_materia_prima: '', cantidad: '',
        concentracion: '', fecha_elaboracion: '', fecha_vencimiento: '',
        responsable_id: '', qa_id: ''
      });
      setCodigoGenerado('');
    } catch (error) {
      setMensaje({ tipo: 'error', texto: 'Error al registrar en la base de datos.' });
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl space-y-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <span className="w-2 h-8 bg-blue-500 rounded-full"></span>
            Registro de Materia Base
          </h2>
          {codigoGenerado && (
            <div className="bg-blue-500/10 border border-blue-500/20 px-4 py-2 rounded-lg">
              <span className="text-blue-400 font-mono font-bold">{codigoGenerado}</span>
            </div>
          )}
        </div>

        {mensaje.texto && (
          <div className={`p-4 rounded-xl border ${mensaje.tipo === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
            {mensaje.texto}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* TIPO DE BASE */}
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Tipo de Base *</label>
            <div className="flex gap-2">
              <select 
                className="flex-1 bg-slate-800 border border-slate-700 text-white p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.tipo_id}
                onChange={(e) => setFormData({...formData, tipo_id: e.target.value})}
              >
                <option value="">Seleccione tipo...</option>
                {tiposBase.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
              </select>
              <button type="button" onClick={handleGenerarCodigo} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-bold text-xs">
                GENERAR
              </button>
            </div>
          </div>

          {/* PROVEEDOR */}
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Proveedor</label>
            <input 
              type="text" className="w-full bg-slate-800 border border-slate-700 text-white p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.proveedor} onChange={(e) => setFormData({...formData, proveedor: e.target.value})}
            />
          </div>

          {/* DATOS TÉCNICOS */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Cant. (L/Kg)</label>
              <input type="number" step="0.01" className="w-full bg-slate-800 border border-slate-700 text-white p-2.5 rounded-lg outline-none"
                value={formData.cantidad} onChange={(e) => setFormData({...formData, cantidad: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Concentración</label>
              <input type="text" className="w-full bg-slate-800 border border-slate-700 text-white p-2.5 rounded-lg outline-none"
                value={formData.concentracion} onChange={(e) => setFormData({...formData, concentracion: e.target.value})}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Lote Materia Prima</label>
            <input type="text" className="w-full bg-slate-800 border border-slate-700 text-white p-2.5 rounded-lg outline-none"
              value={formData.lote_materia_prima} onChange={(e) => setFormData({...formData, lote_materia_prima: e.target.value})}
            />
          </div>

          {/* FECHAS */}
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Fecha Elaboración</label>
            <input type="date" className="w-full bg-slate-800 border border-slate-700 text-white p-2.5 rounded-lg outline-none"
              value={formData.fecha_elaboracion} onChange={(e) => setFormData({...formData, fecha_elaboracion: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Fecha Vencimiento</label>
            <input type="date" className="w-full bg-slate-800 border border-slate-700 text-white p-2.5 rounded-lg outline-none"
              value={formData.fecha_vencimiento} onChange={(e) => setFormData({...formData, fecha_vencimiento: e.target.value})}
            />
          </div>

          {/* RESPONSABLES */}
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Responsable *</label>
            <select className="w-full bg-slate-800 border border-slate-700 text-white p-2.5 rounded-lg outline-none"
              value={formData.responsable_id} onChange={(e) => setFormData({...formData, responsable_id: e.target.value})}
            >
              <option value="">Seleccione responsable...</option>
              {responsables.map(r => <option key={r.id} value={r.id}>{r.nombre_completo || r.email}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Control QA</label>
            <select className="w-full bg-slate-800 border border-slate-700 text-white p-2.5 rounded-lg outline-none"
              value={formData.qa_id} onChange={(e) => setFormData({...formData, qa_id: e.target.value})}
            >
              <option value="">Seleccione QA...</option>
              {responsables.map(r => <option key={r.id} value={r.id}>{r.nombre_completo || r.email}</option>)}
            </select>
          </div>
        </div>

        <button type="submit" disabled={!codigoGenerado} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl shadow-lg transition-all transform active:scale-95 disabled:opacity-50">
          REGISTRAR MATERIA BASE
        </button>
      </form>
    </div>
  );
};