// src/components/Dashboard/GridActions.tsx
import React from 'react';

const ActionCard = ({ title, desc, icon, href, color }: any) => (
  <a href={href} className="group p-6 bg-slate-900 border border-slate-800 rounded-xl hover:border-blue-500 transition-all shadow-lg">
    <div className={`w-12 h-12 mb-4 rounded-lg flex items-center justify-center text-2xl ${color}`}>
      {icon}
    </div>
    <h3 className="text-lg font-bold text-slate-100 group-hover:text-blue-400">{title}</h3>
    <p className="text-sm text-slate-400 mt-1">{desc}</p>
  </a>
);

export const GridActions = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      <ActionCard 
        title="Bases" desc="Materias Primas" icon="🧪" 
        href="/dashboard/bases" color="bg-blue-900/30 text-blue-400" 
      />
      <ActionCard 
        title="Fabricación" desc="Generar Lote" icon="⚗️" 
        href="/dashboard/fabricar" color="bg-purple-900/30 text-purple-400" 
      />
      <ActionCard 
        title="Almacén" desc="Control de Stock" icon="📦" 
        href="/dashboard/almacen" color="bg-amber-900/30 text-amber-400" 
      />
      <ActionCard 
        title="Etiquetado" desc="Calidad QA" icon="🏷️" 
        href="/dashboard/etiquetar" color="bg-emerald-900/30 text-emerald-400" 
      />
      <ActionCard 
        title="Ventas" desc="Salida Cliente" icon="🛒" 
        href="/dashboard/ventas" color="bg-indigo-900/30 text-indigo-400" 
      />
      <ActionCard 
        title="Trazabilidad" desc="Buscador" icon="🔍" 
        href="/dashboard/trazabilidad" color="bg-slate-800 text-slate-300" 
      />
      <ActionCard 
        title="Reclamos" desc="Buscador" icon="⚠️" 
        href="/dashboard/reclamos" color="bg-red-900/30  text-slate-300" 
      />
    </div>
  );
};