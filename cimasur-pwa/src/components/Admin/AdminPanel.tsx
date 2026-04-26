import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { db } from '../../lib/db';

export const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState<'users' | 'bases' | 'productos'>('users');
  const [loading, setLoading] = useState(false);

  // Estados para las listas de datos maestros
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [tiposBase, setTiposBase] = useState<any[]>([]);
  const [categorias, setCategorias] = useState<any[]>([]);

  // Estados para los formularios
  const [userForm, setUserForm] = useState({ email: '', password: '', nombre: '' });
  const [newItemName, setNewItemName] = useState('');

  // Función para cargar todo desde Supabase y sincronizar con Dexie
  const loadAllData = async () => {
    setLoading(true);
    try {
      const [resUsers, resBases, resCats] = await Promise.all([
        supabase.from('perfiles').select('*'),
        supabase.from('tipo_base').select('*'),
        supabase.from('categoria_producto').select('*')
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
      console.error("Error cargando datos:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAllData(); }, []);

  // Crear usuario en Supabase Auth y Tabla Perfiles
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data, error } = await supabase.auth.signUp({
      email: userForm.email,
      password: userForm.password,
      options: { 
        data: { 
          nombre_completo: userForm.nombre,
          cargo: 'Trabajador' // Cargo por defecto para los nuevos
        } 
      }
    });

    if (error) {
      alert("Error: " + error.message);
    } else {
      alert("Trabajador registrado correctamente. Ya aparecerá en los selectores.");
      setUserForm({ email: '', password: '', nombre: '' });
      loadAllData();
    }
  };

  // Añadir Tipos de Base o Categorías
  const handleAddMasterData = async (table: 'tipo_base' | 'categoria_producto') => {
    if (!newItemName) return;
    const { error } = await supabase.from(table).insert([{ nombre: newItemName }]);
    
    if (error) {
      alert("Error al añadir: " + error.message);
    } else {
      setNewItemName('');
      loadAllData();
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
      {/* NAVEGACIÓN DE PESTAÑAS */}
      <div className="flex bg-slate-900 p-1.5 rounded-2xl border border-slate-800 shadow-inner">
        {(['users', 'bases', 'productos'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
              activeTab === tab 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' 
                : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'
            }`}
          >
            {tab === 'users' ? '👥 Trabajadores' : tab === 'bases' ? '🧪 Tipos de Base' : '📦 Categorías'}
          </button>
        ))}
      </div>

      {/* CONTENIDO PRINCIPAL */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl min-h-[500px]">
        
        {/* PESTAÑA: TRABAJADORES (RESPONSABLES) */}
        {activeTab === 'users' && (
          <div className="space-y-8">
            <header>
              <h3 className="text-xl font-bold text-white">Gestión de Personal</h3>
              <p className="text-slate-400 text-sm">Registra a los técnicos que operarán el sistema.</p>
            </header>

            <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-800/30 p-6 rounded-2xl border border-slate-700/50">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 font-bold uppercase ml-1">Nombre Completo</label>
                <input 
                  type="text" required placeholder="Ej: Juan Pérez"
                  className="w-full bg-slate-900 border border-slate-700 p-3 rounded-xl text-sm text-white outline-none focus:ring-2 focus:ring-blue-500"
                  value={userForm.nombre}
                  onChange={e => setUserForm({...userForm, nombre: e.target.value})}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 font-bold uppercase ml-1">Correo Electrónico</label>
                <input 
                  type="email" required placeholder="usuario@cimasur.cl"
                  className="w-full bg-slate-900 border border-slate-700 p-3 rounded-xl text-sm text-white outline-none focus:ring-2 focus:ring-blue-500"
                  value={userForm.email}
                  onChange={e => setUserForm({...userForm, email: e.target.value})}
                />
              </div>
              <div className="space-y-1 md:col-span-2">
                <label className="text-[10px] text-slate-500 font-bold uppercase ml-1">Contraseña de Acceso</label>
                <input 
                  type="password" required placeholder="Mínimo 6 caracteres"
                  className="w-full bg-slate-900 border border-slate-700 p-3 rounded-xl text-sm text-white outline-none focus:ring-2 focus:ring-blue-500"
                  value={userForm.password}
                  onChange={e => setUserForm({...userForm, password: e.target.value})}
                />
              </div>
              <button className="md:col-span-2 bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all mt-2">
                + Crear Cuenta de Trabajador
              </button>
            </form>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {usuarios.map(u => (
                <div key={u.id} className="flex flex-col p-4 bg-slate-800/40 rounded-2xl border border-slate-800 hover:border-slate-700 transition-colors">
                  <span className="font-bold text-slate-100">{u.nombre_completo}</span>
                  <span className="text-xs text-slate-500 font-mono">{u.email}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PESTAÑA: CONFIGURACIÓN MAESTRA (BASES Y PRODUCTOS) */}
        {activeTab !== 'users' && (
          <div className="space-y-8">
            <header>
              <h3 className="text-xl font-bold text-white">
                {activeTab === 'bases' ? 'Configuración de Materia Base' : 'Configuración de Productos'}
              </h3>
              <p className="text-slate-400 text-sm">Define las opciones que aparecerán en los formularios de registro.</p>
            </header>

            <div className="flex gap-3">
              <input 
                type="text" 
                placeholder={`Nuevo nombre de ${activeTab === 'bases' ? 'base' : 'categoría'}...`}
                className="flex-1 bg-slate-800 border border-slate-700 p-4 rounded-2xl text-white outline-none focus:ring-2 focus:ring-blue-500"
                value={newItemName}
                onChange={e => setNewItemName(e.target.value)}
              />
              <button 
                onClick={() => handleAddMasterData(activeTab === 'bases' ? 'tipo_base' : 'categoria_producto')}
                className="bg-blue-600 hover:bg-blue-500 px-8 rounded-2xl font-black text-xs uppercase tracking-widest transition-all"
              >
                Añadir
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(activeTab === 'bases' ? tiposBase : categorias).map((item: any) => (
                <div key={item.id} className="p-4 bg-slate-800/40 rounded-2xl border border-slate-800 flex justify-between items-center group hover:bg-slate-800/60 transition-all">
                  <span className="text-slate-200 font-medium">{item.nombre}</span>
                  <span className="text-[9px] text-slate-600 font-mono bg-slate-900 px-2 py-1 rounded">ID: {item.id.slice(0,8)}</span>
                </div>
              ))}
              {(activeTab === 'bases' ? tiposBase : categorias).length === 0 && (
                <p className="text-slate-600 text-sm italic col-span-2 text-center py-10">No hay datos registrados aún.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};