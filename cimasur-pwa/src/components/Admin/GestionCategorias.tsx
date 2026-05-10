import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Tag, Save, Loader2, Trash2 } from 'lucide-react';

export const GestionCategorias = () => {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [form, setForm] = useState({ nombre: '', prefijo: '' });

  const fetchCats = async () => {
    const { data } = await supabase.from('categoria_producto').select('*').order('nombre', { ascending: true });
    if (data) setItems(data);
  };

  useEffect(() => { fetchCats(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.from('categoria_producto').insert([{
        nombre: form.nombre,
        prefijo: form.prefijo.toUpperCase()
      }]);
      if (error) throw error;
      setForm({ nombre: '', prefijo: '' });
      fetchCats();
    } catch (err: any) { alert(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h2 className="text-2xl font-black text-white flex items-center gap-2">
        <Tag className="text-blue-500" /> CATEGORÍAS DE PRODUCTO
      </h2>

      <form onSubmit={handleSubmit} className="bg-slate-900 p-6 rounded-3xl border border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-4">
        <input required placeholder="NOMBRE (SUEROS)" className="bg-slate-800 p-3 rounded-xl text-white outline-none focus:ring-2 focus:ring-blue-500" value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} />
        <input required maxLength={3} placeholder="PREFIJO (SUR)" className="bg-slate-800 p-3 rounded-xl text-white outline-none focus:ring-2 focus:ring-blue-500" value={form.prefijo} onChange={e => setForm({...form, prefijo: e.target.value})} />
        <button disabled={loading} className="bg-blue-600 text-white font-bold rounded-xl flex items-center justify-center gap-2">
          {loading ? <Loader2 className="animate-spin" /> : 'AÑADIR'}
        </button>
      </form>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-slate-800 text-[10px] uppercase text-slate-500">
            <tr><th className="p-4">Prefijo</th><th className="p-4">Nombre</th><th className="p-4 text-right">Acción</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {items.map(item => (
              <tr key={item.id} className="hover:bg-slate-800/50">
                <td className="p-4 font-mono font-bold text-white">{item.prefijo}</td>
                <td className="p-4">{item.nombre}</td>
                <td className="p-4 text-right">
                  <button onClick={async () => { if(confirm('¿Eliminar?')) { await supabase.from('categoria_producto').delete().eq('id', item.id); fetchCats(); } }} className="text-red-500/50 hover:text-red-500"><Trash2 size={16}/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};