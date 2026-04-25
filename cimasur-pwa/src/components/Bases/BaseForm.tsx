import React, { useState } from 'react';
import { db } from '../../lib/db';
import { generarCodigoBase } from '../../lib/utils/codigos';
import { v4 as uuidv4 } from 'uuid';

export const BaseForm = () => {
  const [formData, setFormData] = useState({
    nombre_materia_prima: '',
    proveedor: '',
    lote_materia_prima: '',
    cantidad_ingresada: '',
    concentracion: '',
    fecha_elaboracion: '',
    fecha_vencimiento: '',
  });

  const [codigoGenerado, setCodigoGenerado] = useState('');

  const handleGenerateCode = async () => {
    // 1. Obtener el prefijo (puedes hacerlo dinámico según el tipo)
    const prefijo = formData.nombre_materia_prima.slice(0, 4).toUpperCase();
    
    // 2. Contar cuántas bases hay para el correlativo
    const count = await db.bases.count();
    
    // 3. Generar el código (SALI-202604-001)
    const nuevoCodigo = generarCodigoBase(prefijo || 'BASE', count + 1);
    setCodigoGenerado(nuevoCodigo);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!codigoGenerado) return alert("Primero genera el código base");

    const nuevaBase = {
      ...formData,
      id: uuidv4(),
      codigo_base: codigoGenerado,
      synced: 0,
      dirty: 1,
      created_at: new Date().toISOString()
    };

    await db.bases.add(nuevaBase);
    alert("Base registrada localmente. Se sincronizará al detectar internet.");
    window.location.href = '/dashboard';
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-slate-900 p-8 rounded-xl border border-slate-800">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Materia Prima y Botón de Generar */}
        <div className="space-y-2">
          <label className="text-sm text-slate-400">Materia Prima</label>
          <div className="flex gap-2">
            <input 
              type="text" 
              required
              className="flex-1 bg-slate-800 border border-slate-700 p-2 rounded text-white"
              value={formData.nombre_materia_prima}
              onChange={e => setFormData({...formData, nombre_materia_prima: e.target.value})}
            />
            <button 
              type="button"
              onClick={handleGenerateCode}
              className="bg-blue-600 px-3 rounded text-xs font-bold hover:bg-blue-500"
            >
              GENERAR CÓDIGO
            </button>
          </div>
          {codigoGenerado && (
            <div className="mt-2 p-2 bg-blue-900/20 border border-blue-500/50 rounded text-blue-400 font-mono text-center font-bold">
              ID: {codigoGenerado}
            </div>
          )}
        </div>

        {/* Proveedor */}
        <div className="space-y-2">
          <label className="text-sm text-slate-400">Proveedor / Lote Origen</label>
          <input 
            type="text" 
            className="w-full bg-slate-800 border border-slate-700 p-2 rounded text-white"
            placeholder="Ej: Lote Ext: 998822"
            onChange={e => setFormData({...formData, lote_materia_prima: e.target.value})}
          />
        </div>

        {/* Cantidad y Concentración */}
        <div className="space-y-2">
          <label className="text-sm text-slate-400">Cantidad (Kg/L)</label>
          <input 
            type="number" step="0.01" required
            className="w-full bg-slate-800 border border-slate-700 p-2 rounded text-white"
            onChange={e => setFormData({...formData, cantidad_ingresada: e.target.value})}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm text-slate-400">Concentración (%)</label>
          <input 
            type="number" step="0.1"
            className="w-full bg-slate-800 border border-slate-700 p-2 rounded text-white"
            onChange={e => setFormData({...formData, concentracion: e.target.value})}
          />
        </div>

        {/* Fechas */}
        <div className="space-y-2">
          <label className="text-sm text-slate-400">Fecha Elaboración</label>
          <input 
            type="date" required
            className="w-full bg-slate-800 border border-slate-700 p-2 rounded text-white"
            onChange={e => setFormData({...formData, fecha_elaboracion: e.target.value})}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm text-slate-400">Vencimiento</label>
          <input 
            type="date" required
            className="w-full bg-slate-800 border border-slate-700 p-2 rounded text-white"
            onChange={e => setFormData({...formData, fecha_vencimiento: e.target.value})}
          />
        </div>
      </div>

      <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-lg transition-colors">
        REGISTRAR EN BASE DE DATOS
      </button>
    </form>
  );
};