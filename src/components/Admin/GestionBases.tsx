import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Beaker, Save, Loader2, Trash2, RefreshCw, Layers, Edit3, X, Check } from 'lucide-react';
// 👉 IMPORTAMOS EL SERVICIO DE AUDITORÍA
import { registrarAuditoria } from '../../services/auditService';

export const GestionBases = () => {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [form, setForm] = useState({ nombre: '', prefijo: '' });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ nombre: '', prefijo: '' });

  const fetchTiposBase = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('tipo_base')
      .select('*')
      .order('nombre', { ascending: true });
    if (data) setItems(data);
    setLoading(false);
  };

  useEffect(() => { fetchTiposBase(); }, []);

  // 1. AUDITORÍA AL CREAR TIPO DE BASE
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nombre || !form.prefijo) return;

    setLoading(true);
    try {
      const nombreLimpio = form.nombre.trim();
      const prefijoLimpio = form.prefijo.trim().toUpperCase();

      const { error } = await supabase
        .from('tipo_base')
        .insert([{ 
          nombre: nombreLimpio, 
          prefijo: prefijoLimpio 
        }]);

      if (error) throw error;
      
      // 👉 REGISTRO DE CREACIÓN
      await registrarAuditoria('CREAR', 'Tipos de Base', `Se registró el tipo de base: ${nombreLimpio} (${prefijoLimpio})`);

      setForm({ nombre: '', prefijo: '' });
      fetchTiposBase();
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (item: any) => {
    setEditingId(item.id);
    setEditForm({ nombre: item.nombre, prefijo: item.prefijo });
  };

  // 2. AUDITORÍA AL ACTUALIZAR TIPO DE BASE
  const saveEdit = async (id: number) => {
    try {
      const nombreLimpio = editForm.nombre.trim();
      const prefijoLimpio = editForm.prefijo.trim().toUpperCase();

      const { error } = await supabase
        .from('tipo_base')
        .update({ 
          nombre: nombreLimpio, 
          prefijo: prefijoLimpio 
        })
        .eq('id', id);

      if (error) throw error;

      // 👉 REGISTRO DE ACTUALIZACIÓN
      await registrarAuditoria('ACTUALIZAR', 'Tipos de Base', `Se actualizó el tipo de base a: ${nombreLimpio} (${prefijoLimpio})`);

      setEditingId(null);
      fetchTiposBase();
    } catch (err: any) {
      alert("Error al actualizar: " + err.message);
    }
  };

  // 3. AUDITORÍA AL ELIMINAR TIPO DE BASE
  const eliminarTipo = async (id: number) => {
    // Buscamos el nombre del tipo de base antes de borrarlo
    const baseSeleccionada = items.find(item => item.id === id);

    if (!confirm(`¿Seguro que deseas eliminar el tipo de base ${baseSeleccionada?.nombre}?`)) return;
    
    const { error } = await supabase.from('tipo_base').delete().eq('id', id);
    
    if (!error) {
      // 👉 REGISTRO DE ELIMINACIÓN
      await registrarAuditoria('ELIMINAR', 'Tipos de Base', `Se eliminó el tipo de base: ${baseSeleccionada?.nombre} (${baseSeleccionada?.prefijo})`);
      fetchTiposBase();
    } else {
       alert("Error al eliminar: " + error.message);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-black text-white flex items-center gap-2">
          <Beaker className="text-purple-500" /> GESTIÓN DE TIPOS DE BASE
        </h2>
        <button onClick={fetchTiposBase} className="p-2 text-slate-500 hover:text-white transition-colors">
          <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* FORMULARIO DE CREACIÓN */}
      <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-xl">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-1">
            <input 
              required 
              placeholder="NOMBRE (Ej: Salina)" 
              className="w-full bg-slate-800 p-3 rounded-xl text-white outline-none focus:ring-2 focus:ring-purple-500" 
              value={form.nombre} 
              onChange={e => setForm({...form, nombre: e.target.value})} 
            />
          </div>
          <div className="md:col-span-1">
            <input 
              required 
              maxLength={3}
              placeholder="PREFIJO (Ej: BS)" 
              className="w-full bg-slate-800 p-3 rounded-xl text-white outline-none focus:ring-2 focus:ring-purple-500" 
              value={form.prefijo} 
              onChange={e => setForm({...form, prefijo: e.target.value})} 
            />
          </div>
          <button disabled={loading} className="bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all">
            {loading ? <Loader2 className="animate-spin" /> : <><Save size={18}/> REGISTRAR</>}
          </button>
        </form>
      </div>

      {/* TABLA DE GESTIÓN */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-slate-800/50 text-[10px] uppercase text-slate-500 font-black tracking-widest">
            <tr>
              <th className="p-5">Prefijo</th>
              <th className="p-5">Nombre del Tipo de Base</th>
              <th className="p-5 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {items.map(item => (
              <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                <td className="p-5">
                  {editingId === item.id ? (
                    <input 
                      className="bg-slate-700 p-1 rounded text-white w-16 uppercase font-mono" 
                      value={editForm.prefijo}
                      onChange={e => setEditForm({...editForm, prefijo: e.target.value})}
                    />
                  ) : (
                    <span className="font-mono font-bold text-purple-400 bg-purple-500/10 px-2 py-1 rounded">{item.prefijo}</span>
                  )}
                </td>
                <td className="p-5 uppercase font-bold text-white">
                  {editingId === item.id ? (
                    <input 
                      className="bg-slate-700 p-1 rounded text-white w-full" 
                      value={editForm.nombre}
                      onChange={e => setEditForm({...editForm, nombre: e.target.value})}
                    />
                  ) : (
                    item.nombre
                  )}
                </td>
                <td className="p-5 text-right flex justify-end gap-2">
                  {editingId === item.id ? (
                    <>
                      <button onClick={() => saveEdit(item.id)} className="text-green-500 hover:bg-green-500/10 p-2 rounded-lg">
                        <Check size={18} />
                      </button>
                      <button onClick={() => setEditingId(null)} className="text-slate-400 hover:bg-slate-500/10 p-2 rounded-lg">
                        <X size={18} />
                      </button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => startEdit(item)} className="text-blue-500/50 hover:text-blue-500 p-2 rounded-lg hover:bg-blue-500/10">
                        <Edit3 size={18} />
                      </button>
                      <button onClick={() => eliminarTipo(item.id)} className="text-red-500/30 hover:text-red-500 p-2 rounded-lg hover:bg-red-500/10">
                        <Trash2 size={18} />
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
             {items.length === 0 && !loading && (
              <tr>
                <td colSpan={3} className="p-10 text-center text-slate-600 italic">No hay tipos de base registrados.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};