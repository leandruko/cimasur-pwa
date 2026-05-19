import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Beaker, Save, Loader2, Trash2, RefreshCw, Edit3, X, Check } from 'lucide-react';
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

      await registrarAuditoria('ACTUALIZAR', 'Tipos de Base', `Se actualizó el tipo de base a: ${nombreLimpio} (${prefijoLimpio})`);

      setEditingId(null);
      fetchTiposBase();
    } catch (err: any) {
      alert("Error al actualizar: " + err.message);
    }
  };

  const eliminarTipo = async (id: number) => {
    const baseSeleccionada = items.find(item => item.id === id);

    if (!confirm(`¿Seguro que deseas eliminar el tipo de base ${baseSeleccionada?.nombre}?`)) return;
    
    const { error } = await supabase.from('tipo_base').delete().eq('id', id);
    
    if (!error) {
      await registrarAuditoria('ELIMINAR', 'Tipos de Base', `Se marcó como eliminado el tipo de base: ${baseSeleccionada?.nombre} (${baseSeleccionada?.prefijo})`);
      fetchTiposBase();
    } else {
       alert("Error al eliminar: " + error.message);
    }
  };

  return (
    <div className="w-full space-y-6 ">
      
      {/* SECCIÓN DE ENCABEZADO */}
      <div className="flex justify-between items-center border-b border-slate-100 pb-6">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-cyan-50 rounded-xl">
            <Beaker className="text-cyan-500" size={20} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800 tracking-tight uppercase">Gestión de Tipos de Base</h2>
            <p className="text-slate-500 text-xs font-medium">Configure los nombres de materia prima base y sus nomenclaturas abreviadas.</p>
          </div>
        </div>
        <button onClick={fetchTiposBase} className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-500 hover:text-cyan-500 rounded-xl transition-colors shadow-sm">
          <RefreshCw size={16} className={loading ? "animate-spin text-cyan-500" : ""} />
        </button>
      </div>

      {/* FORMULARIO DE CREACIÓN EN BLANCO */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex flex-col space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nombre de Base</label>
            <input 
              required 
              placeholder="Ej: Salina" 
              className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-slate-800 text-sm outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 font-medium placeholder:text-slate-400" 
              value={form.nombre} 
              onChange={e => setForm({...form, nombre: e.target.value})} 
            />
          </div>
          <div className="flex flex-col space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Prefijo (Código)</label>
            <input 
              required 
              maxLength={3}
              placeholder="Ej: BS" 
              className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-slate-800 text-sm outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 font-bold uppercase font-mono placeholder:text-slate-400" 
              value={form.prefijo} 
              onChange={e => setForm({...form, prefijo: e.target.value})} 
            />
          </div>
          <div className="flex items-end">
            <button 
              type="submit"
              disabled={loading} 
              className="w-full bg-cyan-500 hover:bg-cyan-600 text-white font-bold h-11 rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm text-xs uppercase tracking-wider active:scale-[0.99]"
            >
              {loading ? <Loader2 className="animate-spin" size={14} /> : <><Save size={14}/> REGISTRAR TIPO</>}
            </button>
          </div>
        </form>
      </div>

      {/* TABLA DE CONFIGURACIÓN MAESTRA */}
      <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm text-slate-700 border-collapse">
          <thead className="bg-slate-50/70 border-b border-slate-100 text-[10px] uppercase text-slate-400 font-black tracking-widest">
            <tr>
              <th className="p-4 pl-6">Prefijo</th>
              <th className="p-4">Nombre del Tipo de Base</th>
              <th className="p-4 pr-6 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map(item => (
              <tr key={item.id} className="hover:bg-slate-50/50 transition-colors duration-150">
                <td className="p-4 pl-6">
                  {editingId === item.id ? (
                    <input 
                      className="bg-slate-50 border border-slate-200 p-1.5 rounded text-slate-800 text-xs w-20 uppercase font-mono font-bold outline-none focus:ring-1 focus:ring-cyan-500" 
                      value={editForm.prefijo}
                      onChange={e => setEditForm({...editForm, prefijo: e.target.value})}
                    />
                  ) : (
                    <span className="font-mono font-bold text-cyan-600 bg-cyan-50 border border-cyan-100/50 px-2 py-1 rounded text-xs">{item.prefijo}</span>
                  )}
                </td>
                <td className="p-4 uppercase font-bold text-slate-800 text-xs tracking-wide">
                  {editingId === item.id ? (
                    <input 
                      className="bg-slate-50 border border-slate-200 p-1.5 rounded text-slate-800 text-xs w-full max-w-sm font-medium outline-none focus:ring-1 focus:ring-cyan-500" 
                      value={editForm.nombre}
                      onChange={e => setEditForm({...editForm, nombre: e.target.value})}
                    />
                  ) : (
                    item.nombre
                  )}
                </td>
                <td className="p-4 pr-6 text-right">
                  <div className="flex justify-end gap-1">
                    {editingId === item.id ? (
                      <>
                        <button onClick={() => saveEdit(item.id)} className="text-green-600 hover:bg-green-50 p-2 rounded-xl transition-colors">
                          <Check size={16} />
                        </button>
                        <button onClick={() => setEditingId(null)} className="text-slate-400 hover:bg-slate-50 p-2 rounded-xl transition-colors">
                          <X size={16} />
                        </button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => startEdit(item)} className="text-slate-400 hover:text-cyan-500 p-2 rounded-xl hover:bg-cyan-50 transition-colors">
                          <Edit3 size={16} />
                        </button>
                        <button onClick={() => eliminarTipo(item.id)} className="text-slate-400 hover:text-red-500 p-2 rounded-xl hover:bg-red-50 transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {items.length === 0 && !loading && (
              <tr>
                <td colSpan={3} className="p-10 text-center text-slate-400 italic text-xs">No hay tipos de base configurados en el catálogo.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};