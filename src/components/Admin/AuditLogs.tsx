import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Activity, Clock, AlertTriangle } from 'lucide-react';

export const AuditLogs = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchLogs = async () => {
    try {
      // 1. Traemos SOLO las auditorías (sin JOIN para que no crashee)
      const { data: auditoriasData, error: audError } = await supabase
        .from('auditorias')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (audError) throw audError;

      if (auditoriasData && auditoriasData.length > 0) {
        // 2. Extraemos todos los IDs de los usuarios únicos que hicieron acciones
        const userIds = [...new Set(auditoriasData.map(log => log.usuario_id).filter(Boolean))];

        // 3. Traemos los nombres de esos usuarios desde la tabla perfiles
        let perfilesMap: Record<string, string> = {};
        if (userIds.length > 0) {
          const { data: perfilesData, error: perfError } = await supabase
            .from('perfiles')
            .select('id, nombre_completo')
            .in('id', userIds);

          if (!perfError && perfilesData) {
            // Creamos un diccionario { id: 'Nombre' } para buscar rápido
            perfilesData.forEach(p => {
              perfilesMap[p.id] = p.nombre_completo;
            });
          }
        }

        // 4. Juntamos los datos: A cada registro le pegamos el nombre de su autor
        const logsConNombres = auditoriasData.map(log => ({
          ...log,
          nombre_autor: perfilesMap[log.usuario_id] || 'Usuario Desconocido'
        }));

        setLogs(logsConNombres);
      } else {
        setLogs([]); // Si está vacía, mostramos 0
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
    
    // Suscripción en tiempo real (Opcional, pero se ve genial)
    const subscription = supabase
      .channel('auditorias_channel')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'auditorias' }, () => {
        fetchLogs(); // Si alguien hace algo, recargamos la lista solitos
      })
      .subscribe();

    return () => { subscription.unsubscribe(); };
  }, []);

  if (loading) return <div className="text-slate-500 animate-pulse text-center p-8 border border-slate-800 rounded-3xl mt-8">Cargando historial de seguridad...</div>;

  if (errorMsg) return (
    <div className="bg-red-950/30 border border-red-900 rounded-3xl p-6 flex items-center gap-4 text-red-500 mt-8">
      <AlertTriangle size={32} />
      <div>
        <p className="font-bold">Error leyendo registros</p>
        <p className="text-sm text-red-400">{errorMsg}</p>
      </div>
    </div>
  );

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl h-full flex flex-col mt-8">
      <div className="flex items-center gap-3 mb-6">
        <Activity className="text-purple-500" size={24} />
        <h3 className="text-xl font-black text-white uppercase italic">Registro de Actividad</h3>
      </div>

      <div className="space-y-4 overflow-y-auto custom-scrollbar pr-2 flex-1 max-h-[400px]">
        {logs.map((log) => (
          <div key={log.id} className="p-4 bg-slate-950/50 border border-slate-800/50 rounded-2xl flex flex-col sm:flex-row sm:items-center gap-4 hover:border-slate-700 transition-colors">
            
            <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider w-fit shrink-0
              ${log.accion === 'CREAR' ? 'bg-green-500/10 text-green-400' : 
                log.accion === 'ELIMINAR' ? 'bg-red-500/10 text-red-400' : 
                'bg-blue-500/10 text-blue-400'}`}
            >
              {log.accion}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm text-white font-medium truncate" title={log.detalles}>{log.detalles}</p>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                <span className="font-bold text-slate-400">{log.nombre_autor}</span> 
                • {log.entidad}
              </p>
            </div>

            <div className="flex items-center gap-1 text-[10px] text-slate-600 font-mono shrink-0">
              <Clock size={12} />
              {new Date(log.created_at).toLocaleString('es-CL', {
                day: '2-digit', month: '2-digit', hour: '2-digit', minute:'2-digit'
              })}
            </div>
          </div>
        ))}

        {logs.length === 0 && (
          <div className="text-center text-slate-500 py-8 text-sm">No hay registros de actividad recientes.</div>
        )}
      </div>
    </div>
  );
};