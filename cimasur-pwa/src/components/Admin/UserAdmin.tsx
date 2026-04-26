import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { db } from '../../lib/db';

export const UserAdmin = () => {
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    nombre_completo: '',
    cargo: 'Técnico'
  });

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const fetchUsuarios = async () => {
    setLoading(true);
    const { data } = await supabase.from('perfiles').select('*');
    if (data) {
      setUsuarios(data);
      // Sincronizamos localmente para que los selectores de los formularios funcionen
      await db.perfiles.clear();
      await db.perfiles.bulkAdd(data);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingId) {
      // ACTUALIZAR
      const { error } = await supabase
        .from('perfiles')
        .update({ 
          nombre_completo: formData.nombre_completo,
          cargo: formData.cargo 
        })
        .eq('id', editingId);
      
      if (!error) alert("Usuario actualizado con éxito");
    } else {
      // CREAR (SignUp)
      const { error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            nombre_completo: formData.nombre_completo,
            cargo: formData.cargo
          }
        }
      });
      if (!error) alert("Usuario creado. Debe verificar su correo.");
      else alert("Error: " + error.message);
    }
    
    setEditingId(null);
    setFormData({ email: '', password: '', nombre_completo: '', cargo: 'Técnico' });
    fetchUsuarios();
  };

  const eliminarUsuario = async (id: string) => {
    if (confirm("¿Está seguro de eliminar a este integrante?")) {
      const { error } = await supabase.from('perfiles').delete().eq('id', id);
      if (!error) fetchUsuarios();
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* FORMULARIO DE REGISTRO / EDICIÓN */}
      <form onSubmit={handleSubmit} className="bg-slate-900 p-8 rounded-2xl border border-slate-800 shadow-2xl space-y-4">
        <h3 className="text-xl font-bold text-blue-400 mb-4">
          {editingId ? '📝 Editar Integrante' : '👤 Registrar Nuevo Usuario'}
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] text-slate-500 uppercase font-black">Nombre Completo</label>
            <input 
              type="text" required
              className="w-full bg-slate-800 border border-slate-700 p-3 rounded-lg text-white focus:ring-2 focus:ring-blue-500 outline-none"
              value={formData.nombre_completo}
              onChange={e => setFormData({...formData, nombre_completo: e.target.value})}
            />
          </div>

          {!editingId && (
            <div className="space-y-1">
              <label className="text-[10px] text-slate-500 uppercase font-black">Correo Electrónico</label>
              <input 
                type="email" required
                className="w-full bg-slate-800 border border-slate-700 p-3 rounded-lg text-white focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
              />
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[10px] text-slate-500 uppercase font-black">Cargo en la Empresa</label>
            <select 
              className="w-full bg-slate-800 border border-slate-700 p-3 rounded-lg text-white focus:ring-2 focus:ring-blue-500 outline-none"
              value={formData.cargo}
              onChange={e => setFormData({...formData, cargo: e.target.value})}
            >
              <option value="Técnico">Técnico</option>
              <option value="Encargado de QA">Encargado de QA</option>
              <option value="Administrador">Administrador</option>
              <option value="Jefe de Planta">Jefe de Planta</option>
            </select>
          </div>

          {!editingId && (
            <div className="space-y-1">
              <label className="text-[10px] text-slate-500 uppercase font-black">Contraseña Temporal</label>
              <input 
                type="password" required
                className="w-full bg-slate-800 border border-slate-700 p-3 rounded-lg text-white focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
              />
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-4">
          <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-all">
            {editingId ? 'GUARDAR CAMBIOS' : 'CREAR CUENTA DE ACCESO'}
          </button>
          {editingId && (
            <button type="button" onClick={() => setEditingId(null)} className="bg-slate-700 px-6 rounded-xl text-sm font-bold">Cancelar</button>
          )}
        </div>
      </form>

      {/* LISTADO CRUD */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-800/50 text-slate-500 uppercase font-black text-[10px] tracking-widest">
            <tr>
              <th className="p-5">Nombre e Identidad</th>
              <th className="p-5">Email</th>
              <th className="p-5 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 text-slate-300">
            {loading ? (
              <tr><td colSpan={3} className="p-10 text-center animate-pulse">Cargando base de datos de personal...</td></tr>
            ) : usuarios.map(u => (
              <tr key={u.id} className="hover:bg-slate-800/30 transition-colors">
                <td className="p-5">
                  <p className="font-bold text-white text-base">{u.nombre_completo}</p>
                  <p className="text-xs text-blue-400 font-medium italic">{u.cargo}</p>
                </td>
                <td className="p-5 font-mono text-xs text-slate-400">{u.email}</td>
                <td className="p-5 text-center">
                  <div className="flex justify-center gap-4">
                    <button 
                      onClick={() => {
                        setEditingId(u.id);
                        setFormData({ email: u.email, password: '', nombre_completo: u.nombre_completo, cargo: u.cargo || 'Técnico' });
                      }}
                      className="text-blue-500 hover:text-blue-400 font-bold"
                    >
                      EDITAR
                    </button>
                    <button 
                      onClick={() => eliminarUsuario(u.id)}
                      className="text-red-500 hover:text-red-400 font-bold"
                    >
                      ELIMINAR
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};