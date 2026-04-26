import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { db } from '../../lib/db';

export const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState<'users' | 'bases' | 'productos'>('users');
  const [loading, setLoading] = useState(false);

  // Listas de datos
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [tiposBase, setTiposBase] = useState<any[]>([]);
  const [categorias, setCategorias] = useState<any[]>([]);

  // Estados para formularios
  const [userForm, setUserForm] = useState({ email: '', password: '', nombre: '' });
  const [editingItem, setEditingItem] = useState<{ id: string | number, nombre: string } | null>(null);
  const [newItemName, setNewItemName] = useState('');

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [resUsers, resBases, resCats] = await Promise.all([
        supabase.from('perfiles').select('*').order('nombre_completo'),
        supabase.from('tipo_base').select('*').order('nombre'),
        supabase.from('categoria_producto').select('*').order('nombre')
      ]);

      if (resUsers.data) {
        setUsuarios(resUsers.data);
        await db.perfiles.clear();
        await db.perfiles.bulkPut(resUsers.data);
      }
      if (resBases.data) {
        setTiposBase(resBases.data);
        await db.tipo_base.clear();
        await db.tipo_base.bulkPut(resBases.data);
      }
      if (resCats.data) {
        setCategorias(resCats.data);
        await db.categoria_producto.clear();
        await db.categoria_producto.bulkPut(resCats.data);
      }
    } catch (error) {
      console.error("Error al sincronizar datos:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAllData(); }, []);

  // --- Lógica de Usuarios ---
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.auth.signUp({
      email: userForm.email,
      password: userForm.password,
      options: { data: { nombre_completo: userForm.nombre, cargo: 'Trabajador' } }
    });
    if (error) alert(error.message);
    else {
      alert("Trabajador registrado exitosamente.");
      setUserForm({ email: '', password: '', nombre: '' });
      loadAllData();
    }
  };

  // --- Lógica de Tipos de Base y Categorías (Creación y Edición) ---
  const handleSaveMasterData = async (table: 'tipo_base' | 'categoria_producto') => {
    if (editingItem) {
      // EDICIÓN
      const { error } = await supabase.from(table).update({ nombre: editingItem.nombre }).eq('id', editingItem.id);
      if (!error) {
        setEditingItem(null);
        loadAllData();
      }
    } else {
      // CREACIÓN
      if (!newItemName) return;
      const { error } = await supabase.from(table).insert([{ nombre: newItemName }]);
      if (!error) {
        setNewItemName('');
        loadAllData();
      }
    }
  };

  const handleDeleteMasterData = async (table: 'tipo_base' | 'categoria_producto', id: string | number) => {
    if (confirm('¿Estás seguro de eliminar este elemento? Podría afectar registros existentes.')) {
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (!error) loadAllData();
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* NAVEGACIÓN */}
      <div className="flex bg-slate-900 p-1.5 rounded-2xl border border-slate-800 shadow-xl">
        {(['users', 'bases', 'productos'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => { setActiveTab(tab); setEditingItem(null); }}
            className={`flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-tighter transition-all ${
              activeTab === tab ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {tab === 'users' ? '👥 Trabajadores' : tab === 'bases' ? '🧪 Gestión de Bases' : '📦 Gestión de Productos'}
          </button>
        ))}
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
        
        {/* SECCIÓN: TRABAJADORES */}
        {activeTab === 'users' && (
          <div className="space-y-8">
            <header>
              <h3 className="text-xl font-bold text-white uppercase tracking-tight">Registro de Personal</h3>
              <p className="text-slate-500 text-sm">Crea cuentas de acceso para los técnicos y personal de planta.</p>
            </header>

            <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-800/20 p-6 rounded-2xl border border-slate-800">
              <input 
                type="text" placeholder="Nombre Completo" required
                className="bg-slate-900 border border-slate-700 p-3 rounded-xl text-sm text-white"
                value={userForm.nombre}
                onChange={e => setUserForm({...userForm, nombre: e.target.value})}
              />
              <input 
                type="email" placeholder="Email institucional" required
                className="bg-slate-900 border border-slate-700 p-3 rounded-xl text-sm text-white"
                value={userForm.email}
                onChange={e => setUserForm({...userForm, email: e.target.value})}
              />
              <input 
                type="password" placeholder="Contraseña" required
                className="bg-slate-900 border border-slate-700 p-3 rounded-xl text-sm text-white"
                value={userForm.password}
                onChange={e => setUserForm({...userForm, password: e.target.value})}
              />
              <button className="md:col-span-3 bg-blue-600 hover:bg-blue-500 py-3 rounded-xl font-bold transition-all uppercase text-xs tracking-widest">
                + REGISTRAR TRABAJADOR
              </button>
            </form>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {usuarios.map(u => (
                <div key={u.id} className="p-4 bg-slate-800/40 rounded-2xl border border-slate-800 flex justify-between items-center">
                  <div>
                    <p className="font-bold text-slate-100">{u.nombre_completo}</p>
                    <p className="text-xs text-slate-500 font-mono">{u.email}</p>
                  </div>
                  <span className="text-[10px] bg-slate-900 px-2 py-1 rounded text-slate-400 border border-slate-700 uppercase font-bold">Activo</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SECCIÓN: GESTIÓN DE BASES Y PRODUCTOS (CREACIÓN / EDICIÓN) */}
        {activeTab !== 'users' && (
          <div className="space-y-8">
            <header>
              <h3 className="text-xl font-bold text-white uppercase tracking-tight">
                {activeTab === 'bases' ? 'Creación de Tipos de Base' : 'Gestión de Categorías de Producto'}
              </h3>
              <p className="text-slate-500 text-sm">Define los elementos que aparecerán en los selectores de los formularios.</p>
            </header>

            <div className="flex gap-3 bg-slate-800/20 p-4 rounded-2xl border border-slate-800">
              <input 
                type="text" 
                placeholder={editingItem ? "Editando nombre..." : "Nombre del nuevo tipo..."}
                className="flex-1 bg-slate-900 border border-slate-700 p-4 rounded-xl text-white outline-none focus:ring-2 focus:ring-blue-500"
                value={editingItem ? editingItem.nombre : newItemName}
                onChange={e => editingItem ? setEditingItem({...editingItem, nombre: e.target.value}) : setNewItemName(e.target.value)}
              />
              {editingItem ? (
                <>
                  <button 
                    onClick={() => handleSaveMasterData(activeTab === 'bases' ? 'tipo_base' : 'categoria_producto')}
                    className="bg-green-600 hover:bg-green-500 px-8 rounded-xl font-bold text-xs uppercase"
                  >
                    Guardar
                  </button>
                  <button 
                    onClick={() => setEditingItem(null)}
                    className="bg-slate-700 hover:bg-slate-600 px-6 rounded-xl font-bold text-xs uppercase"
                  >
                    Cancelar
                  </button>
                </>
              ) : (
                <button 
                  onClick={() => handleSaveMasterData(activeTab === 'bases' ? 'tipo_base' : 'categoria_producto')}
                  className="bg-blue-600 hover:bg-blue-500 px-8 rounded-xl font-bold text-xs uppercase"
                >
                  Añadir
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(activeTab === 'bases' ? tiposBase : categorias).map((item: any) => (
                <div key={item.id} className="p-4 bg-slate-800/40 rounded-2xl border border-slate-800 flex justify-between items-center group hover:bg-slate-800 transition-all">
                  <span className="text-slate-200 font-bold">{item.nombre}</span>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => setEditingItem({ id: item.id, nombre: item.nombre })}
                      className="text-[10px] bg-blue-600/20 text-blue-400 border border-blue-500/20 px-3 py-1 rounded-lg uppercase font-bold"
                    >
                      Editar
                    </button>
                    <button 
                      onClick={() => handleDeleteMasterData(activeTab === 'bases' ? 'tipo_base' : 'categoria_producto', item.id)}
                      className="text-[10px] bg-red-600/20 text-red-400 border border-red-500/20 px-3 py-1 rounded-lg uppercase font-bold"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};