import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Beaker, Save, Loader2, Trash2, RefreshCw } from 'lucide-react';

export const GestionBases = () => {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [form, setForm] = useState({ codigo: '', proveedor: '' });

  const fetchBases = async () => {
    const { data } = await supabase.from('bases').select('*').order('created_at', { ascending: false });
    if (data) setItems(data);
  };

  useEffect(() => { fetchBases(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from('bases').insert([{
        codigo: form.codigo.toUpperCase(),
        proveedor: form.proveedor,
        responsable_id: user?.id,
        qa: 'OK'
      }]);
      if (error) throw error;
      setForm({ codigo: '', proveedor: '' });
      fetchBases();
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h2 className="text-2xl font-black text-white flex items-center gap-2">
        <Beaker className="text-purple-500" /> GESTIÓN DE BASES
      </h2>

      <form onSubmit={handleSubmit} className="bg-slate-900 p-6 rounded-3xl border border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-4">
        <input required placeholder="CÓDIGO (BS-01)" className="bg-slate-800 p-3 rounded-xl text-white outline-none focus:ring-2 focus:ring-purple-500" value={form.codigo} onChange={e => setForm({...form, codigo: e.target.value})} />
        <input required placeholder="PROVEEDOR" className="bg-slate-800 p-3 rounded-xl text-white outline-none focus:ring-2 focus:ring-purple-500" value={form.proveedor} onChange={e => setForm({...form, proveedor: e.target.value})} />
        <button disabled={loading} className="bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-500 transition-all flex items-center justify-center gap-2">
          {loading ? <Loader2 className="animate-spin" /> : <><Save size={18}/> GUARDAR</>}
        </button>
      </form>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-slate-800 text-[10px] uppercase text-slate-500">
            <tr><th className="p-4">Código</th><th className="p-4">Proveedor</th><th className="p-4 text-right">Acción</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {items.map(item => (
              <tr key={item.codigo} className="hover:bg-slate-800/50">
                <td className="p-4 font-mono font-bold text-white">{item.codigo}</td>
                <td className="p-4">{item.proveedor}</td>
                <td className="p-4 text-right">
                  <button onClick={async () => { if(confirm('¿Eliminar?')) { await supabase.from('bases').delete().eq('codigo', item.codigo); fetchBases(); } }} className="text-red-500/50 hover:text-red-500"><Trash2 size={16}/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};