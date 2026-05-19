import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { registrarAuditoria } from '../../services/auditService';
import { Activity, Clock, AlertTriangle, Edit2, Trash2, Loader2, Save, X, Database } from 'lucide-react';

export const AuditLogs = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [filtroAccion, setFiltroAccion] = useState<string>('TODOS');
  
  // Estados para la Edición y Eliminación Crítica
  const [editandoReg, setEditandoReg] = useState<any | null>(null);
  const [tablaDestino, setTablaDestino] = useState<string>('');
  const [campoLlave, setCampoLlave] = useState<string>('');
  const [actionLoading, setActionLoading] = useState(false);

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

  // 🛠️ FUNCIÓN AUXILIAR: Mapea el log a la tabla real de Supabase
  const mapearTablaYKey = (entidadLog: string) => {
    let tabla = '';
    let llave = 'lote_id';
    const entidad = entidadLog.toLowerCase();

    if (entidad.includes('base')) { tabla = 'bases'; llave = 'codigo'; }
    else if (entidad.includes('fabricació') || entidad.includes('fabricacion')) { tabla = 'fabricaciones'; llave = 'codigo_lote'; }
    else if (entidad.includes('almacé') || entidad.includes('almacen')) { tabla = 'almacenamientos'; llave = 'lote_id'; }
    else if (entidad.includes('etiquetado')) { tabla = 'etiquetados'; llave = 'lote_id'; }
    else if (entidad.includes('venta')) { tabla = 'ventas'; llave = 'id'; } // Ventas usa id (uuid)

    return { tabla, llave };
  };

  // 🛠️ ACCIÓN 1: EDITAR REGISTRO CON TODOS SUS CAMPOS
  const handleEditarDirecto = async (log: any) => {
    setActionLoading(true);
    const { tabla, llave } = mapearTablaYKey(log.entidad);

    if (!tabla) {
      alert("Este tipo de log no está asociado a una tabla editable.");
      setActionLoading(false);
      return;
    }

    try {
      // Extraemos el código (ej: CB-202605-001) del texto usando Regex
      const regexCodigo = /([A-Z]{2,4}-\d{6}-\d{3})/g;
      const coincidencia = log.detalles.match(regexCodigo);
      
      // Si es ventas, el identificador podría no ser un código de lote formateado, buscamos el UUID de la venta si está, o el lote
      let valorBusqueda = coincidencia ? coincidencia[0] : null;

      if (!valorBusqueda && tabla === 'ventas') {
        // Fallback para ventas si no pilla código de lote, busca palabras clave o asume el lote_id del texto
        const palabras = log.detalles.split(' ');
        valorBusqueda = palabras.find((p: string) => p.includes('-')) || null;
      }

      if (!valorBusqueda) throw new Error("No se pudo extraer el identificador del registro desde el texto del log.");

      const { data: registroReal, error: errReal } = await supabase
        .from(tabla)
        .select('*')
        .eq(llave, valorBusqueda)
        .maybeSingle();

      if (errReal) throw errReal;
      if (!registroReal) throw new Error(`El registro original [${valorBusqueda}] ya no existe en la tabla '${tabla}'.`);

      setTablaDestino(tabla);
      setCampoLlave(llave);
      setEditandoReg(registroReal); // Carga el objeto completo con TODAS sus columnas
    } catch (err: any) {
      alert(`Error al buscar registro: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // 🛠️ ACCIÓN 2: ELIMINAR REGISTRO DIRECTAMENTE DESDE EL LOG
  const handleEliminarDirecto = async (log: any) => {
    const { tabla, llave } = mapearTablaYKey(log.entidad);
    if (!tabla) return alert("No se puede mapear este log a una tabla eliminable.");

    const regexCodigo = /([A-Z]{2,4}-\d{6}-\d{3})/g;
    const coincidencia = log.detalles.match(regexCodigo);
    const valorBusqueda = coincidencia ? coincidencia[0] : null;

    if (!valorBusqueda) return alert("No se pudo extraer el identificador para proceder al borrado.");

    const confirmar = window.confirm(`⚠️ ¿Está seguro de ELIMINAR el registro original [${valorBusqueda}] en la tabla '${tabla}' desde este log?`);
    if (!confirmar) return;

    setActionLoading(true);
    try {
      const { error } = await supabase.from(tabla).delete().eq(llave, valorBusqueda);
      if (error) throw error;

      await registrarAuditoria('ELIMINAR', `Admin - Fuerza`, `Eliminó el registro [${valorBusqueda}] directamente desde la central de logs.`);
      alert(`✓ Registro [${valorBusqueda}] eliminado de la base de datos.`);
      fetchLogs();
    } catch (err: any) {
      alert(`Error al eliminar: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // 🛠️ ACCIÓN 3: GUARDAR EL FORMULARIO COMPLETO MODIFICADO
  const handleGuardarCambiosDirectos = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editandoReg || !tablaDestino || !campoLlave) return;

    setActionLoading(true);
    const idTarget = editandoReg[campoLlave];

    try {
      const { error } = await supabase
        .from(tablaDestino)
        .update(editandoReg)
        .eq(campoLlave, idTarget);

      if (error) throw error;

      await registrarAuditoria('ACTUALIZAR', `Admin - Fuerza`, `Modificó de forma integral el registro [${idTarget}] en ${tablaDestino} desde logs.`);
      alert(`✅ Registro [${idTarget}] actualizado con éxito de forma completa.`);
      setEditandoReg(null);
      fetchLogs();
    } catch (err: any) {
      alert(`Error al guardar actualización: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const logsFiltrados = logs.filter(log => filtroAccion === 'TODOS' || log.accion === filtroAccion);

  return (
    <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm h-full flex flex-col mt-8 space-y-4">
      
      {/* CABECERA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-cyan-50 rounded-xl">
            <Activity className="text-cyan-500" size={20} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Módulo de Auditoría Avanzada</h3>
            <p className="text-[11px] text-slate-500 font-medium">Historial interactivo con permisos de rectificación completa sobre la base de datos.</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-200/60 self-start sm:self-auto">
          {['TODOS', 'CREAR', 'ACTUALIZAR', 'ELIMINAR'].map((tipo) => (
            <button
              key={tipo}
              onClick={() => setFiltroAccion(tipo)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
                filtroAccion === tipo ? 'bg-white text-cyan-600 shadow-sm border border-slate-200/40' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {tipo === 'ACTUALIZAR' ? 'EDICIÓN' : tipo === 'TODOS' ? 'VER TODO' : tipo}
            </button>
          ))}
        </div>
      </div>

      {/* LISTADO DE EVENTOS */}
      <div className="space-y-3 overflow-y-auto custom-scrollbar pr-2 flex-1 max-h-[400px]">
        {logsFiltrados.map((log) => (
          <div key={log.id} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col sm:flex-row sm:items-center gap-4 hover:border-slate-200 transition-colors duration-300">
            
            <div className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest w-fit shrink-0 text-center border
              ${log.accion === 'CREAR' ? 'bg-green-50 border-green-100 text-green-700' : 
                log.accion === 'ELIMINAR' ? 'bg-red-50 border-red-100 text-red-700' : 
                log.accion === 'ACTUALIZAR' ? 'bg-amber-50 border-amber-100 text-amber-700' : 'bg-cyan-50 border-cyan-100 text-cyan-700'}`}
            >
              {log.accion === 'ACTUALIZAR' ? 'EDICIÓN' : log.accion}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-xs text-slate-700 font-medium leading-relaxed">{log.detalles}</p>
              <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1.5 font-medium">
                <span className="font-bold text-slate-600">{log.nombre_autor}</span> 
                <span className="text-slate-300">•</span> 
                <span className="bg-white border border-slate-200 px-1.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wide text-slate-500">{log.entidad}</span>
              </p>
            </div>

            {/* BOTONES ACCIÓN EN FILA */}
            {log.accion !== 'ELIMINAR' && (
              <div className="flex gap-1.5 shrink-0 self-end sm:self-auto">
                <button
                  disabled={actionLoading}
                  onClick={() => handleEditarDirecto(log)}
                  className="p-2 text-slate-400 hover:text-cyan-600 bg-white hover:bg-cyan-50 rounded-xl border border-slate-200/60 transition-all flex items-center justify-center"
                  title="Modificar registro original de forma completa"
                >
                  <Edit2 size={13} />
                </button>
                <button
                  disabled={actionLoading}
                  onClick={() => handleEliminarDirecto(log)}
                  className="p-2 text-slate-400 hover:text-red-600 bg-white hover:bg-red-50 rounded-xl border border-slate-200/60 transition-all flex items-center justify-center"
                  title="Borrar registro original de Supabase"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            )}

            <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono shrink-0 font-medium">
              <Clock size={12} className="text-slate-400" />
              {new Date(log.created_at).toLocaleString('es-CL', { day: '2-digit', month: '2-digit', hour: '2-digit', minute:'2-digit' })}
            </div>
          </div>
        ))}
      </div>

      {/* 🛠️ MODAL DE RECTIFICACIÓN DINÁMICO UNIVERSAL (RECORRE TODOS LOS CAMPOS DE LA FILA) */}
      {editandoReg && (
        <div className="bg-slate-900/40 fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto pt-10 pb-10 animate-in fade-in duration-200">
          <form onSubmit={handleGuardarCambiosDirectos} className="bg-white border border-slate-100 rounded-3xl p-6 md:p-8 shadow-xl max-w-xl w-full space-y-5 my-auto animate-in zoom-in-95 duration-200">
            
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <Database className="text-cyan-500" size={18} />
                <h3 className="text-base font-bold text-slate-800 uppercase tracking-tight">
                  Modificación Integral de Registro ({tablaDestino})
                </h3>
              </div>
              <button type="button" onClick={() => setEditandoReg(null)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>

            {/* CONTENEDOR AUTO-GENERADO POR MAPEO DE LLAVES */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs max-h-[60vh] overflow-y-auto p-1 custom-scrollbar">
              {Object.keys(editandoReg).map((campo) => {
                // Filtramos las llaves automáticas del sistema que NO se deben alterar a mano
                if (['id', 'created_at', 'usuario_id', 'responsable_id', 'categoria_id'].includes(campo)) {
                  return (
                    <div key={campo} className="flex flex-col space-y-1 opacity-50">
                      <label className="font-bold text-slate-400 uppercase tracking-wide">{campo.replace('_', ' ')} (Bloqueado)</label>
                      <div className="bg-slate-100 border border-slate-200 p-2.5 rounded-xl font-mono text-slate-500 truncate">{String(editandoReg[campo])}</div>
                    </div>
                  );
                }

                // Renderizador adaptativo para campos booleanos o selectores de QA
                if (campo === 'qa') {
                  return (
                    <div key={campo} className="flex flex-col space-y-1 sm:col-span-2">
                      <label className="font-bold text-slate-500 uppercase tracking-wide">Dictamen Control (QA) *</label>
                      <select 
                        className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl font-bold text-slate-800"
                        value={editandoReg[campo] || 'CONFORME'}
                        onChange={(e) => setEditandoReg({...editandoReg, qa: e.target.value})}
                      >
                        <option value="CONFORME">conforme</option>
                        <option value="RECHAZADO">rechazado</option>
                      </select>
                    </div>
                  );
                }

                // Renderizador estándar para strings y números
                const esNumero = typeof editandoReg[campo] === 'number';
                return (
                  <div key={campo} className="flex flex-col space-y-1">
                    <label className="font-bold text-slate-600 uppercase tracking-wide">{campo.replace('_', ' ')}</label>
                    <input
                      type={esNumero ? "number" : campo.includes('fecha') || campo.includes('vencimiento') ? "date" : "text"}
                      step="any"
                      className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl font-medium text-slate-800 focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition-all font-mono"
                      value={editandoReg[campo] ?? ''}
                      onChange={(e) => setEditandoReg({
                        ...editandoReg,
                        [campo]: esNumero ? Number(e.target.value) : e.target.value
                      })}
                    />
                  </div>
                );
              })}
            </div>

            <div className="pt-4 border-t border-slate-100 flex gap-2 justify-end">
              <button type="button" onClick={() => setEditandoReg(null)} className="bg-slate-100 text-slate-600 px-4 py-2 rounded-xl text-xs font-bold uppercase">Cancelar</button>
              <button type="submit" disabled={actionLoading} className="bg-cyan-500 hover:bg-cyan-600 text-white px-4 py-2 rounded-xl text-xs font-bold uppercase shadow-sm flex items-center gap-1.5">
                {actionLoading ? <Loader2 className="animate-spin" size={12} /> : <Save size={14} />}
                Guardar Modificación
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};