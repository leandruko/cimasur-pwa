import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Activity, Clock, AlertTriangle } from 'lucide-react';

export const AuditLogs = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchLogs = async () => {
    try {
      const { data: auditoriasData, error: audError } = await supabase
        .from('auditorias')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (audError) throw audError;

      if (auditoriasData && auditoriasData.length > 0) {
        const userIds = [...new Set(auditoriasData.map(log => log.usuario_id).filter(Boolean))];

        let perfilesMap: Record<string, string> = {};
        if (userIds.length > 0) {
          const { data: perfilesData, error: perfError } = await supabase
            .from('perfiles')
            .select('id, nombre_completo')
            .in('id', userIds);

          if (!perfError && perfilesData) {
            perfilesData.forEach(p => {
              perfilesMap[p.id] = p.nombre_completo;
            });
          }
        }

        const logsConNombres = auditoriasData.map(log => ({
          ...log,
          nombre_autor: perfilesMap[log.usuario_id] || 'Usuario Desconocido'
        }));

        setLogs(logsConNombres);
      } else {
        setLogs([]);
      }

    } catch (err: any) {
      console.error("Error cargando auditorías:", err);
      setErrorMsg(err.message || "Error al conectar con la tabla auditorias");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    
    const subscription = supabase
      .channel('auditorias_channel')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'auditorias' }, () => {
        fetchLogs();
      })
      .subscribe();

    return () => { subscription.unsubscribe(); };
  }, []);

  if (loading) return <div className="text-slate-400 animate-pulse text-center p-8 border border-slate-100 bg-white rounded-3xl mt-8 font-medium text-xs uppercase tracking-wider">Cargando historial de seguridad...</div>;

  if (errorMsg) return (
    <div className="bg-red-50 border border-red-100 rounded-2xl p-6 flex items-center gap-4 text-red-700 mt-8">
      <AlertTriangle size={24} className="shrink-0 text-red-500" />
      <div>
        <p className="font-bold text-sm uppercase tracking-wide">Error leyendo registros</p>
        <p className="text-xs text-red-600/80 mt-0.5">{errorMsg}</p>
      </div>
    </div>
  );

  return (

    <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm h-full flex flex-col mt-8">
      
      {/* CABECERA CON TEXTOS OSCUROS E ICONO CLARO */}
      <div className="flex items-center gap-2.5 mb-6">
        <div className="p-2 bg-cyan-50 rounded-xl">
          <Activity className="text-cyan-500" size={20} />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Registro de Actividad</h3>
          <p className="text-[11px] text-slate-500 font-medium">Historial analítico y operaciones en tiempo real en la nube.</p>
        </div>
      </div>

      {/* LISTADO DE EVENTOS CON FILAS GRISES CLARAS */}
      <div className="space-y-3 overflow-y-auto custom-scrollbar pr-2 flex-1 max-h-[400px]">
        {logs.map((log) => (
          <div key={log.id} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col sm:flex-row sm:items-center gap-4 hover:border-slate-200 transition-colors duration-300">
            
            {/* BADGES CONFIGURADOS PARA EL LOOK MÁS LIMPIO */}
            <div className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest w-fit shrink-0 text-center border
              ${log.accion === 'CREAR' ? 'bg-green-50 border-green-100 text-green-700' : 
                log.accion === 'ELIMINAR' ? 'bg-red-50 border-red-100 text-red-700' : 
                'bg-cyan-50 border-cyan-100 text-cyan-700'}`}
            >
              {log.accion}
            </div>

            {/* DETALLES DE AUDITORÍA EN GRIS OSCURO */}
            <div className="flex-1 min-w-0">
              <p className="text-xs text-slate-700 font-medium leading-relaxed" title={log.detalles}>{log.detalles}</p>
              <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1.5 font-medium">
                <span className="font-bold text-slate-600">{log.nombre_autor}</span> 
                <span className="text-slate-300">•</span> 
                <span className="bg-white border border-slate-200 px-1.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wide text-slate-500">{log.entidad}</span>
              </p>
            </div>

            {/* MARCA TEMPORAL EN GRIS */}
            <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono shrink-0 font-medium">
              <Clock size={12} className="text-slate-400" />
              {new Date(log.created_at).toLocaleString('es-CL', {
                day: '2-digit', month: '2-digit', hour: '2-digit', minute:'2-digit'
              })}
            </div>
          </div>
        ))}

        {logs.length === 0 && (
          <div className="text-center text-slate-400 py-8 text-xs font-medium uppercase tracking-wider">No hay registros de actividad recientes.</div>
        )}
      </div>
    </div>
  );
};