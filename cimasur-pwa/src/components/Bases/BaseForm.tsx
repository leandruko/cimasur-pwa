import React, { useState, useEffect } from 'react';
import { db } from '../../lib/db';
import { generarCodigoBase } from '../../lib/utils/codigos';
import { supabase } from '../../lib/supabase';

export const BaseForm = () => {
  // Estados para los selectores dinámicos
  const [tiposBase, setTiposBase] = useState<any[]>([]);
  const [responsables, setResponsables] = useState<any[]>([]);
  
  // Estado del formulario
  const [formData, setFormData] = useState({
    tipo_id: '',
    responsable_id: '',
    fecha_creacion: new Date().toISOString().split('T')[0],
    notas: ''
  });

  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });

  // 1. Cargar opciones desde Dexie (Tablas Maestras)
  useEffect(() => {
    const cargarDatosMaestros = async () => {
      try {
        const [tipos, perfiles] = await Promise.all([
          db.tipo_base.toArray(),
          db.perfiles.toArray()
        ]);
        setTiposBase(tipos);
        setResponsables(perfiles);
      } catch (error) {
        console.error("Error cargando datos maestros:", error);
      }
    };
    cargarDatosMaestros();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensaje({ tipo: '', texto: '' });

    if (!formData.tipo_id || !formData.responsable_id) {
      setMensaje({ tipo: 'error', texto: 'Por favor, completa los campos obligatorios.' });
      return;
    }

    try {
      // Generar código único (ej: BAS-SAL-20240425-001)
      const tipoSeleccionado = tiposBase.find(t => t.id === formData.tipo_id);
      const codigo = await generarCodigoBase(tipoSeleccionado?.nombre || 'GEN');

      const nuevaBase = {
        codigo,
        tipo_id: formData.tipo_id,
        responsable_id: formData.responsable_id,
        fecha_creacion: formData.fecha_creacion,
        notas: formData.notas,
        synced: 0,
        dirty: 1
      };

      // Guardar en Dexie (Offline First)
      await db.bases.add(nuevaBase);

      setMensaje({ tipo: 'success', texto: `Base registrada con éxito. Código: ${codigo}` });
      
      // Resetear formulario manteniendo la fecha
      setFormData({
        ...formData,
        tipo_id: '',
        responsable_id: '',
        notas: ''
      });

    } catch (error) {
      setMensaje({ tipo: 'error', texto: 'Error al guardar la base localmente.' });
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="border-b border-slate-800 pb-4">
          <h2 className="text-xl font-bold text-white">Registro de Materia Base</h2>
          <p className="text-slate-400 text-sm">Ingresa los datos para generar un nuevo lote de base.</p>
        </div>

        {mensaje.texto && (
          <div className={`p-3 rounded-lg text-sm font-medium ${
            mensaje.tipo === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
          }`}>
            {mensaje.texto}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Selector de Tipo de Base */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase">Tipo de Base *</label>
            <select
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none"
              value={formData.tipo_id}
              onChange={(e) => setFormData({...formData, tipo_id: e.target.value})}
            >
              <option value="">Seleccionar tipo...</option>
              {tiposBase.map((tipo) => (
                <option key={tipo.id} value={tipo.id}>{tipo.nombre}</option>
              ))}
            </select>
          </div>

          {/* Selector de Responsable */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase">Responsable *</label>
            <select
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none"
              value={formData.responsable_id}
              onChange={(e) => setFormData({...formData, responsable_id: e.target.value})}
            >
              <option value="">¿Quién registra?</option>
              {responsables.map((res) => (
                <option key={res.id} value={res.id}>{res.nombre_completo || res.email}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase">Fecha de Creación</label>
            <input
              type="date"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white outline-none"
              value={formData.fecha_creacion}
              onChange={(e) => setFormData({...formData, fecha_creacion: e.target.value})}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500 uppercase">Notas / Observaciones</label>
          <textarea
            className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white h-24 outline-none"
            placeholder="Detalles adicionales del lote..."
            value={formData.notas}
            onChange={(e) => setFormData({...formData, notas: e.target.value})}
          />
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-blue-900/20"
        >
          GENERAR LOTE DE BASE
        </button>
      </form>
    </div>
  );
};