import React, { useState, useEffect } from 'react';
import { db } from '../../lib/db';
import { generarCodigoBase } from '../../lib/utils/codigos';

export const BaseForm = () => {
  const [tiposBase, setTiposBase] = useState<any[]>([]);
  const [responsables, setResponsables] = useState<any[]>([]);
  const [codigoGenerado, setCodigoGenerado] = useState('');
  
  // Los 9 campos exactos que pediste
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

  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });

  // Cargar maestros para los desplegables (Tipo, Responsable, QA)
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const [tipos, perfiles] = await Promise.all([
          db.tipo_base.toArray(),
          db.perfiles.toArray()
        ]);
        setTiposBase(tipos);
        setResponsables(perfiles); // Usamos perfiles tanto para Responsable como para QA
      } catch (error) {
        console.error("Error cargando datos:", error);
      }
    };
    cargarDatos();
  }, []);

  // Botón 1: Generar Código
  const handleGenerarCodigo = async () => {
    if (!formData.tipo_id) {
      setMensaje({ tipo: 'error', texto: 'Selecciona el Tipo de Base para generar el código.' });
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

  // Botón 2: Registrar Base
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensaje({ tipo: '', texto: '' });

    if (!codigoGenerado) {
      setMensaje({ tipo: 'error', texto: 'Debes generar el código base antes de registrar.' });
      return;
    }

    if (!formData.tipo_id || !formData.cantidad || !formData.responsable_id) {
      setMensaje({ tipo: 'error', texto: 'Faltan campos obligatorios.' });
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

      setMensaje({ tipo: 'success', texto: `Lote registrado exitosamente con código: ${codigoGenerado}` });
      
      // Limpiar todo después de registrar
      setFormData({
        tipo_id: '', proveedor: '', lote_materia_prima: '', cantidad: '',
        concentracion: '', fecha_elaboracion: '', fecha_vencimiento: '',
        responsable_id: '', qa_id: ''
      });
      setCodigoGenerado('');

    } catch (error) {
      console.error(error);
      setMensaje({ tipo: 'error', texto: 'Error al registrar la base en el sistema.' });
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        
        <div className="border-b border-slate-800 pb-4 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Registro de Materia Base</h2>
            <p className="text-slate-400 text-sm">Completa los datos para ingresar un nuevo lote.</p>
          </div>
          {/* Muestra el código generado si existe */}
          {codigoGenerado && (
            <div className="bg-blue-900/30 border border-blue-500/50 px-4 py-2 rounded-lg">
              <span className="text-xs text-blue-400 uppercase font-bold block">Código Generado</span>
              <span className="text-lg text-white font-mono">{codigoGenerado}</span>
            </div>
          )}
        </div>

        {mensaje.texto && (
          <div className={`p-3 rounded-lg text-sm font-medium ${
            mensaje.tipo === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
          }`}>
            {mensaje.texto}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* 1. Tipo */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">Tipo de Base *</label>
              <select
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white outline-none"
                value={formData.tipo_id}
                onChange={(e) => setFormData({...formData, tipo_id: e.target.value})}
              >
                <option value="">Seleccionar...</option>
                {tiposBase.map((tipo) => (
                  <option key={tipo.id} value={tipo.id}>{tipo.nombre}</option>
                ))}
              </select>
            </div>

            {/* 2. Proveedor */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">Proveedor</label>
              <input
                type="text"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white outline-none"
                placeholder="Nombre del proveedor"
                value={formData.proveedor}
                onChange={(e) => setFormData({...formData, proveedor: e.target.value})}
              />
            </div>

            {/* 3. Lote de Materia Prima */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">Lote Materia Prima</label>
              <input
                type="text"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white outline-none"
                placeholder="Ej: Lote-12345"
                value={formData.lote_materia_prima}
                onChange={(e) => setFormData({...formData, lote_materia_prima: e.target.value})}
              />
            </div>

            {/* 4. Cantidad */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">Cantidad *</label>
              <input
                type="number" step="0.01"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white outline-none"
                placeholder="Ej: 100"
                value={formData.cantidad}
                onChange={(e) => setFormData({...formData, cantidad: e.target.value})}
              />
            </div>

            {/* 5. Concentración */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">Concentración</label>
              <input
                type="text"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white outline-none"
                placeholder="Ej: 98%"
                value={formData.concentracion}
                onChange={(e) => setFormData({...formData, concentracion: e.target.value})}
              />
            </div>

            {/* 6. Fecha de Elaboración */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">Fecha de Elaboración</label>
              <input
                type="date"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white outline-none"
                value={formData.fecha_elaboracion}
                onChange={(e) => setFormData({...formData, fecha_elaboracion: e.target.value})}
              />
            </div>

            {/* 7. Fecha de Vencimiento */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">Fecha de Vencimiento</label>
              <input
                type="date"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white outline-none"
                value={formData.fecha_vencimiento}
                onChange={(e) => setFormData({...formData, fecha_vencimiento: e.target.value})}
              />
            </div>

            {/* 8. Responsable */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">Responsable *</label>
              <select
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white outline-none"
                value={formData.responsable_id}
                onChange={(e) => setFormData({...formData, responsable_id: e.target.value})}
              >
                <option value="">Seleccionar...</option>
                {responsables.map((res) => (
                  <option key={res.id} value={res.id}>{res.nombre_completo || res.email}</option>
                ))}
              </select>
            </div>

            {/* 9. QA */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">QA</label>
              <select
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white outline-none"
                value={formData.qa_id}
                onChange={(e) => setFormData({...formData, qa_id: e.target.value})}
              >
                <option value="">Seleccionar QA...</option>
                {responsables.map((res) => (
                  <option key={res.id} value={res.id}>{res.nombre_completo || res.email}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex gap-4">
            {/* Botón 1: Generar Código */}
            <button
              type="button"
              onClick={handleGenerarCodigo}
              className="flex-1 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white font-bold py-3 rounded-xl transition-all"
            >
              ⚙️ GENERAR CÓDIGO
            </button>

            {/* Botón 2: Registrar Base */}
            <button
              type="submit"
              disabled={!codigoGenerado} // Se bloquea si no hay código generado
              className={`flex-1 font-bold py-3 rounded-xl transition-all shadow-lg ${
                codigoGenerado 
                  ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/20' 
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              💾 REGISTRAR BASE
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};