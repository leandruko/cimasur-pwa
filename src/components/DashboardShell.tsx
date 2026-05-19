import React, { useEffect, useState } from 'react';
import { db } from '../lib/db';
import { supabase } from '../lib/supabase';
import { pullMasterData } from '../services/syncService'; 
import { Home, Beaker, Layers, Package, Tag, ShoppingCart, AlertTriangle, Search, Settings, LogOut, Wifi, WifiOff } from 'lucide-react';

const NetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleStatus = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', handleStatus);
    window.addEventListener('offline', handleStatus);
    return () => {
      window.removeEventListener('online', handleStatus);
      window.removeEventListener('offline', handleStatus);
    };
  }, []);

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#050505]/40 border border-slate-800/60 backdrop-blur-sm">
      {isOnline ? (
        <>
          <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.6)]" />
          <span className="text-[9px] uppercase font-bold text-cyan-400 tracking-wider">Sistema Online</span>
        </>
      ) : (
        <>
          <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.6)]" />
          <span className="text-[9px] uppercase font-bold text-red-400 tracking-wider">Modo Offline</span>
        </>
      )}
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
          let profile = await db.perfiles.get(session.user.id);
          
          if (!profile) {
            const { data, error } = await supabase
              .from('perfiles')
              .select('*')
              .eq('id', session.user.id)
              .single();
              
            if (data && !error) {
              profile = data;
              await db.perfiles.put(profile); 
            }
          }
          
          if (profile) {
            setUserProfile(profile);
          }
          pullMasterData();
        }
      } catch (error) {}
    };
    
    loadProfile();
  }, []);

  const isAdmin = userProfile?.cargo?.toLowerCase().trim() === 'administrador';

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#f4f6f9] text-slate-800 font-sans">
      
      {/* SIDEBAR LATERAL: Color oscuro integrado exacto a la imagen */}
      <aside className="w-64 bg-[#0b0f19] border-r border-slate-800/40 p-5 flex flex-col shrink-0 z-20 select-none">
        
        {/* LOGO Y PERFIL DE USUARIO */}
        <div className="mb-6">
          <h2 className="text-xl font-black text-white tracking-wider px-2 flex items-center gap-2">
            CIMASUR <span className="text-[10px] bg-cyan-500 text-[#0b0f19] px-1.5 py-0.5 rounded font-black tracking-normal">LAB</span>
          </h2>
          
          {userProfile && (
            <div className="mt-4 p-3.5 bg-[#050505]/30 border border-slate-800/40 rounded-2xl shadow-inner">
              <p className="text-[9px] text-slate-500 uppercase font-bold tracking-widest mb-1">Sesión Activa</p>
              <p className="text-xs font-bold text-slate-200 truncate">{userProfile.nombre_completo || 'Usuario'}</p>
              <p className="text-[10px] text-cyan-400 font-bold uppercase tracking-wide mt-0.5">{userProfile.cargo || 'Trabajador'}</p>
            </div>
          )}
        </div>

        {/* NAVEGACIÓN: Menús con iconos nítidos e iluminaciones cian */}
        <nav className="space-y-1 flex-1 overflow-y-auto pr-1 custom-scrollbar text-slate-400">
          <p className="text-[9px] text-slate-600 font-black uppercase px-2.5 pt-2 mb-2 tracking-widest">Producción</p>
          
          <a href="/dashboard" className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-800/50 hover:text-white rounded-xl transition-colors text-xs font-bold uppercase tracking-wide group">
            <Home size={16} className="text-slate-500 group-hover:text-cyan-400 transition-colors" /> Inicio
          </a>
          <a href="/dashboard/bases" className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-800/50 hover:text-white rounded-xl transition-colors text-xs font-bold uppercase tracking-wide group">
            <Beaker size={16} className="text-slate-500 group-hover:text-cyan-400 transition-colors" /> Bases
          </a>
          <a href="/dashboard/fabricar" className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-800/50 hover:text-white rounded-xl transition-colors text-xs font-bold uppercase tracking-wide group">
            <Layers size={16} className="text-slate-500 group-hover:text-cyan-400 transition-colors" /> Fabricación
          </a>
          <a href="/dashboard/almacen" className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-800/50 hover:text-white rounded-xl transition-colors text-xs font-bold uppercase tracking-wide group">
            <Package size={16} className="text-slate-500 group-hover:text-cyan-400 transition-colors" /> Almacén
          </a>
          
          <p className="text-[9px] text-slate-600 font-black uppercase px-2.5 pt-4 mb-2 tracking-widest">Calidad y Despacho</p>
          
          <a href="/dashboard/etiquetar" className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-800/50 hover:text-white rounded-xl transition-colors text-xs font-bold uppercase tracking-wide group">
            <Tag size={16} className="text-slate-500 group-hover:text-cyan-400 transition-colors" /> Etiquetado
          </a>
          <a href="/dashboard/ventas" className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-800/50 hover:text-white rounded-xl transition-colors text-xs font-bold uppercase tracking-wide group">
            <ShoppingCart size={16} className="text-slate-500 group-hover:text-cyan-400 transition-colors" /> Ventas
          </a>
          <a href="/dashboard/reclamos" className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-800/50 hover:text-white rounded-xl transition-colors text-xs font-bold uppercase tracking-wide group">
            <AlertTriangle size={16} className="text-slate-500 group-hover:text-cyan-400 transition-colors" /> Reclamos
          </a>
          
          <a href="/dashboard/trazabilidad" className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-800/50 hover:text-white rounded-xl transition-colors text-xs font-bold uppercase tracking-wide group border-t border-slate-800/60 mt-4 pt-4">
            <Search size={16} className="text-slate-500 group-hover:text-cyan-400 transition-colors" /> Trazabilidad
          </a>

          {/* ACCESOS DE ADMINISTRACIÓN FILTRADOS */}
          {isAdmin && (
            <div className="pt-4 mt-4 border-t border-slate-800/60">
              <p className="px-2.5 text-[9px] text-cyan-500 font-black mb-2 uppercase tracking-widest">Administración</p>
              <a href="/dashboard/admin/panel" className="flex items-center gap-3 p-3 bg-cyan-500/5 hover:bg-cyan-500/10 rounded-xl text-cyan-400 border border-cyan-500/10 hover:border-cyan-500/20 transition-all text-xs font-bold uppercase tracking-wide shadow-sm">
                <Settings size={14} /> Control Maestro
              </a>
            </div>
          )}
        </nav>

        {/* INDICADOR DE RED INFERIOR */}
        <div className="pt-4 border-t border-slate-800/60">
          <NetworkStatus />
        </div>
      </aside>

      {/* CONTENIDO PRINCIPAL CENTRAL (Fondo gris claro para resaltar las tarjetas blancas) */}
      <main className="flex-1 flex flex-col min-h-0 bg-[#f4f6f9]">
        
        {/* TOP BAR SUPERIOR */}
        <header className="bg-white border-b border-slate-200/60 p-4 lg:px-8 flex justify-between items-center shrink-0 z-10 select-none shadow-sm">
          <h1 className="text-lg lg:text-xl font-bold text-slate-800 uppercase tracking-tight">{title}</h1>
          
          <div className="flex gap-4 items-center">
            <button 
              onClick={async () => {
                 await supabase.auth.signOut();
                 window.location.href = '/login';
              }} 
              className="text-[10px] font-bold text-slate-400 hover:text-red-500 border border-slate-200 hover:border-red-100 bg-slate-50 hover:bg-red-50 transition-all rounded-xl uppercase tracking-wider px-3 py-2 flex items-center gap-1.5"
            >
              <LogOut size={12} />
              Cerrar Sesión
            </button>
          </div>
        </header>

        {/* AREA DE RENDERIZADO INTERNO */}
        <div className="flex-1 p-5 lg:p-8 overflow-y-auto custom-scrollbar">
          {children}
        </div>
      </main>
    </div>
  );
};