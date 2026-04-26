import React, { useState } from 'react';
import { db } from '../../lib/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { generateCode } from '../../lib/utils/codigos';

export const FabricacionForm = () => {
  // Selectores dinámicos desde Dexie
  const categorias = useLiveQuery(() => db.categoria_producto.toArray());
  const basesDisponibles = useLiveQuery(() => db.bases.toArray());
  const usuarios = useLiveQuery(() => db.perfiles.toArray());

  const [formData, setFormData] = useState({
    categoria_id: '',
    producto: '',
    cantidad_frascos: '',
    base_salina_id: '', // FK a Bases
    ingrediente_activo: '',
    temperatura: '',
    responsable_id: '',
    qa: 'true',
    observaciones: '',
  });

  const [loteGenerado, setLoteGenerado] = useState('');

  // Lógica para generar el código de lote (Prefijo Categoría + AñoMes + Correlativo)
  const handleGenerateLote = async () => {
    if (!formData.categoria_id) return alert("Seleccione una categoría primero");
    const cat = categorias?.find(c => String(c.id) === String(formData.categoria_id));
    if (cat) {
      // Pasamos el prefijo (o las 3 primeras letras del nombre si no hay prefijo) y la tabla
      const prefijo = cat.prefijo || cat.nombre.substring(0, 3).toUpperCase();
      const nuevoLote = await generateCode(prefijo, 'fabricaciones');
      setLoteGenerado(nuevoLote);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Evita que la página se recargue

    if (!loteGenerado) return alert("Debe generar el código de lote.");
    if (!formData.categoria_id || !formData.base_salina_id || !formData.responsable_id) {
      return alert("Faltan campos obligatorios para la trazabilidad.");
    }

    try {
      const nuevaFabricacion = {
        codigo_lote: loteGenerado, // PK
        categoria_id: formData.categoria_id,
        producto: formData.producto,
        cantidad_frascos: parseInt(formData.cantidad_frascos),
        base_salina_id: formData.base_salina_id, // Link a la tabla Bases
        ingrediente_activo: formData.ingrediente_activo,
        temperatura: parseFloat(formData.temperatura),
        responsable_id: formData.responsable_id,
        qa: formData.qa === 'true',
        observaciones: formData.observaciones || null,
        fecha_registro: new Date().toISOString(),
        synced: 0,
        dirty: 1
      };

      await db.fabricaciones.add(nuevaFabricacion);
      
      alert(`✅ Lote ${loteGenerado} registrado con éxito.`);
      window.location.href = '/dashboard';
    } catch (error) {
      console.error(error);
      alert("❌ Error al registrar la fabricación. Verifique los datos.");
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      {/* AQUÍ ESTÁ LA CORRECCIÓN PRINCIPAL: onSubmit={handleSubmit} */}
      <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl space-y-6">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
          <span className="w-2 h-8 bg-purple-500 rounded-full"></span>
          Proceso de Fabricación (Lote Final)
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* IDENTIFICACIÓN DEL PRODUCTO */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Categoría de Producto</label>
              <div className="flex gap-2">
                <select 
                  className="flex-1 bg-slate-800 border border-slate-700 text-white p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-purple-500"
                  onChange={(e) => setFormData({...formData, categoria_id: e.target.value})}
                  value={formData.categoria_id}
                >
                  <option value="">Seleccione categoría...</option>
                  {categorias?.map(c => <option key={c.id} value={c.id}>{c.nombre} ({c.prefijo || c.nombre.substring(0,3).toUpperCase()})</option>)}
                </select>
                <button 
                  type="button"
                  onClick={handleGenerateLote}
                  className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg font-bold text-xs"
                >
                  GENERAR LOTE
                </button>
              </div>
              {loteGenerado && (
                <p className="mt-2 text-purple-400 font-mono text-sm font-bold bg-purple-500/10 p-2 rounded border border-purple-500/20 text-center">
                  LOTE: {loteGenerado}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Nombre del Producto</label>
              <input 
                type="text"
                placeholder="Ej: Suero Fisiológico"
                className="w-full bg-slate-800 border border-slate-700 text-white p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-purple-500"
                onChange={(e) => setFormData({...formData, producto: e.target.value})}
                value={formData.producto}
              />
            </div>
          </div>

          {/* COMPOSICIÓN Y CANTIDAD */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Base Salina Utilizada</label>
              <select 
                className="w-full bg-slate-800 border border-slate-700 text-white p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-purple-500"
                onChange={(e) => setFormData({...formData, base_salina_id: e.target.value})}
                value={formData.base_salina_id}
              >
                <option value="">Seleccione Base (Código)...</option>
                {basesDisponibles?.map(b => <option key={b.codigo} value={b.codigo}>{b.codigo}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Cant. Frascos</label>
                <input 
                  type="number"
                  className="w-full bg-slate-800 border border-slate-700 text-white p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-purple-500"
                  onChange={(e) => setFormData({...formData, cantidad_frascos: e.target.value})}
                  value={formData.cantidad_frascos}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Temperatura (°C)</label>
                <input 
                  type="number" step="0.1"
                  className="w-full bg-slate-800 border border-slate-700 text-white p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-purple-500"
                  onChange={(e) => setFormData({...formData, temperatura: e.target.value})}
                  value={formData.temperatura}
                />
              </div>
            </div>
          </div>

          {/* INGREDIENTES Y RESPONSABLE */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Ingrediente Activo</label>
              <input 
                type="text"
                className="w-full bg-slate-800 border border-slate-700 text-white p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-purple-500"
                onChange={(e) => setFormData({...formData, ingrediente_activo: e.target.value})}
                value={formData.ingrediente_activo}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Responsable de Mezcla</label>
              <select 
                className="w-full bg-slate-800 border border-slate-700 text-white p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-purple-500"
                onChange={(e) => setFormData({...formData, responsable_id: e.target.value})}
                value={formData.responsable_id}
              >
                <option value="">Seleccione responsable...</option>
                {usuarios?.map(u => <option key={u.id} value={u.id}>{u.nombre_completo}</option>)}
              </select>
            </div>
          </div>

          {/* QA Y OBSERVACIONES */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Estado QA</label>
              <select 
                className="w-full bg-slate-800 border border-slate-700 text-white p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-purple-500"
                onChange={(e) => setFormData({...formData, qa: e.target.value})}
                value={formData.qa}
              >
                <option value="true">✅ OK (Aprobado)</option>
                <option value="false">❌ NO (Rechazado)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Observaciones</label>
              <textarea 
                rows={1}
                className="w-full bg-slate-800 border border-slate-700 text-white p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-purple-500"
                onChange={(e) => setFormData({...formData, observaciones: e.target.value})}
                value={formData.observaciones}
              ></textarea>
            </div>
          </div>
        </div>

        <button 
          type="submit"
          className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white font-bold py-4 rounded-xl shadow-lg transform transition active:scale-95"
        >
          REGISTRAR FABRICACIÓN
        </button>
      </form>
    </div>
  );
};