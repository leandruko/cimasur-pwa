import React, { useEffect, useState } from 'react';
import { db } from '../lib/db';
import { supabase } from '../lib/supabase';
// IMPORTANTE: Importamos nuestra función de sincronización
import { pullMasterData } from '../services/syncService'; 

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
      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">
        {isOnline ? 'Sistema Online' : 'Modo Offline'}
      </span>
    </div>
  );
};

export const DashboardShell = ({ children, title }: { children: React.ReactNode, title: string }) => {
  const [userProfile, setUserProfile] = useState<{ nombre_completo: string, cargo: string } | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          // 1. Intentamos leer de Dexie (rápido y offline)
          let profile = await db.perfiles.get(session.user.id);
          
          // 2. Si no está en Dexie (ej: primer login), forzamos lectura de Supabase
          if (!profile) {
            const { data, error } = await supabase
              .from('perfiles')
              .select('*')
              .eq('id', session.user.id)
              .single();
              
            if (data && !error) {
              profile = data;
              // Lo guardamos en Dexie para la próxima vez
              await db.perfiles.put(profile); 
            }
          }
          
          if (profile) {
            setUserProfile(profile);
          }

          // 3. ✨ MAGIA AQUÍ: Disparamos la descarga de datos maestros silenciosamente
          pullMasterData();
        }
      } catch (error) {
        console.error("Error al cargar el perfil de usuario:", error);
      }
    };
    
    loadProfile();
  }, []);

  // Lógica de acceso: Validamos si es Administrador para mostrar el menú
  const isAdmin = userProfile?.cargo === 'Administrador';

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 p-6 flex flex-col shadow-2xl z-20">
        <div className="mb-8">
            <h2 className="text-2xl font-black text-blue-500 tracking-tighter">CIMASUR</h2>
            {userProfile && (
                <div className="mt-4 p-4 bg-slate-800/40 rounded-2xl border border-slate-700/50 shadow-inner">
                    <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest mb-1">Sesión Activa</p>
                    <p className="text-sm font-bold text-slate-100 truncate">{userProfile.nombre_completo || 'Usuario'}</p>
                    <p className="text-[10px] text-blue-400 font-bold uppercase tracking-wider mt-0.5">{userProfile.cargo || 'Trabajador'}</p>
                </div>
            )}
        </div>

        <nav className="space-y-1 flex-1 overflow-y-auto pr-2 custom-scrollbar">
          <p className="text-[10px] text-slate-600 font-black uppercase px-2 mb-2 tracking-widest">Producción</p>
          
          <a href="/dashboard" className="flex items-center gap-3 p-2.5 hover:bg-slate-800 rounded-xl transition-all text-sm font-medium group">
            <span className="group-hover:scale-110 transition-transform">🏠</span> Inicio
          </a>
          <a href="/dashboard/bases" className="flex items-center gap-3 p-2.5 hover:bg-slate-800 rounded-xl transition-all text-sm font-medium group">
            <span className="group-hover:scale-110 transition-transform">🧪</span> Bases
          </a>
          <a href="/dashboard/fabricar" className="flex items-center gap-3 p-2.5 hover:bg-slate-800 rounded-xl transition-all text-sm font-medium group">
            <span className="group-hover:scale-110 transition-transform">⚗️</span> Fabricación
          </a>
          <a href="/dashboard/almacen" className="flex items-center gap-3 p-2.5 hover:bg-slate-800 rounded-xl transition-all text-sm font-medium group">
            <span className="group-hover:scale-110 transition-transform">📦</span> Almacén
          </a>
          
          <p className="text-[10px] text-slate-600 font-black uppercase px-2 mb-2 mt-6 tracking-widest">Calidad y Despacho</p>
          
          <a href="/dashboard/etiquetar" className="flex items-center gap-3 p-2.5 hover:bg-slate-800 rounded-xl transition-all text-sm font-medium group">
            <span className="group-hover:scale-110 transition-transform">🏷️</span> Etiquetado
          </a>
          <a href="/dashboard/ventas" className="flex items-center gap-3 p-2.5 hover:bg-slate-800 rounded-xl transition-all text-sm font-medium group">
            <span className="group-hover:scale-110 transition-transform">💰</span> Ventas
          </a>
          <a href="/dashboard/reclamos" className="flex items-center gap-3 p-2.5 hover:bg-slate-800 rounded-xl transition-all text-sm font-medium group">
            <span className="group-hover:scale-110 transition-transform">⚠️</span> Reclamos
          </a>
          
          <a href="/dashboard/trazabilidad" className="flex items-center gap-3 p-2.5 hover:bg-slate-800 rounded-xl transition-all text-sm font-medium group border-t border-slate-800 mt-4 pt-4">
            <span className="group-hover:scale-110 transition-transform">🔍</span> Trazabilidad
          </a>

          {/* MENÚ ADMINISTRADOR: Filtrado por CARGO */}
          {isAdmin && (
            <div className="pt-6 mt-6 border-t border-slate-800">
              <p className="px-2 text-[10px] text-blue-500 font-black mb-2 uppercase tracking-widest">Administración</p>
              {/* Cambiamos el link para que apunte al nuevo Master Panel */}
              <a href="/dashboard/admin/panel" className="flex items-center gap-3 p-3 hover:bg-blue-600/10 rounded-xl text-blue-400 border border-transparent hover:border-blue-500/20 transition-all text-sm font-bold shadow-sm">
                <span>⚙️</span> Panel de Control Maestro
              </a>
            </div>
          )}
        </nav>

        <div className="mt-auto pt-6 border-t border-slate-800">
          <NetworkStatus />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-0 bg-slate-950">
        <header className="bg-slate-900/80 backdrop-blur-xl border-b border-slate-800 p-6 lg:p-8 flex justify-between items-center sticky top-0 z-10">
          <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-white">{title}</h1>
          <div className="flex gap-4 items-center bg-slate-900 p-2 rounded-xl border border-slate-800">
              <button 
                onClick={async () => {
                   await supabase.auth.signOut();
                   // Limpiamos Dexie al salir por seguridad (opcional, pero buena práctica)
                   // await db.delete(); 
                   window.location.href = '/login';
                }} 
                className="text-[10px] font-black text-slate-500 hover:text-red-400 transition-colors uppercase tracking-widest px-3 py-1"
              >
                Cerrar Sesión
              </button>
          </div>
        </header>

        <div className="flex-1 p-6 lg:p-8 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
};