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
        loadUsers(); 
      } catch (err: any) {
        alert(err.message);
      } finally {
        setLoading(false);
      }
  };

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
      await registrarAuditoria('ACTUALIZAR', 'Usuarios', `Cambió el cargo de ${nombre} a ${nuevoCargo}`);
      loadUsers();
    }
  };

  const handleDelete = async (id: string, nombre: string) => {
    if (!confirm("¿Estás seguro de eliminar este acceso? El usuario ya no podrá ver el dashboard.")) return;
    
    const { error } = await supabase.from('perfiles').delete().eq('id', id);
    
    if (error) {
      alert(error.message);
    } else {
      await registrarAuditoria('ELIMINAR', 'Usuarios', `Eliminó el acceso del usuario: ${nombre}`);
      loadUsers();
    }
  };

  return (
    <div className="w-full space-y-6">
      
      {/* ENCABEZADO DE LA SECCIÓN */}
      <div className="flex items-center gap-2.5 border-b border-slate-100 pb-6">
        <div className="p-2 bg-cyan-50 rounded-xl">
          <Users className="text-cyan-500" size={20} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight uppercase">Control de Personal</h2>
          <p className="text-slate-500 text-xs font-medium">Gestión de identidades, perfiles autorizados y niveles de acceso a planta.</p>
        </div>
      </div>

      {/* FORMULARIO DE REGISTRO EN FONDO BLANCO */}
      <form onSubmit={handleCreateUser} className="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nombre Completo</label>
            <input 
              required 
              placeholder="Ej: Juan Pérez" 
              className="bg-slate-50 border border-slate-200 p-3 rounded-xl text-slate-800 text-sm outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 font-medium placeholder:text-slate-400" 
              value={userForm.nombre} 
              onChange={e => setUserForm({...userForm, nombre: e.target.value})} 
            />
          </div>
          <div className="flex flex-col space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Correo Electrónico</label>
            <input 
              required 
              type="email" 
              placeholder="usuario@cimasur.cl" 
              className="bg-slate-50 border border-slate-200 p-3 rounded-xl text-slate-800 text-sm outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 font-medium placeholder:text-slate-400 font-mono" 
              value={userForm.email} 
              onChange={e => setUserForm({...userForm, email: e.target.value})} 
            />
          </div>
          <div className="flex flex-col space-y-1 md:col-span-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Contraseña Inicial</label>
            <input 
              required 
              type="password" 
              placeholder="••••••••" 
              className="bg-slate-50 border border-slate-200 p-3 rounded-xl text-slate-800 text-sm outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 font-medium placeholder:text-slate-400" 
              value={userForm.password} 
              onChange={e => setUserForm({...userForm, password: e.target.value})} 
            />
          </div>
        </div>
        <button 
          disabled={loading} 
          className="w-full bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-3.5 rounded-xl flex justify-center items-center gap-2 transition-all shadow-sm text-xs uppercase tracking-wider active:scale-[0.99]"
        >
          {loading ? <Loader2 className="animate-spin" size={14} /> : <><UserPlus size={14}/> REGISTRAR ACCESO DE TRABAJADOR</>}
        </button>
      </form>

      {/* LISTA DE TRABAJADORES EN TARJETAS BLANCAS ORDENADAS */}
      <div className="grid grid-cols-1 gap-3">
        {usuarios.map(u => (
          <div key={u.id} className="p-4 bg-white border border-slate-100 rounded-2xl flex justify-between items-center group hover:border-cyan-500/30 transition-all duration-300 shadow-sm">
            <div className="flex items-center gap-4">
              <div className={`p-2.5 rounded-xl ${u.cargo === 'administrador' ? 'bg-cyan-50' : 'bg-slate-50'}`}>
                <ShieldCheck className={u.cargo === 'administrador' ? 'text-cyan-500' : 'text-slate-400'} size={20} />
              </div>
              <div>
                <p className="font-bold text-slate-800 uppercase text-xs flex items-center gap-2 tracking-wide">
                  {u.nombre_completo}
                  {u.cargo === 'administrador' && <span className="text-[9px] bg-cyan-500 font-bold text-white px-1.5 py-0.5 rounded">ADMIN</span>}
                </p>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5">{u.email}</p>
              </div>
            </div>
            
            {/* PANEL DE ACCIONES */}
            <div className="flex gap-1.5">
              <button 
                onClick={() => handleToggleCargo(u.id, u.cargo, u.nombre_completo)}
                className="p-2 hover:bg-cyan-50 rounded-xl text-slate-400 hover:text-cyan-500 transition-colors"
                title="Modificar Privilegios"
              >
                <ShieldAlert size={18} />
              </button>
              <button 
                onClick={() => handleDelete(u.id, u.nombre_completo)}
                className="p-2 hover:bg-red-50 rounded-xl text-slate-400 hover:text-red-500 transition-colors"
                title="Revocar Permiso"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};