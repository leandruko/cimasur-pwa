import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Tag, Save, Loader2, Trash2, RefreshCw, Edit3, X, Check, ArrowLeft } from 'lucide-react';

export const GestionCategorias = () => {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [form, setForm] = useState({ nombre: '', prefijo: '' });
  
  // Estados para la edición
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ nombre: '', prefijo: '' });

  const fetchCats = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('categoria_producto')
      .select('*')
      .order('nombre', { ascending: true });
    if (data) setItems(data);
    setLoading(false);
  };

  useEffect(() => { fetchCats(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nombre || !form.prefijo) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('categoria_producto')
        .insert([{ 
          nombre: form.nombre.trim(), 
          prefijo: form.prefijo.trim().toUpperCase() 
        }]);

      if (error) throw error;
      setForm({ nombre: '', prefijo: '' });
      fetchCats();
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
      const { error } = await supabase
        .from('categoria_producto')
        .update({ 
          nombre: editForm.nombre.trim(), 
          prefijo: editForm.prefijo.trim().toUpperCase() 
        })
        .eq('id', id);

      if (error) throw error;
      setEditingId(null);
      fetchCats();
    } catch (err: any) {
      alert("Error al actualizar: " + err.message);
    }
  };

  const eliminarCat = async (id: number) => {
    if (!confirm('¿Seguro que deseas eliminar esta categoría?')) return;
    const { error } = await supabase.from('categoria_producto').delete().eq('id', id);
    if (!error) fetchCats();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* CABECERA Y BOTÓN VOLVER */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <a 
            href="/dashboard/admin/panel" 
            className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-400 transition-all"
          >
            <ArrowLeft size={20} />
          </a>
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            <Tag className="text-blue-500" /> CATEGORÍAS DE PRODUCTO
          </h2>
        </div>
        <button onClick={fetchCats} className="p-2 text-slate-500 hover:text-white transition-colors">
          <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* FORMULARIO DE CREACIÓN */}
      <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-xl">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input 
            required 
            placeholder="NOMBRE (Ej: JARABES)" 
            className="bg-slate-800 p-3 rounded-xl text-white outline-none focus:ring-2 focus:ring-blue-500" 
            value={form.nombre} 
            onChange={e => setForm({...form, nombre: e.target.value})} 
          />
          <input 
            required 
            maxLength={3}
            placeholder="PREFIJO (Ej: JAR)" 
            className="bg-slate-800 p-3 rounded-xl text-white outline-none focus:ring-2 focus:ring-blue-500" 
            value={form.prefijo} 
            onChange={e => setForm({...form, prefijo: e.target.value})} 
          />
          <button disabled={loading} className="bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-900/20">
            {loading ? <Loader2 className="animate-spin" /> : <><Save size={18}/> AÑADIR</>}
          </button>
        </form>
      </div>

      {/* TABLA DE GESTIÓN */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-slate-800/50 text-[10px] uppercase text-slate-500 font-black tracking-widest">
            <tr>
              <th className="p-5">Prefijo</th>
              <th className="p-5">Nombre de Categoría</th>
              <th className="p-5 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {items.map(item => (
              <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                <td className="p-5">
                  {editingId === item.id ? (
                    <input 
                      className="bg-slate-700 p-1 rounded text-white w-20 uppercase font-mono outline-none ring-1 ring-blue-500" 
                      value={editForm.prefijo}
                      onChange={e => setEditForm({...editForm, prefijo: e.target.value})}
                    />
                  ) : (
                    <span className="font-mono font-bold text-blue-400 bg-blue-500/10 px-2 py-1 rounded">{item.prefijo}</span>
                  )}
                </td>
                <td className="p-5 uppercase font-bold text-white">
                  {editingId === item.id ? (
                    <input 
                      className="bg-slate-700 p-1 rounded text-white w-full outline-none ring-1 ring-blue-500" 
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
                      <button onClick={() => saveEdit(item.id)} className="text-green-500 hover:bg-green-500/10 p-2 rounded-lg transition-colors">
                        <Check size={18} />
                      </button>
                      <button onClick={() => setEditingId(null)} className="text-slate-400 hover:bg-slate-500/10 p-2 rounded-lg transition-colors">
                        <X size={18} />
                      </button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => startEdit(item)} className="text-blue-500/50 hover:text-blue-500 p-2 rounded-lg hover:bg-blue-500/10 transition-all">
                        <Edit3 size={18} />
                      </button>
                      <button onClick={() => eliminarCat(item.id)} className="text-red-500/30 hover:text-red-500 p-2 rounded-lg hover:bg-red-500/10 transition-all">
                        <Trash2 size={18} />
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
            {items.length === 0 && !loading && (
              <tr>
                <td colSpan={3} className="p-10 text-center text-slate-600 italic">No hay categorías registradas.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};