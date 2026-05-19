import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import * as XLSX from 'xlsx';
import { 
  Search, Loader2, Printer, FileSpreadsheet, Calendar, AlertCircle, CheckCircle2, XCircle
} from 'lucide-react';

export const Searcher = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [lotesHoy, setLotesHoy] = useState<any[]>([]);
  const [loteSeleccionado, setLoteSeleccionado] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Filtros de fecha
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [lotesRango, setLotesRango] = useState<any[]>([]);
  const [buscandoRango, setBuscandoRango] = useState(false);

  useEffect(() => {
    const cargarRecientes = async () => {
      const { data } = await supabase
        .from('fabricaciones')
        .select('codigo_lote, producto')
        .order('created_at', { ascending: false })
        .limit(10);
      if (data) setLotesHoy(data);
    };
    cargarRecientes();
  }, []);

  const realizarBusquedaCompleta = async (codigoLote: string) => {
    setLoading(true);
    setError(null);
    setLoteSeleccionado(null);

    try {
      const { data: lote, error: errLote } = await supabase
        .from('fabricaciones')
        .select('*')
        .eq('codigo_lote', codigoLote)
        .maybeSingle();

      if (errLote) throw errLote;
      if (!lote) throw new Error(`El lote ${codigoLote} no existe en la base de datos.`);

      const { data: perfilFab } = await supabase
        .from('perfiles')
        .select('nombre_completo')
        .eq('id', lote.responsable_id)
        .maybeSingle();

      const [resBase, resAlmacen, resEtiquetado, resVentas, resReclamos] = await Promise.all([
        supabase.from('bases').select('*').eq('codigo', lote.base_salina_id).maybeSingle(),
        supabase.from('almacenamientos').select('*').eq('lote_id', codigoLote).maybeSingle(),
        supabase.from('etiquetados').select('*').eq('lote_id', codigoLote).maybeSingle(),
        supabase.from('ventas').select('*').eq('lote_id', codigoLote),
        supabase.from('reclamos').select('*').eq('lote_id', codigoLote)
      ]);

      const [resNombreBase, resNombreAlmacen, resNombreEtiq] = await Promise.all([
        resBase.data ? supabase.from('perfiles').select('nombre_completo').eq('id', resBase.data.responsable_id).maybeSingle() : null,
        resAlmacen.data ? supabase.from('perfiles').select('nombre_completo').eq('id', resAlmacen.data.responsable_id).maybeSingle() : null,
        resEtiquetado.data ? supabase.from('perfiles').select('nombre_completo').eq('id', resEtiquetado.data.responsable_id).maybeSingle() : null
      ]);

      setLoteSeleccionado({
        lote,
        base: resBase.data,
        almacen: resAlmacen.data,
        etiquetado: resEtiquetado.data,
        ventas: resVentas.data || [],
        reclamos: resReclamos.data || [],
        responsables: {
          fab: perfilFab?.nombre_completo || 'N/A',
          base: resNombreBase?.data?.nombre_completo || 'N/A',
          almacen: resNombreAlmacen?.data?.nombre_completo || 'N/A',
          etiq: resNombreEtiq?.data?.nombre_completo || 'N/A'
        }
      });
      
      setSearchTerm(codigoLote);
    } catch (err: any) {
      console.error("Error en búsqueda:", err);
      setError(err.message);
    } fillado: {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm) realizarBusquedaCompleta(searchTerm.toUpperCase());
  };

  const handleFiltrarRango = async (e: React.FormEvent) => {
    e.preventDefault();
    setBuscandoRango(true);
    const { data } = await supabase
      .from('fabricaciones')
      .select('codigo_lote, producto, created_at')
      .gte('created_at', fechaDesde)
      .lte('created_at', fechaHasta + 'T23:59:59')
      .order('created_at', { ascending: false });
    
    setLotesRango(data || []);
    setBuscandoRango(false);
  };

  const exportarExcel = () => {
    if (!loteSeleccionado) return;
    const { lote, base, almacen, etiquetado, ventas, responsables, reclamos } = loteSeleccionado;

    const dataReporte = [
      { SECCIÓN: "FABRICACIÓN", CAMPO: "Lote", VALOR: lote.codigo_lote },
      { SECCIÓN: "FABRICACIÓN", CAMPO: "Producto", VALOR: lote.producto },
      { SECCIÓN: "FABRICACIÓN", CAMPO: "Responsable", VALOR: responsables.fab },
      { SECCIÓN: "ORIGEN", CAMPO: "Base Salina ID", VALOR: base?.codigo || lote.base_salina_id },
      { SECCIÓN: "ORIGEN", CAMPO: "Proveedor", VALOR: base?.proveedor || 'N/A' },
      { SECCIÓN: "CALIDAD", CAMPO: "QA Etiquetado", VALOR: etiquetado?.qa || 'PENDIENTE' },
      { SECCIÓN: "INCIDENCIAS", CAMPO: "Total Reclamos", VALOR: reclamos.length }
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(dataReporte), "Resumen Trazabilidad");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(ventas), "Distribución");
    XLSX.writeFile(wb, `Reporte_Cimasur_${lote.codigo_lote}.xlsx`);
  };

  return (
    <div className="w-full space-y-6 pb-20">
      
      {/* PANEL DE CONTROL (Oculto al imprimir) */}
      <div className="no-print space-y-6">
        
        {/* BUSCADOR PRINCIPAL */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 p-3.5 pl-12 rounded-xl text-sm outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-all font-medium placeholder:text-slate-400 font-mono" 
                placeholder="Escriba el código de lote..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
              />
            </div>
            <button className="bg-cyan-500 hover:bg-cyan-600 text-white px-8 rounded-xl font-bold text-xs uppercase tracking-wider transition-all active:scale-95 shrink-0 shadow-sm flex items-center justify-center">
              {loading ? <Loader2 className="animate-spin" size={16} /> : 'RASTREAR'}
            </button>
          </form>
        </div>

        {/* FILTROS Y RECIENTES */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center gap-2 text-cyan-600 font-bold text-xs uppercase mb-4 tracking-wider">
              <Calendar size={16}/> Auditoría por Rango
            </div>
            <form onSubmit={handleFiltrarRango} className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-2">
                <input type="date" className="bg-slate-50 border border-slate-200 text-slate-700 p-2.5 rounded-xl text-xs outline-none focus:ring-1 focus:ring-cyan-500" value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)} />
                <input type="date" className="bg-slate-50 border border-slate-200 text-slate-700 p-2.5 rounded-xl text-xs outline-none focus:ring-1 focus:ring-cyan-500" value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)} />
              </div>
              <button className="bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-bold py-2.5 rounded-xl text-xs uppercase tracking-wider transition-colors">
                {buscandoRango ? 'Buscando...' : 'FILTRAR NUBE'}
              </button>
            </form>
            
            {lotesRango.length > 0 && (
              <div className="mt-4 max-h-40 overflow-y-auto space-y-2 border-t border-slate-100 pt-3">
                {lotesRango.map(l => (
                  <button key={l.codigo_lote} onClick={() => realizarBusquedaCompleta(l.codigo_lote)} className="w-full flex justify-between items-center p-2.5 bg-slate-50 hover:bg-cyan-50 rounded-xl text-xs text-slate-700 hover:text-cyan-700 border border-slate-100 transition-colors">
                    <span className="font-mono font-bold">{l.codigo_lote}</span>
                    <span className="truncate max-w-[180px] text-slate-500 font-medium">{l.producto}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
            <div className="text-slate-400 font-bold text-xs uppercase mb-4 tracking-wider">Fabricaciones Recientes</div>
            <div className="flex flex-wrap gap-2">
              {lotesHoy.map(l => (
                <button key={l.codigo_lote} onClick={() => realizarBusquedaCompleta(l.codigo_lote)} className="bg-slate-50 hover:bg-cyan-50 text-slate-700 hover:text-cyan-700 px-3 py-1.5 rounded-lg text-xs font-mono font-bold border border-slate-200/60 transition-colors">
                  {l.codigo_lote}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 p-4 rounded-xl text-red-700 text-xs font-bold flex items-center gap-3 animate-in fade-in">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* ACCIONES DEL REPORTE */}
      {loteSeleccionado && (
        <div className="no-print flex justify-end gap-3">
          <button onClick={() => window.print()} className="bg-white border border-slate-200 text-slate-700 px-5 py-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-sm hover:bg-slate-50 transition-colors">
            <Printer size={16}/> Imprimir PDF
          </button>
          <button onClick={exportarExcel} className="bg-green-600 text-white px-5 py-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-sm hover:bg-green-500 transition-colors">
            <FileSpreadsheet size={16}/> Exportar Excel
          </button>
        </div>
      )}

      {/* REPORTE REESTRUCTURADO: MÁXIMA FORMALIDAD INSTITUCIONAL */}
      {loteSeleccionado && (
        <div id="printable-report" className="bg-white text-slate-900 p-12 border border-slate-200 shadow-sm print:shadow-none print:border-none print:p-0 space-y-10">
          
          {/* ENCABEZADO FORMAL DE LABORATORIO */}
          <div className="flex justify-between items-end border-b-2 border-slate-800 pb-6">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">CIMASUR S.A.</h1>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">SISTEMA INSTITUCIONAL DE TRAZABILIDAD Y ASEGURAMIENTO DE CALIDAD</p>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">CERTIFICADO MAESTRO DE PARTIDA</span>
              <span className="font-mono font-bold text-xl text-slate-900 bg-slate-50 px-3 py-1 border border-slate-200 rounded block mt-1">{loteSeleccionado.lote.codigo_lote}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-8">
            
            {/* SECCIÓN 1: PROCESO */}
            <section className="space-y-3">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-300 pb-1">1. Especificaciones de Manufactura</h3>
              <div className="grid grid-cols-3 gap-6 text-xs pl-2">
                <div><label className="text-[10px] font-semibold text-slate-400 uppercase block mb-0.5">Producto Determinado</label><p className="font-bold text-sm text-slate-800">{loteSeleccionado.lote.producto}</p></div>
                <div><label className="text-[10px] font-semibold text-slate-400 uppercase block mb-0.5">Fecha de Registro Oficial</label><p className="font-medium text-slate-700">{new Date(loteSeleccionado.lote.created_at).toLocaleDateString('es-CL')}</p></div>
                <div><label className="text-[10px] font-semibold text-slate-400 uppercase block mb-0.5">Responsable de Planta</label><p className="font-medium text-slate-700">{loteSeleccionado.responsables.fab}</p></div>
              </div>
            </section>

            {/* SECCIÓN 2: MATERIA PRIMA */}
            <section className="space-y-3">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-300 pb-1">2. Trazabilidad Analítica de Origen</h3>
              <div className="grid grid-cols-3 gap-6 text-xs pl-2">
                <div><label className="text-[10px] font-semibold text-slate-400 uppercase block mb-0.5">Identificador de Base</label><p className="font-mono font-bold text-slate-800">{loteSeleccionado.base?.codigo || loteSeleccionado.lote.base_salina_id}</p></div>
                <div><label className="text-[10px] font-semibold text-slate-400 uppercase block mb-0.5">Proveedor de Origen</label><p className="font-medium text-slate-700">{loteSeleccionado.base?.proveedor || 'N/A'}</p></div>
                <div><label className="text-[10px] font-semibold text-slate-400 uppercase block mb-0.5">Responsable de Análisis</label><p className="font-medium text-slate-700">{loteSeleccionado.responsables.base}</p></div>
              </div>
            </section>

            {/* SECCIÓN 3: CONTROL DE CALIDAD Y RESGUARDO */}
            <section className="space-y-3">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-300 pb-1">3. Estado de Resguardo y Validación Final</h3>
              <div className="grid grid-cols-3 gap-6 text-xs pl-2">
                <div><label className="text-[10px] font-semibold text-slate-400 uppercase block mb-0.5">Ubicación Física Asignada</label><p className="font-medium text-slate-700">{loteSeleccionado.almacen?.ubicacion || 'PROCESO PENDIENTE'}</p></div>
                <div>
                  <label className="text-[10px] font-semibold text-slate-400 uppercase block mb-0.5">Dictamen de Control (QA)</label>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {loteSeleccionado.etiquetado?.qa === 'OK' ? (
                      <span className="text-green-700 font-bold uppercase tracking-wide bg-green-50 border border-green-100 px-2 py-0.5 rounded text-[10px]">CONFORME</span>
                    ) : (
                      <span className="text-red-700 font-bold uppercase tracking-wide bg-red-50 border border-red-100 px-2 py-0.5 rounded text-[10px]">RECHAZADO / RETENIDO</span>
                    )}
                  </div>
                </div>
                <div><label className="text-[10px] font-semibold text-slate-400 uppercase block mb-0.5">Responsable Visado Final</label><p className="font-medium text-slate-700">{loteSeleccionado.responsables.etiq}</p></div>
              </div>
            </section>

            {/* SECCIÓN 4: DISTRIBUCIÓN (TABLA FORMAL CON CONTRASTES OSCUROS) */}
            <section className="space-y-3">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-300 pb-1">4. Historial de Despacho y Distribución</h3>
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-400 bg-slate-50 text-slate-600 font-bold">
                    <th className="p-2 pl-4">Cliente / Entidad Destinataria</th>
                    <th className="p-2">Tipo Operación</th>
                    <th className="p-2 pr-4 text-right">Volumen Despachado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loteSeleccionado.ventas.length > 0 ? loteSeleccionado.ventas.map((v: any, i: number) => (
                    <tr key={i} className="text-slate-700">
                      <td className="p-2.5 pl-4 font-medium">{v.cliente}</td>
                      <td className="p-2.5 uppercase text-[10px] text-slate-400 font-mono">{v.tipo_venta}</td>
                      <td className="p-2.5 pr-4 text-right font-bold text-slate-900 font-mono">{v.cantidad_vendida} Unidades</td>
                    </tr>
                  )) : (
                    <tr><td colSpan={3} className="p-6 text-center text-slate-400 italic">No se registran egresos ni movimientos comerciales cargados para esta partida.</td></tr>
                  )}
                </tbody>
              </table>
            </section>

            {/* SECCIÓN 5: INCIDENCIAS */}
            <section className="space-y-3 print:break-before-page">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-300 pb-1">5. Historial de Alertas de Desvío</h3>
              {loteSeleccionado.reclamos.length > 0 ? (
                <div className="border border-red-200 rounded-xl divide-y divide-red-100 overflow-hidden">
                  {loteSeleccionado.reclamos.map((r: any, i: number) => (
                    <div key={i} className="p-3.5 bg-red-50/10 text-xs">
                      <div className="flex justify-between mb-1">
                        <span className="font-bold text-red-700 uppercase">Incidencia Registrada: {r.tipo_problema || 'Desvío General'}</span>
                        <span className="text-slate-400 font-mono">{new Date(r.created_at).toLocaleDateString('es-CL')}</span>
                      </div>
                      <p className="text-slate-600 font-medium">Detalles informados: "{r.detalles || r.descripcion}"</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-green-700 font-semibold bg-green-50/60 p-3.5 rounded-xl border border-green-100">
                  ✓ Confirmado: El lote se encuentra libre de reclamaciones, desvíos analíticos o retenciones post-venta vigentes.
                </div>
              )}
            </section>
          </div>
          

          <div className="mt-12 flex justify-between items-center border-t border-slate-200 pt-6 opacity-40 text-[9px] text-slate-400 font-mono">
            <div>Generado de forma automatizada por CIMASUR Cloud Trace v2.0</div>
            <div>Fecha de emisión: {new Date().toLocaleDateString('es-CL')}</div>
          </div>
        </div>
      )}

      <style>{`
        @media print {
          body * { visibility: hidden; }
          #printable-report, #printable-report * { visibility: visible; }
          #printable-report { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
        }
      `}</style>
    </div>
  );
};