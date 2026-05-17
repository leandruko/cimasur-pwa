import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Tag, Save, Loader2, Trash2, RefreshCw, Edit3, X, Check, ArrowLeft } from 'lucide-react';
import { registrarAuditoria } from '../../services/auditService';

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
      const nombreLimpio = form.nombre.trim();
      const prefijoLimpio = form.prefijo.trim().toUpperCase();

      const { error } = await supabase
        .from('categoria_producto')
        .insert([{ nombre: nombreLimpio, prefijo: prefijoLimpio }]);

      if (error) throw error;
      
      await registrarAuditoria('CREAR', 'Categorías', `Se creó una nueva categoría: ${nombreLimpio} (${prefijoLimpio})`);

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
      const nombreLimpio = editForm.nombre.trim();
      const prefijoLimpio = editForm.prefijo.trim().toUpperCase();

      const { error } = await supabase
        .from('categoria_producto')
        .update({ nombre: nombreLimpio, prefijo: prefijoLimpio })
        .eq('id', id);

      if (error) throw error;

      await registrarAuditoria('ACTUALIZAR', 'Categorías', `Se actualizó la categoría a: ${nombreLimpio} (${prefijoLimpio})`);

      setEditingId(null);
      fetchCats();
    } catch (err: any) {
      alert("Error al actualizar: " + err.message);
    }
  };

  const eliminarCat = async (id: number) => {
    const catSeleccionada = items.find(item => item.id === id);

    if (!confirm(`¿Seguro que deseas eliminar la categoría ${catSeleccionada?.nombre}?`)) return;
    
    const { error } = await supabase.from('categoria_producto').delete().eq('id', id);
    
    if (!error) {
      await registrarAuditoria('ELIMINAR', 'Categorías', `Se eliminó la categoría: ${catSeleccionada?.nombre} (${catSeleccionada?.prefijo})`);
      fetchCats();
    } else {
      alert("Error al eliminar: " + error.message);
    }
  };

  return (
    <div className="w-full space-y-6">
      
      {/* SECCIÓN DE ENCABEZADO CON BOTÓN VOLVER INTEGRADO */}
      <div className="flex justify-between items-center border-b border-slate-100 pb-6">
        <div className="flex items-center gap-3">
          <a 
            href="/dashboard/admin/panel" 
            className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-500 hover:text-cyan-500 rounded-xl transition-all shadow-sm group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
          </a>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-cyan-50 rounded-xl">
              <Tag className="text-cyan-500" size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800 tracking-tight uppercase">Categorías de Producto</h2>
              <p className="text-slate-500 text-xs font-medium">Gestione las clasificaciones de medicamentos y asigne sus prefijos identificadores.</p>
            </div>
          </div>
        </div>
        <button onClick={fetchCats} className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-500 hover:text-cyan-500 rounded-xl transition-colors shadow-sm">
          <RefreshCw size={16} className={loading ? "animate-spin text-cyan-500" : ""} />
        </button>
      </div>

      {/* FORMULARIO DE CREACIÓN EN BLANCO */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex flex-col space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nombre de Categoría</label>
            <input 
              required 
              placeholder="Ej: Jarabes" 
              className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-slate-800 text-sm outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 font-medium placeholder:text-slate-400 uppercase" 
              value={form.nombre} 
              onChange={e => setForm({...form, nombre: e.target.value})} 
            />
          </div>
          <div className="flex flex-col space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Prefijo de Lote</label>
            <input 
              required 
              maxLength={3}
              placeholder="Ej: JAR" 
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
              {loading ? <Loader2 className="animate-spin" size={14} /> : <><Save size={14}/> AÑADIR CATEGORÍA</>}
            </button>
          </div>
        </form>
      </div>

      {/* TABLA DE GESTIÓN DE CONFIGURACIÓN */}
      <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm text-slate-700 border-collapse">
          <thead className="bg-slate-50/70 border-b border-slate-100 text-[10px] uppercase text-slate-400 font-black tracking-widest">
            <tr>
              <th className="p-4 pl-6">Prefijo</th>
              <th className="p-4">Nombre de Categoría</th>
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
                        <button onClick={() => eliminarCat(item.id)} className="text-slate-400 hover:text-red-500 p-2 rounded-xl hover:bg-red-50 transition-colors">
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
                <td colSpan={3} className="p-10 text-center text-slate-400 italic text-xs">No hay categorías configuradas en la plataforma.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};