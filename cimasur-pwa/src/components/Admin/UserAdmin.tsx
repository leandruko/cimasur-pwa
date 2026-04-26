import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

export const UserAdmin = () => {
  const [usuarios, setUsuarios] = useState<any[]>([]);

  useEffect(() => {
    fetchPerfiles();
  }, []);

  const fetchPerfiles = async () => {
    const { data } = await supabase.from('perfiles').select('*');
    if (data) setUsuarios(data);
  };

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
      <table className="w-full text-left">
        <thead className="bg-slate-800 text-slate-400 text-xs uppercase">
          <tr>
            <th className="p-4">Nombre Completo</th>
            <th className="p-4">Email</th>
            <th className="p-4">Rol</th>
            <th className="p-4">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800">
          {usuarios.map(u => (
            <tr key={u.id} className="hover:bg-slate-800/50">
              <td className="p-4 font-bold text-white">{u.nombre_completo}</td>
              <td className="p-4 text-slate-400">{u.email}</td>
              <td className="p-4 text-blue-400">{u.rol}</td>
              <td className="p-4">
                <button className="text-xs bg-slate-700 hover:bg-slate-600 px-2 py-1 rounded">Editar Rol</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};