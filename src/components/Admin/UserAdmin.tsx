import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Users, UserPlus, ShieldCheck, Loader2 } from 'lucide-react';

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
    const { error } = await supabase.auth.signUp({
      email: userForm.email,
      password: userForm.password,
      options: { data: { nombre_completo: userForm.nombre, cargo: 'Trabajador' } }
    });
    
    if (error) alert(error.message);
    else {
      alert("Trabajador registrado.");
      setUserForm({ email: '', password: '', nombre: '' });
      loadUsers();
    }
    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-8">
        <Users className="text-green-500" size={32} />
        <h2 className="text-2xl font-black text-white uppercase italic">Control de Personal</h2>
      </div>

      <form onSubmit={handleCreateUser} className="bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-2xl space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input required placeholder="Nombre Completo" className="bg-slate-800 p-4 rounded-xl text-white outline-none focus:ring-2 focus:ring-green-500" value={userForm.nombre} onChange={e => setUserForm({...userForm, nombre: e.target.value})} />
          <input required type="email" placeholder="Email" className="bg-slate-800 p-4 rounded-xl text-white outline-none focus:ring-2 focus:ring-green-500" value={userForm.email} onChange={e => setUserForm({...userForm, email: e.target.value})} />
          <input required type="password" placeholder="Contraseña" className="bg-slate-800 p-4 rounded-xl text-white outline-none focus:ring-2 focus:ring-green-500 md:col-span-2" value={userForm.password} onChange={e => setUserForm({...userForm, password: e.target.value})} />
        </div>
        <button disabled={loading} className="w-full bg-green-600 hover:bg-green-500 text-white font-black py-4 rounded-xl flex justify-center items-center gap-2">
          {loading ? <Loader2 className="animate-spin" /> : <><UserPlus size={20}/> REGISTRAR ACCESO</>}
        </button>
      </form>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {usuarios.map(u => (
          <div key={u.id} className="p-5 bg-slate-900 border border-slate-800 rounded-2xl flex justify-between items-center">
            <div>
              <p className="font-bold text-white uppercase text-sm">{u.nombre_completo}</p>
              <p className="text-xs text-slate-500 font-mono italic">{u.email}</p>
            </div>
            <ShieldCheck className="text-slate-700" size={20} />
          </div>
        ))}
      </div>
    </div>
  );
};