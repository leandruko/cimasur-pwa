import React, { useState } from 'react';
import { db } from '../../lib/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { generateCode } from '../../lib/utils/codigos';

export const BaseForm = () => {
  // Selectores dinámicos desde Dexie
  const tiposBase = useLiveQuery(() => db.tipo_base.toArray());
  const usuarios = useLiveQuery(() => db.perfiles.toArray());

  const [formData, setFormData] = useState({
    tipo_id: '',
    proveedor: '',
    lote_materia_prima: '',
    cantidad: '',        // ej: "5 L"
    concentracion: '',   // ej: "0,9%"
    fecha_elaboracion: '',
    vencimiento: '',
    responsable_id: '',
    qa: 'true',
  });

  const [codigoGenerado, setCodigoGenerado] = useState('');

  return (
    <div className="max-w-4xl mx-auto p-4">
      <form className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl space-y-6">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
          <span className="w-2 h-8 bg-blue-500 rounded-full"></span>
          Registro de Materia Prima (Base)
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* SECCIÓN IDENTIFICACIÓN */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Tipo de Base</label>
              <div className="flex gap-2">
                <select 
                  className="flex-1 bg-slate-800 border border-slate-700 text-white p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  onChange={(e) => setFormData({...formData, tipo_id: e.target.value})}
                >
                  <option value="">Seleccione tipo...</option>
                  {tiposBase?.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                </select>
                <button 
                  type="button"
                  onClick={() => {/* Aquí llamaremos a la lógica del código */}}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-bold text-xs transition-colors"
                >
                  GENERAR
                </button>
              </div>
              {codigoGenerado && (
                <p className="mt-2 text-blue-400 font-mono text-sm font-bold bg-blue-500/10 p-2 rounded border border-blue-500/20">
                  CÓDIGO: {codigoGenerado}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Responsable</label>
              <select 
                className="w-full bg-slate-800 border border-slate-700 text-white p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                onChange={(e) => setFormData({...formData, responsable_id: e.target.value})}
              >
                <option value="">Seleccione responsable...</option>
                {usuarios?.map(u => <option key={u.id} value={u.id}>{u.nombre_completo}</option>)}
              </select>
            </div>
          </div>

          {/* SECCIÓN DATOS TÉCNICOS */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Cantidad (ej: 5 L)</label>
                <input 
                  type="text"
                  placeholder="5 L"
                  className="w-full bg-slate-800 border border-slate-700 text-white p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  onChange={(e) => setFormData({...formData, cantidad: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Concentración</label>
                <input 
                  type="text"
                  placeholder="0,9%"
                  className="w-full bg-slate-800 border border-slate-700 text-white p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  onChange={(e) => setFormData({...formData, concentracion: e.target.value})}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Estado QA</label>
              <select 
                className="w-full bg-slate-800 border border-slate-700 text-white p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                onChange={(e) => setFormData({...formData, qa: e.target.value})}
              >
                <option value="true">✅ OK (Aprobado)</option>
                <option value="false">❌ NO (Rechazado)</option>
              </select>
            </div>
          </div>

          {/* SECCIÓN ORIGEN Y FECHAS */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Proveedor</label>
              <input 
                type="text"
                className="w-full bg-slate-800 border border-slate-700 text-white p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                onChange={(e) => setFormData({...formData, proveedor: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Lote Materia Prima</label>
              <input 
                type="text"
                className="w-full bg-slate-800 border border-slate-700 text-white p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                onChange={(e) => setFormData({...formData, lote_materia_prima: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Fecha Elaboración</label>
              <input 
                type="date"
                className="w-full bg-slate-800 border border-slate-700 text-white p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                onChange={(e) => setFormData({...formData, fecha_elaboracion: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Vencimiento</label>
              <input 
                type="date"
                className="w-full bg-slate-800 border border-slate-700 text-white p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                onChange={(e) => setFormData({...formData, vencimiento: e.target.value})}
              />
            </div>
          </div>
        </div>

        <button 
          type="submit"
          className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-bold py-4 rounded-xl shadow-lg transform transition active:scale-95"
        >
          REGISTRAR BASE EN SISTEMA
        </button>
      </form>
    </div>
  );
};