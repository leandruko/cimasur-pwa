// src/components/Admin/MasterDataAdmin.tsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { db } from '../../lib/db';

export const MasterDataAdmin = () => {
  const [tiposBase, setTiposBase] = useState([]);
  const [nuevoTipo, setNuevoTipo] = useState('');

  // Cargar datos actuales
  const loadData = async () => {
    const { data } = await supabase.from('tipo_base').select('*');
    if (data) {
      setTiposBase(data);
      // Guardar en Dexie para que funcione Offline
      await db.tipo_base.clear();
      await db.tipo_base.bulkPut(data);
    }
  };

  useEffect(() => { loadData(); }, []);

  const agregarTipoBase = async () => {
    if (!nuevoTipo) return;
    const { error } = await supabase.from('tipo_base').insert([{ nombre: nuevoTipo }]);
    if (!error) {
      setNuevoTipo('');
      loadData();
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* SECCIÓN TIPOS DE BASE */}
      <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
        <h3 className="text-blue-400 font-bold mb-4 flex items-center gap-2">
          🧪 Tipos de Base
        </h3>
        <div className="flex gap-2 mb-4">
          <input 
            type="text" 
            className="flex-1 bg-slate-800 p-2 rounded border border-slate-700 text-sm"
            placeholder="Ej: Base Salina"
            value={nuevoTipo}
            onChange={(e) => setNuevoTipo(e.target.value)}
          />
          <button 
            onClick={agregarTipoBase}
            className="bg-blue-600 px-4 py-2 rounded text-sm font-bold"
          >
            Añadir
          </button>
        </div>
        <ul className="space-y-2">
          {tiposBase.map((t: any) => (
            <li key={t.id} className="bg-slate-800/50 p-2 rounded text-sm flex justify-between items-center">
              {t.nombre}
            </li>
          ))}
        </ul>
      </div>

      {/* Aquí podrías repetir lo mismo para Categorías de Producto o Clientes */}
    </div>
  );
};