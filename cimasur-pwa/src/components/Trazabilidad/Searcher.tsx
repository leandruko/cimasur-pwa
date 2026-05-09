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
    setLoteSeleccionado(null); // Limpiamos selección previa

    try {
      // 1. Buscamos la fabricación de forma limpia
      const { data: lote, error: errLote } = await supabase
        .from('fabricaciones')
        .select('*')
        .eq('codigo_lote', codigoLote)
        .maybeSingle(); // Usamos maybeSingle para evitar errores si hay 0 resultados

      if (errLote) throw errLote;
      if (!lote) throw new Error(`El lote ${codigoLote} no existe en la base de datos.`);

      // 2. Buscamos el nombre del responsable manualmente para evitar fallos de relación
      const { data: perfilFab } = await supabase
        .from('perfiles')
        .select('nombre_completo')
        .eq('id', lote.responsable_id)
        .maybeSingle();

      // 3. Carga paralela de toda la cadena (con los nombres de columna correctos)
      const [resBase, resAlmacen, resEtiquetado, resVentas, resReclamos] = await Promise.all([
        supabase.from('bases').select('*').eq('codigo', lote.base_salina_id).maybeSingle(),
        supabase.from('almacenamientos').select('*').eq('lote_id', codigoLote).maybeSingle(),
        supabase.from('etiquetados').select('*').eq('lote_id', codigoLote).maybeSingle(),
        supabase.from('ventas').select('*').eq('lote_id', codigoLote),
        supabase.from('reclamos').select('*').eq('lote_id', codigoLote)
      ]);

      // 4. Buscamos nombres de los otros responsables si existen datos
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
      
      setSearchTerm(codigoLote); // Sincronizamos el input
    } catch (err: any) {
      console.error("Error en búsqueda:", err);
      setError(err.message);
    } finally {
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
    <div className="max-w-5xl mx-auto p-4 space-y-6 pb-20">
      
      {/* PANEL DE CONTROL (Oculto al imprimir) */}
      <div className="no-print space-y-6">
        
        {/* BUSCADOR PRINCIPAL */}
        <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-2xl">
          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
              <input 
                type="text" 
                className="w-full bg-slate-800 border-none text-white p-4 pl-12 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none" 
                placeholder="Escriba el código de lote..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
              />
            </div>
            <button className="bg-blue-600 hover:bg-blue-500 text-white px-10 rounded-2xl font-black transition-all">
              {loading ? <Loader2 className="animate-spin" /> : 'RASTREAR'}
            </button>
          </form>
        </div>

        {/* FILTROS Y RECIENTES */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
            <div className="flex items-center gap-2 text-blue-400 font-bold text-xs uppercase mb-4"><Calendar size={16}/> Auditoría por Rango</div>
            <form onSubmit={handleFiltrarRango} className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-2">
                <input type="date" className="bg-slate-800 text-white p-2 rounded-xl text-xs outline-none" value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)} />
                <input type="date" className="bg-slate-800 text-white p-2 rounded-xl text-xs outline-none" value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)} />
              </div>
              <button className="bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 rounded-xl text-xs">FILTRAR NUBE</button>
            </form>
            
            {lotesRango.length > 0 && (
              <div className="mt-4 max-h-40 overflow-y-auto space-y-2">
                {lotesRango.map(l => (
                  <button key={l.codigo_lote} onClick={() => realizarBusquedaCompleta(l.codigo_lote)} className="w-full flex justify-between p-2 bg-slate-800 rounded-lg text-[10px] text-white hover:bg-blue-900/30">
                    <span className="font-mono">{l.codigo_lote}</span>
                    <span>{l.producto}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
            <div className="text-slate-500 font-bold text-xs uppercase mb-4">Fabricaciones Recientes</div>
            <div className="flex flex-wrap gap-2">
              {lotesHoy.map(l => (
                <button key={l.codigo_lote} onClick={() => realizarBusquedaCompleta(l.codigo_lote)} className="bg-slate-800 hover:bg-blue-600 text-white px-3 py-1.5 rounded-lg text-[10px] font-mono border border-slate-700">
                  {l.codigo_lote}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {error && <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl text-red-400 text-sm flex items-center gap-3"><AlertCircle /> {error}</div>}

      {/* ACCIONES DEL REPORTE */}
      {loteSeleccionado && (
        <div className="no-print flex justify-end gap-3">
          <button onClick={() => window.print()} className="bg-white text-black px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-xl hover:bg-slate-100"><Printer size={18}/> Imprimir PDF</button>
          <button onClick={exportarExcel} className="bg-green-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-xl hover:bg-green-500"><FileSpreadsheet size={18}/> Exportar Excel</button>
        </div>
      )}

      {/* REPORTE OFICIAL (Ajustado para impresión y nombres correctos) */}
      {loteSeleccionado && (
        <div id="printable-report" className="bg-white text-slate-900 p-10 rounded-sm border-t-[16px] border-black shadow-2xl print:shadow-none print:p-0">
          
          <div className="flex justify-between items-start border-b-4 border-black pb-8 mb-10">
            <div>
              <h1 className="text-4xl font-black tracking-tighter">CIMASUR S.A.</h1>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em] mt-1">Reporte Maestro de Trazabilidad</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Documento de Lote</p>
              <p className="text-3xl font-mono font-black">{loteSeleccionado.lote.codigo_lote}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-12">
            
            {/* SECCIÓN 1: PROCESO */}
            <section>
              <h3 className="text-sm font-black bg-slate-900 text-white p-2 px-4 inline-block mb-6 uppercase skew-x-[-10deg]">1. Datos de Fabricación</h3>
              <div className="grid grid-cols-3 gap-8 text-sm border-l-4 border-slate-100 pl-6">
                <div><label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Producto</label><p className="font-bold text-lg">{loteSeleccionado.lote.producto}</p></div>
                <div><label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Fecha de Registro</label><p className="font-bold">{new Date(loteSeleccionado.lote.created_at).toLocaleDateString()}</p></div>
                <div><label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Responsable Planta</label><p className="font-bold">{loteSeleccionado.responsables.fab}</p></div>
              </div>
            </section>

            {/* SECCIÓN 2: MATERIA PRIMA */}
            <section>
              <h3 className="text-sm font-black bg-slate-900 text-white p-2 px-4 inline-block mb-6 uppercase skew-x-[-10deg]">2. Trazabilidad de Origen</h3>
              <div className="grid grid-cols-3 gap-8 text-sm border-l-4 border-slate-100 pl-6">
                <div><label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">ID Base Salina</label><p className="font-mono font-bold">{loteSeleccionado.base?.codigo || loteSeleccionado.lote.base_salina_id}</p></div>
                <div><label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Proveedor Base</label><p className="font-bold">{loteSeleccionado.base?.proveedor || 'N/A'}</p></div>
                <div><label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Analista Base</label><p className="font-bold">{loteSeleccionado.responsables.base}</p></div>
              </div>
            </section>

            {/* SECCIÓN 3: CONTROL DE CALIDAD */}
            <section>
              <h3 className="text-sm font-black bg-slate-900 text-white p-2 px-4 inline-block mb-6 uppercase skew-x-[-10deg]">3. Almacén y QA Final</h3>
              <div className="grid grid-cols-3 gap-8 text-sm border-l-4 border-slate-100 pl-6">
                <div><label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Ubicación Física</label><p className="font-bold">{loteSeleccionado.almacen?.ubicacion || 'PENDIENTE'}</p></div>
                <div><label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Aprobación QA</label>
                  <div className="flex items-center gap-2 mt-1">
                    {loteSeleccionado.etiquetado?.qa === 'OK' ? <CheckCircle2 className="text-green-600" size={18}/> : <XCircle className="text-red-600" size={18}/>}
                    <p className="font-black">{loteSeleccionado.etiquetado?.qa || 'NO REGISTRADO'}</p>
                  </div>
                </div>
                <div><label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Analista Etiquetado</label><p className="font-bold">{loteSeleccionado.responsables.etiq}</p></div>
              </div>
            </section>

            {/* SECCIÓN 4: DISTRIBUCIÓN */}
            <section>
              <h3 className="text-sm font-black bg-slate-900 text-white p-2 px-4 inline-block mb-6 uppercase skew-x-[-10deg]">4. Registro de Salidas</h3>
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b-2 border-black">
                    <th className="py-2 text-[10px] font-bold text-slate-400 uppercase">Cliente / Institución</th>
                    <th className="py-2 text-[10px] font-bold text-slate-400 uppercase">Tipo</th>
                    <th className="py-2 text-[10px] font-bold text-slate-400 uppercase text-right">Cantidad</th>
                  </tr>
                </thead>
                <tbody>
                  {loteSeleccionado.ventas.length > 0 ? loteSeleccionado.ventas.map((v: any, i: number) => (
                    <tr key={i} className="border-b border-slate-100 italic">
                      <td className="py-3 font-medium">{v.cliente}</td>
                      <td className="py-3 text-[10px]">{v.tipo_venta}</td>
                      <td className="py-3 text-right font-black">{v.cantidad_vendida} UDS</td>
                    </tr>
                  )) : (
                    <tr><td colSpan={3} className="py-8 text-center text-slate-400 italic">No se registran despachos para este lote.</td></tr>
                  )}
                </tbody>
              </table>
            </section>

            {/* SECCIÓN 5: INCIDENCIAS (Ajustado a tipo_problema y detalles) */}
            <section className="print:break-before-page">
              <h3 className="text-sm font-black bg-red-600 text-white p-2 px-4 inline-block mb-6 uppercase skew-x-[-10deg]">5. Reporte de Incidencias</h3>
              {loteSeleccionado.reclamos.length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                  {loteSeleccionado.reclamos.map((r: any, i: number) => (
                    <div key={i} className="p-4 border-2 border-red-100 rounded-xl bg-red-50/30">
                      <div className="flex justify-between mb-2">
                        <span className="text-[10px] font-black text-red-600 uppercase">{r.tipo_problema || 'Problema General'}</span>
                        <span className="text-[10px] font-bold text-slate-400">{new Date(r.created_at).toLocaleDateString()}</span>
                      </div>
                      <p className="text-sm italic text-slate-700">"{r.detalles || r.descripcion}"</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-3 text-green-600 font-bold text-sm bg-green-50 p-4 rounded-xl border border-green-100">
                  <CheckCircle2 size={18}/> Lote libre de reclamos e incidencias post-venta.
                </div>
              )}
            </section>
          </div>
          
          <div className="mt-20 flex justify-between items-end border-t border-slate-200 pt-10 opacity-50">
            <div className="text-[9px] font-mono text-slate-400">Generado automáticamente por CIMASUR Cloud Trace v2.0</div>
            <div className="w-32 h-1 bg-slate-200"></div>
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