import React, { useState, useEffect } from 'react';
import { db } from '../../lib/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { v4 as uuidv4 } from 'uuid';

export const FabricacionForm = () => {
  // Leemos las bases y categorías de la DB local
  const bases = useLiveQuery(() => db.bases.toArray());
  const categorias = useLiveQuery(() => db.categorias.toArray());
  
  const [selectedBase, setSelectedBase] = useState('');
  const [selectedCat, setSelectedCat] = useState('');
  const [loteGenerado, setLoteGenerado] = useState('');
  const [cantidad, setCantidad] = useState('');

  const handleGenerarLote = () => {
    if (!selectedCat) return alert("Selecciona una categoría primero");
    
    const cat = categorias?.find(c => c.id === selectedCat);
    const prefijo = cat?.prefijo || 'PROD';
    const fecha = new Date().toISOString().slice(0, 7).replace('-', ''); // Ej: 202604
    const random = Math.floor(Math.random() * 999).toString().padStart(3, '0');
    
    setLoteGenerado(`${prefijo}-${fecha}-${random}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loteGenerado) return alert("Debes generar el código de lote");

    const nuevaFab = {
      id: uuidv4(),
      codigo_lote: loteGenerado,
      base_id: selectedBase,
      categoria_id: selectedCat,
      cantidad_producida: parseFloat(cantidad),
      synced: 0,
      dirty: 1,
      created_at: new Date().toISOString()
    };

    await db.fabricaciones.add(nuevaFab);
    alert(`Lote ${loteGenerado} registrado con éxito.`);
    window.location.href = '/dashboard';
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto bg-slate-900 p-8 rounded-xl border border-slate-800 space-y-6 shadow-2xl">
      <div className="border-b border-slate-800 pb-4">
        <h2 className="text-xl font-bold text-purple-400">Proceso de Fabricación</h2>
        <p className="text-slate-400 text-sm">Vincule una materia prima para generar un nuevo lote.</p>
      </div>

      <div className="space-y-4">
        {/* Selección de Base */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Materia Prima (Base)</label>
          <select 
            required
            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-purple-600 outline-none"
            value={selectedBase}
            onChange={(e) => setSelectedBase(e.target.value)}
          >
            <option value="">Seleccione una base disponible...</option>
            {bases?.map(b => (
              <option key={b.id} value={b.id}>{b.codigo_base} - {b.nombre_materia_prima}</option>
            ))}
          </select>
        </div>

        {/* Selección de Categoría */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Categoría de Producto</label>
          <select 
            required
            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-purple-600 outline-none"
            value={selectedCat}
            onChange={(e) => setSelectedCat(e.target.value)}
          >
            <option value="">Seleccione familia...</option>
            {categorias?.map(c => (
              <option key={c.id} value={c.id}>{c.nombre} ({c.prefijo})</option>
            ))}
          </select>
        </div>

        {/* Cantidad */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Cantidad a Producir (Lts/Kg)</label>
          <input 
            type="number" 
            required
            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-purple-600 outline-none"
            value={cantidad}
            onChange={(e) => setCantidad(e.target.value)}
          />
        </div>

        {/* Generador de Lote */}
        <div className="pt-4">
          <button 
            type="button" 
            onClick={handleGenerarLote}
            className="text-purple-400 text-sm font-bold hover:text-purple-300 underline underline-offset-4"
          >
            ✦ Generar Código de Lote Automático
          </button>
          
          {loteGenerado && (
            <div className="mt-4 p-4 bg-purple-900/20 border border-purple-500/50 rounded-lg text-center">
              <span className="text-slate-400 text-xs block mb-1 uppercase tracking-widest">Código Identificador</span>
              <span className="text-2xl font-black text-white font-mono">{loteGenerado}</span>
            </div>
          )}
        </div>
      </div>

      <button 
        type="submit" 
        className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 rounded-lg transition-all shadow-lg shadow-purple-900/20"
      >
        REGISTRAR FABRICACIÓN
      </button>
    </form>
  );
};