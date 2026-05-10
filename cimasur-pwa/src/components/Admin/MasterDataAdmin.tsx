import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Beaker, Tag, Save, Loader2, Trash2, Database, RefreshCw } from 'lucide-react';

export const MasterDataAdmin = () => {
  const [activeTab, setActiveTab] = useState<'bases' | 'categorias'>('bases');
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });

  // --- LOGICA DE CARGA ---
  const fetchData = async () => {
    setLoading(true);
    const tabla = activeTab === 'bases' ? 'bases' : 'categoria_producto';
    const { data } = await supabase
      .from(tabla)
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) setItems(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  // --- LOGICA DE ELIMINACIÓN ---
  const eliminarItem = async (identificador: any) => {
    if (!confirm('¿Seguro que desea eliminar este registro?')) return;
    
    const tabla = activeTab === 'bases' ? 'bases' : 'categoria_producto';
    const columna = activeTab === 'bases' ? 'codigo' : 'id';

    const { error } = await supabase.from(tabla).delete().eq(columna, identificador);
    
    if (error) {
      alert("Error al eliminar: " + error.message);
    } else {
      fetchData();
    }
  };

  return (
    <div className="space-y-6">
      {/* SELECTOR DE TABS */}
      <div className="flex bg-slate-900 p-1 rounded-2xl border border-slate-800 w-fit">
        <button
          onClick={() => setActiveTab('bases')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'bases' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Beaker size={14} /> GESTIÓN DE BASES
        </button>
        <button
          onClick={() => setActiveTab('categorias')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'categorias' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Tag size={14} /> CATEGORÍAS DE PRODUCTO
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* COLUMNA IZQUIERDA: FORMULARIO */}
        <div className="lg:col-span-1">
          {activeTab === 'bases' ? (
            <FormBase onSave={fetchData} />
          ) : (
            <FormCategoria onSave={fetchData} />
          )}
        </div>

        {/* COLUMNA DERECHA: LISTADO REAL TIME */}
        <div className="lg:col-span-2">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex justify-between items-center">
              <span className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                <Database size={14} /> Registros en Sistema
              </span>
              <button onClick={fetchData} className="text-slate-500 hover:text-white">
                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-800/50 text-[10px] uppercase font-black text-slate-500">
                  <tr>
                    <th className="p-4">ID / Código</th>
                    <th className="p-4">{activeTab === 'bases' ? 'Proveedor' : 'Nombre'}</th>
                    <th className="p-4 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {items.map((item) => (
                    <tr key={item.id || item.codigo} className="hover:bg-slate-800/30">
                      <td className="p-4 font-mono font-bold text-white">{item.codigo || item.prefijo}</td>
                      <td className="p-4">{item.proveedor || item.nombre}</td>
                      <td className="p-4 text-right">
                        <button onClick={() => eliminarItem(item.id || item.codigo)} className="text-red-500/50 hover:text-red-500 p-2">
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- SUB-COMPONENTE: FORMULARIO BASES ---
const FormBase = ({ onSave }: { onSave: () => void }) => {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ codigo: '', proveedor: '', responsable_id: '811f5859-0097-4848-bc69-231317a3a992' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.from('bases').insert([form]);
    if (!error) {
      onSave();
      setForm({ ...form, codigo: '', proveedor: '' });
    } else {
      alert(error.message);
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4">
      <h3 className="text-white font-bold text-sm uppercase mb-2">Añadir Nueva Base</h3>
      <input
        required
        placeholder="Código de Base (Ej: BS-001)"
        className="w-full bg-slate-800 border-none text-white p-3 rounded-xl outline-none focus:ring-2 focus:ring-purple-500"
        value={form.codigo}
        onChange={(e) => setForm({ ...form, codigo: e.target.value.toUpperCase() })}
      />
      <input
        required
        placeholder="Nombre del Proveedor"
        className="w-full bg-slate-800 border-none text-white p-3 rounded-xl outline-none focus:ring-2 focus:ring-purple-500"
        value={form.proveedor}
        onChange={(e) => setForm({ ...form, proveedor: e.target.value })}
      />
      <button disabled={loading} className="w-full bg-purple-600 text-white font-bold py-3 rounded-xl flex justify-center gap-2">
        {loading ? <Loader2 className="animate-spin" /> : <><Save size={18} /> GUARDAR BASE</>}
      </button>
    </form>
  );
};

// --- SUB-COMPONENTE: FORMULARIO CATEGORÍAS ---
const FormCategoria = ({ onSave }: { onSave: () => void }) => {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ nombre: '', prefijo: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.from('categoria_producto').insert([form]);
    if (!error) {
      onSave();
      setForm({ nombre: '', prefijo: '' });
    } else {
      alert(error.message);
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4">
      <h3 className="text-white font-bold text-sm uppercase mb-2">Nueva Categoría de Producto</h3>
      <input
        required
        placeholder="Nombre (Ej: Suero Fisiológico)"
        className="w-full bg-slate-800 border-none text-white p-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
        value={form.nombre}
        onChange={(e) => setForm({ ...form, nombre: e.target.value })}
      />
      <input
        required
        maxLength={3}
        placeholder="Prefijo (Ej: SUR)"
        className="w-full bg-slate-800 border-none text-white p-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
        value={form.prefijo}
        onChange={(e) => setForm({ ...form, prefijo: e.target.value.toUpperCase() })}
      />
      <button disabled={loading} className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl flex justify-center gap-2">
        {loading ? <Loader2 className="animate-spin" /> : <><Save size={18} /> GUARDAR CATEGORÍA</>}
      </button>
    </form>
  );
};