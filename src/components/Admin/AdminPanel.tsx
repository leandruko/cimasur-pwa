import React from 'react';
import { Users, Beaker, Tag, ArrowRight } from 'lucide-react';
import { AuditLogs } from './AuditLogs';

export const AdminPanel = () => {
  const menuItems = [
    {
      title: "Trabajadores",
      desc: "Gestión de accesos y personal de planta.",
      icon: <Users size={20} />,
      link: "/dashboard/admin/usuarios"
    },
    {
      title: "Materias Base",
      desc: "Administrar lotes de origen y proveedores.",
      icon: <Beaker size={20} />,
      link: "/dashboard/admin/bases"
    },
    {
      title: "Categorías",
      desc: "Configurar tipos de productos y prefijos.",
      icon: <Tag size={20} />,
      link: "/dashboard/admin/categorias"
    }
  ];

  return (
    <div className="w-full space-y-8 bg-[#f4f5f6]">
      {/* TARJETAS DE ADMINISTRACIÓN EN FONDO BLANCO IMPECABLE */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
        {menuItems.map((item, i) => (
          <a 
            key={i} 
            href={item.link} 
            className="group p-6 bg-white border border-slate-100 rounded-2xl hover:border-cyan-500/50 transition-all duration-300 shadow-sm flex items-center gap-4 relative overflow-hidden"
          >
            {/* Efecto sutil de iluminación de fondo clara al pasar el mouse */}
            <div className="absolute inset-0 bg-cyan-500/[0.01] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            {/* Contenedor del Icono con fondo claro y detalles cian */}
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-cyan-50 border border-cyan-100 text-cyan-500 shrink-0 group-hover:bg-cyan-100 group-hover:text-cyan-600 transition-all duration-300">
              {item.icon}
            </div>
            
            {/* Textos ordenados con contrastes oscuros idénticos a los formularios */}
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide group-hover:text-cyan-600 transition-colors">
                {item.title}
              </h3>
              <p className="text-xs text-slate-400 font-medium mt-0.5 truncate">
                {item.desc}
              </p>
            </div>

            {/* Indicador de acción a la derecha en tono cian al hacer hover */}
            <div className="shrink-0 pl-1">
              <ArrowRight size={16} className="text-slate-400 group-hover:text-cyan-500 group-hover:translate-x-0.5 transition-all duration-300" />
            </div>
          </a>
        ))}
      </div>

      {/* HISTORIAL MAESTRO DE AUDITORÍA (YA CONFIGURADO EN BLANCO) */}
      <div className="mt-8">
        <AuditLogs />
      </div>
    </div>
  );
};