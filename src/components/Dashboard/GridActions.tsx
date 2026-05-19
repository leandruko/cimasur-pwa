import React from 'react';

const ActionCard = ({ title, desc, icon, href }: any) => (
  <a 
    href={href} 
    className="group p-5 bg-white border border-slate-100 rounded-2xl hover:border-cyan-500/40 hover:shadow-md transition-all duration-300 flex items-center gap-4 relative overflow-hidden"
  >
    {/* Efecto de resplandor sutil claro al pasar el mouse por encima */}
    <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/0 via-cyan-500/0 to-cyan-500/[0.015] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

    {/* Contenedor del Icono adaptado al look claro con fondo pastel cian */}
    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl bg-cyan-50 border border-cyan-100/70 text-cyan-500 shrink-0 group-hover:bg-cyan-100 group-hover:text-cyan-600 transition-all duration-300">
      {icon}
    </div>
    
    {/* Textos con altos contrastes adaptados al fondo blanco */}
    <div className="flex-1 min-w-0">
      <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider group-hover:text-cyan-600 transition-colors">
        {title}
      </h3>
      <p className="text-xs text-slate-400 font-medium mt-0.5 truncate">
        {desc}
      </p>
    </div>
  </a>
);

export const GridActions = () => {
  return (
    // Grid responsivo adaptado al espacio de trabajo maestro claro
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
      <ActionCard 
        title="Bases" desc="Materias Primas" icon="🧪" 
        href="/dashboard/bases" 
      />
      <ActionCard 
        title="Fabricación" desc="Generar Lote Maestro" icon="⚗️" 
        href="/dashboard/fabricar" 
      />
      <ActionCard 
        title="Almacén" desc="Control de Stock de Planta" icon="📦" 
        href="/dashboard/almacen" 
      />
      <ActionCard 
        title="Etiquetado" desc="Validación de Calidad QA" icon="🏷️" 
        href="/dashboard/etiquetar" 
      />
      <ActionCard 
        title="Ventas" desc="Salidas e Historial Cliente" icon="🛒" 
        href="/dashboard/ventas" 
      />
      <ActionCard 
        title="Trazabilidad" desc="Buscador Analítico Maestro" icon="🔍" 
        href="/dashboard/trazabilidad" 
      />
      <ActionCard 
        title="Reclamos" desc="Incidencias y Alertas QA" icon="⚠️" 
        href="/dashboard/reclamos" 
      />
    </div>
  );
};