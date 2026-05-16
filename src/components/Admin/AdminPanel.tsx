import React from 'react';
import { Users, Beaker, Tag, ShieldAlert, ArrowRight } from 'lucide-react';
import { AuditLogs } from './AuditLogs';

export const AdminPanel = () => {
  const menuItems = [
    {
      title: "Trabajadores",
      desc: "Gestión de accesos y personal de planta.",
      icon: <Users className="text-green-500" size={32} />,
      link: "/dashboard/admin/usuarios",
      color: "hover:border-green-500"
    },
    {
      title: "Materias Base",
      desc: "Administrar lotes de origen y proveedores.",
      icon: <Beaker className="text-purple-500" size={32} />,
      link: "/dashboard/admin/bases",
      color: "hover:border-purple-500"
    },
    {
      title: "Categorías",
      desc: "Configurar tipos de productos y prefijos.",
      icon: <Tag className="text-blue-500" size={32} />,
      link: "/dashboard/admin/categorias",
      color: "hover:border-blue-500"
    }
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8">

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {menuItems.map((item, i) => (
          <a 
            key={i} 
            href={item.link} 
            className={`bg-slate-900 border border-slate-800 p-8 rounded-[2.5rem] transition-all group flex flex-col justify-between h-64 ${item.color} hover:scale-[1.02] shadow-xl`}
          >
            <div>
              <div className="mb-4">{item.icon}</div>
              <h3 className="text-xl font-black text-white uppercase italic">{item.title}</h3>
              <p className="text-slate-500 text-xs mt-2 font-medium">{item.desc}</p>
            </div>
            <div className="flex justify-end">
              <ArrowRight className="text-slate-700 group-hover:text-white transition-colors" />
            </div>
          </a>
        ))}
      </div>
      <div className="mt-8">
        <AuditLogs />
     </div>
    </div>
  );
};