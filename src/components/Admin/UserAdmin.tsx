import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Users, UserPlus, ShieldCheck, Loader2, Trash2, ShieldAlert } from 'lucide-react';
import { registrarAuditoria } from '../../services/auditService';

export const UserAdmin = () => {
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [userForm, setUserForm] = useState({ email: '', password: '', nombre: '' });

  const loadUsers = async () => {
    const { data } = await supabase.from('perfiles').select('*').order('nombre_completo');
    if (data) setUsuarios(data);
  };

  useEffect(() => { loadUsers(); }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      
      try {
        // Consumimos nuestra API Route interna protegida
        const response = await fetch('/api/create-user', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: userForm.email,
            password: userForm.password,
            nombre: userForm.nombre
          })
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Error al registrar el personal");
        }

        alert("Trabajador registrado exitosamente.");
        await registrarAuditoria('CREAR', 'Usuarios', `Se registró un nuevo trabajador con correo: ${userForm.email}`);
        setUserForm({ email: '', password: '', nombre: '' });
        loadUsers(); // Recargamos la lista
      } catch (err: any) {
        alert(err.message);
      } finally {
        setLoading(false);
      }
  };

  // NUEVA: Función para cambiar el cargo
// NUEVA: Función para cambiar el cargo CON AUDITORÍA
  const handleToggleCargo = async (id: string, currentCargo: string, nombre: string) => {
    const nuevoCargo = currentCargo === 'administrador' ? 'Trabajador' : 'administrador';
    if (!confirm(`¿Cambiar cargo a ${nuevoCargo}?`)) return;

    const { error } = await supabase
      .from('perfiles')
      .update({ cargo: nuevoCargo })
      .eq('id', id);

    if (error) {
      alert(error.message);
    } else {
      // 👉 REGISTRAMOS LA AUDITORÍA DE ACTUALIZACIÓN
      await registrarAuditoria('ACTUALIZAR', 'Usuarios', `Cambió el cargo de ${nombre} a ${nuevoCargo}`);
      loadUsers();
    }
  };

  // NUEVA: Función para eliminar CON AUDITORÍA
  const handleDelete = async (id: string, nombre: string) => {
    if (!confirm("¿Estás seguro de eliminar este acceso? El usuario ya no podrá ver el dashboard.")) return;
    
    const { error } = await supabase.from('perfiles').delete().eq('id', id);
    
    if (error) {
      alert(error.message);
    } else {
      // 👉 REGISTRAMOS LA AUDITORÍA DE ELIMINACIÓN
      await registrarAuditoria('ELIMINAR', 'Usuarios', `Eliminó el acceso del usuario: ${nombre}`);
      loadUsers();
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-8">
        <Users className="text-blue-500" size={32} />
        <h2 className="text-2xl font-black text-white uppercase italic">Control de Personal</h2>
      </div>

      {/* Formulario de Registro */}
      <form onSubmit={handleCreateUser} className="bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-2xl space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input required placeholder="Nombre Completo" className="bg-slate-800 p-4 rounded-xl text-white outline-none focus:ring-2 focus:ring-blue-500" value={userForm.nombre} onChange={e => setUserForm({...userForm, nombre: e.target.value})} />
          <input required type="email" placeholder="Email" className="bg-slate-800 p-4 rounded-xl text-white outline-none focus:ring-2 focus:ring-blue-500" value={userForm.email} onChange={e => setUserForm({...userForm, email: e.target.value})} />
          <input required type="password" placeholder="Contraseña" className="bg-slate-800 p-4 rounded-xl text-white outline-none focus:ring-2 focus:ring-blue-500 md:col-span-2" value={userForm.password} onChange={e => setUserForm({...userForm, password: e.target.value})} />
        </div>
        <button disabled={loading} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-xl flex justify-center items-center gap-2 transition-all">
          {loading ? <Loader2 className="animate-spin" /> : <><UserPlus size={20}/> REGISTRAR ACCESO</>}
        </button>
      </form>

      {/* Lista de Usuarios con Edición */}
      <div className="grid grid-cols-1 gap-4">
        {usuarios.map(u => (
          <div key={u.id} className="p-5 bg-slate-900 border border-slate-800 rounded-2xl flex justify-between items-center group hover:border-slate-600 transition-all">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-full ${u.cargo === 'administrador' ? 'bg-blue-500/10' : 'bg-slate-800'}`}>
                <ShieldCheck className={u.cargo === 'administrador' ? 'text-blue-500' : 'text-slate-500'} size={24} />
              </div>
              <div>
                <p className="font-bold text-white uppercase text-sm flex items-center gap-2">
                  {u.nombre_completo}
                  {u.cargo === 'administrador' && <span className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded-md">ADMIN</span>}
                </p>
                <p className="text-xs text-slate-500 font-mono italic">{u.email}</p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <button 
                onClick={() => handleToggleCargo(u.id, u.cargo, u.nombre_completo)}
                className="p-2 hover:bg-blue-500/20 rounded-lg text-slate-400 hover:text-blue-500 transition-all"
                title="Cambiar Rango"
              >
                <ShieldAlert size={20} />
              </button>
              <button 
                onClick={() => handleDelete(u.id, u.nombre_completo)}
                className="p-2 hover:bg-red-500/20 rounded-lg text-slate-400 hover:text-red-500 transition-all"
                title="Eliminar Acceso"
              >
                <Trash2 size={20} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};