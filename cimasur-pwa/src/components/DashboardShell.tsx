import React, { useEffect, useState } from 'react';
import { db } from '../lib/db';
import { supabase } from '../lib/supabase';

const NetworkStatus = () => {
  const [isOnline, setIsOnline] = React.useState(navigator.onLine);

  React.useEffect(() => {
    const handleStatus = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', handleStatus);
    window.addEventListener('offline', handleStatus);
    return () => {
      window.removeEventListener('online', handleStatus);
      window.removeEventListener('offline', handleStatus);
    };
  }, []);

  return (
    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-950 border border-slate-800">
      <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-red-500 animate-pulse'}`} />
      <span className="text-[10px] uppercase font-bold text-slate-400">
        {isOnline ? 'Sistema Online' : 'Modo Offline'}
      </span>
    </div>
  );
};

export const DashboardShell = ({ children, title }: { children: React.ReactNode, title: string }) => {
  // Cambiamos el estado para incluir 'cargo'
  const [userProfile, setUserProfile] = useState<{ nombre_completo: string, cargo: string } | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const profile = await db.perfiles.get(session.user.id);
        if (profile) setUserProfile(profile);
      }
    };
    loadProfile();
  }, []);

  // Lógica de acceso: Solo si el cargo es exactamente "Administrador"
  const isAdmin = userProfile?.cargo === 'Administrador';

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 p-6 flex flex-col">
        <div className="mb-8">
            <h2 className="text-2xl font-bold text-blue-500 tracking-tighter">CIMASUR</h2>
            {userProfile && (
                <div className="mt-4 p-3 bg-slate-800/50 rounded-xl border border-slate-700 shadow-inner">
                    <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest">Sesión Activa</p>
                    <p className="text-sm font-bold text-slate-100 truncate">{userProfile.nombre_completo}</p>
                    <p className="text-[10px] text-blue-400 font-bold italic">{userProfile.cargo}</p>
                </div>
            )}
        </div>

        <nav className="space-y-1 flex-1 overflow-y-auto pr-2 custom-scrollbar">
          <p className="text-[10px] text-slate-600 font-black uppercase px-2 mb-2 tracking-widest">Producción</p>
          
          <a href="/dashboard" className="flex items-center gap-3 p-2 hover:bg-slate-800 rounded-lg transition-all text-sm group">
            <span className="group-hover:scale-110 transition-transform">🏠</span> Inicio
          </a>
          <a href="/dashboard/bases" className="flex items-center gap-3 p-2 hover:bg-slate-800 rounded-lg transition-all text-sm group">
            <span className="group-hover:scale-110 transition-transform">🧪</span> Bases
          </a>
          <a href="/dashboard/fabricar" className="flex items-center gap-3 p-2 hover:bg-slate-800 rounded-lg transition-all text-sm group">
            <span className="group-hover:scale-110 transition-transform">⚗️</span> Fabricación
          </a>
          <a href="/dashboard/almacen" className="flex items-center gap-3 p-2 hover:bg-slate-800 rounded-lg transition-all text-sm group">
            <span className="group-hover:scale-110 transition-transform">📦</span> Almacén
          </a>
          
          <p className="text-[10px] text-slate-600 font-black uppercase px-2 mb-2 mt-6 tracking-widest">Calidad y Despacho</p>
          
          <a href="/dashboard/etiquetar" className="flex items-center gap-3 p-2 hover:bg-slate-800 rounded-lg transition-all text-sm group">
            <span className="group-hover:scale-110 transition-transform">🏷️</span> Etiquetado
          </a>
          <a href="/dashboard/ventas" className="flex items-center gap-3 p-2 hover:bg-slate-800 rounded-lg transition-all text-sm group">
            <span className="group-hover:scale-110 transition-transform">💰</span> Ventas
          </a>
          <a href="/dashboard/reclamos" className="flex items-center gap-3 p-2 hover:bg-slate-800 rounded-lg transition-all text-sm group">
            <span className="group-hover:scale-110 transition-transform">⚠️</span> Reclamos
          </a>
          
          <a href="/dashboard/trazabilidad" className="flex items-center gap-3 p-2 hover:bg-slate-800 rounded-lg transition-all text-sm group border-t border-slate-800 mt-4 pt-4">
            <span className="group-hover:scale-110 transition-transform">🔍</span> Trazabilidad
          </a>

          {/* MENÚ ADMINISTRADOR: Filtrado por CARGO */}
          {isAdmin && (
            <div className="pt-6 mt-6 border-t border-slate-800">
              <p className="px-2 text-[10px] text-red-500 font-black mb-2 uppercase tracking-widest">Administración</p>
              <a href="/dashboard/admin/usuarios" className="flex items-center gap-3 p-2 hover:bg-red-500/10 rounded-lg text-red-400 transition-all text-sm font-bold">
                <span>👥</span> Gestionar Usuarios
              </a>
            </div>
          )}
        </nav>

        <div className="mt-auto pt-6 border-t border-slate-800">
          <NetworkStatus />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-0">
        <header className="bg-slate-950/50 backdrop-blur-md border-b border-slate-800 p-8 flex justify-between items-center sticky top-0 z-10">
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          <div className="flex gap-4 items-center">
              <button 
                onClick={async () => {
                   await supabase.auth.signOut();
                   window.location.href = '/login';
                }} 
                className="text-xs font-bold text-slate-500 hover:text-red-400 transition-colors uppercase tracking-widest"
              >
                Cerrar Sesión
              </button>
          </div>
        </header>

        <div className="flex-1 p-8 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
};