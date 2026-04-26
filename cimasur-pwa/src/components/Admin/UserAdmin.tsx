// src/components/Admin/UserAdmin.tsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { db } from '../../lib/db';

export const UserAdmin = () => {
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [formData, setFormData] = useState({ email: '', password: '', nombre: '' });

  useEffect(() => {
    // Cargamos los usuarios existentes para ver a quiénes podemos elegir luego
    const fetch = async () => {
      const { data } = await supabase.from('perfiles').select('*');
      if (data) setUsuarios(data);
    };
    fetch();
  }, []);

  const crearUsuario = async (e: React.FormEvent) => {
    e.preventDefault();
    // Esto registra al usuario en el sistema de Auth de Supabase
    const { data, error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: { data: { nombre_completo: formData.nombre } }
    });

    if (error) alert("Error al crear: " + error.message);
    else {
      alert("Usuario creado. Ahora aparecerá en los listados de responsables.");
      setFormData({ email: '', password: '', nombre: '' });
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={crearUsuario} className="bg-slate-900 p-6 rounded-xl border border-slate-800 space-y-4">
        <h3 className="text-blue-500 font-bold">Registrar nuevo trabajador</h3>
        <input 
          type="text" placeholder="Nombre Completo (como aparecerá en Responsables)" 
          className="w-full bg-slate-800 p-2 rounded border border-slate-700"
          value={formData.nombre}
          onChange={e => setFormData({...formData, nombre: e.target.value})}
        />
        <input 
          type="email" placeholder="Correo" 
          className="w-full bg-slate-800 p-2 rounded border border-slate-700"
          value={formData.email}
          onChange={e => setFormData({...formData, email: e.target.value})}
        />
        <input 
          type="password" placeholder="Contraseña inicial" 
          className="w-full bg-slate-800 p-2 rounded border border-slate-700"
          value={formData.password}
          onChange={e => setFormData({...formData, password: e.target.value})}
        />
        <button className="bg-blue-600 w-full py-2 rounded font-bold">CREAR USUARIO</button>
      </form>

      <div className="bg-slate-900 rounded-xl p-4 border border-slate-800">
        <h4 className="text-slate-400 text-xs mb-4 uppercase font-bold">Trabajadores en el sistema</h4>
        <ul className="space-y-2">
          {usuarios.map(u => (
            <li key={u.id} className="text-sm text-slate-300 border-b border-slate-800 pb-2 flex justify-between">
              <span>{u.nombre_completo}</span>
              <span className="text-slate-500 text-xs">{u.email}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};