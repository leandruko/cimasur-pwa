import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase'; // Importación vital para modo Online
import { db } from '../../lib/db'; 
import * as XLSX from 'xlsx';
import { 
  Search, Loader2, Printer, ChevronRight, FileSpreadsheet, History, Calendar
} from 'lucide-react';

export const Searcher = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [lotesHoy, setLotesHoy] = useState<any[]>([]);
  const [sugerencias, setSugerencias] = useState<any[]>([]);
  const [loteSeleccionado, setLoteSeleccionado] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Estados para Filtro de Fechas
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [lotesRango, setLotesRango] = useState<any[]>([]);
  const [buscandoRango, setBuscandoRango] = useState(false);

  // Cargar registros recientes al inicio
  useEffect(() => {
    const cargarRecientes = async () => {
      const { data } = await supabase
        .from('fabricaciones')
        .select('codigo_lote, producto')
        .order('created_at', { ascending: false })
        .limit(8);
      if (data) setLotesHoy(data);
    };
    cargarRecientes();
  }, []);

  // --- BÚSQUEDA INTEGRAL EN SUPABASE ---
  const realizarBusquedaCompleta = async (codigoLote: string) => {
    setLoading(true);
    setError(null);
    try {
      // 1. Buscamos la fabricación con sus relaciones directas
      const { data: lote, error: errLote } = await supabase
        .from('fabricaciones')
        .select(`
          *,
          perfiles:responsable_id (nombre_completo),
          categoria_producto:categoria_id (nombre)
        `)
        .eq('codigo_lote', codigoLote)
        .single();

      if (errLote || !lote) throw new Error("Lote no encontrado en el sistema.");

      // 2. Buscamos toda la cadena de trazabilidad en paralelo
      const [resBase, resAlmacen, resEtiquetado, resVentas, resReclamos] = await Promise.all([
        supabase.from('bases').select('*, perfiles:responsable_id(nombre_completo)').eq('codigo', lote.base_id).single(),
        supabase.from('almacenamientos').select('*, perfiles:responsable_id(nombre_completo)').eq('lote_id', codigoLote).single(),
        supabase.from('etiquetados').select('*, perfiles:responsable_id(nombre_completo)').eq('lote_id', codigoLote).single(),
        supabase.from('ventas').select('*').eq('lote_id', codigoLote),
        supabase.from('reclamos').select('*').eq('lote_id', codigoLote)
      ]);

      setLoteSeleccionado({
        lote,
        base: resBase.data,
        almacen: resAlmacen.data,
        etiquetado: resEtiquetado.data,
        ventas: resVentas.data || [],
        reclamos: resReclamos.data || [],
        responsables: {
          fab: lote.perfiles?.nombre_completo || 'N/A',
          base: resBase.data?.perfiles?.nombre_completo || 'N/A',
          almacen: resAlmacen.data?.perfiles?.nombre_completo || 'N/A'
        }
      });
      setSugerencias([]);
    } catch (err: any) {
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
    const { lote, base, almacen, etiquetado, ventas, responsables } = loteSeleccionado;

    const resumenData = [
      { SECCIÓN: "PROCESO", CAMPO: "Lote Final", VALOR: lote.codigo_lote },
      { SECCIÓN: "PROCESO", CAMPO: "Producto", VALOR: lote.producto },
      { SECCIÓN: "PROCESO", CAMPO: "Fecha", VALOR: lote.created_at?.split('T')[0] },
      { SECCIÓN: "PROCESO", CAMPO: "Cantidad", VALOR: lote.cantidad_frascos },
      { SECCIÓN: "PROCESO", CAMPO: "Responsable", VALOR: responsables.fab },
      { SECCIÓN: "ORIGEN", CAMPO: "Base", VALOR: base?.codigo || 'N/A' },
      { SECCIÓN: "CALIDAD", CAMPO: "QA Etiqueta", VALOR: etiquetado?.qa || 'PENDIENTE' }
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(resumenData), "Resumen Técnico");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(ventas.map((v: any) => ({ Cliente: v.cliente, Cant: v.cantidad_vendida }))), "Ventas");
    XLSX.writeFile(wb, `Trazabilidad_${lote.codigo_lote}.xlsx`);
  };

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-6">
      <div className="no-print space-y-4">
        {loteSeleccionado && (
          <div className="flex justify-end gap-3">
            <button onClick={() => window.print()} className="bg-slate-800 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-xs font-bold border border-slate-700 hover:bg-slate-700"><Printer size={14} /> PDF</button>
            <button onClick={exportarExcel} className="bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-xs font-bold border border-green-800 hover:bg-green-600"><FileSpreadsheet size={14} /> EXCEL</button>
          </div>
        )}

        {/* BUSCADOR */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
            <input type="text" className="w-full bg-slate-900 border-2 border-slate-800 text-white p-4 pl-12 rounded-2xl focus:border-blue-500 outline-none" placeholder="Código de lote..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <button className="bg-blue-600 hover:bg-blue-500 text-white px-8 rounded-2xl font-bold transition-all shadow-lg">
            {loading ? <Loader2 className="animate-spin" /> : 'RASTREAR'}
          </button>
        </form>

        {/* FILTRO DE FECHAS */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center gap-2 text-slate-300 font-bold text-xs uppercase tracking-wider"><Calendar size={16} className="text-blue-500" /> Auditoría por Fechas</div>
          <form onSubmit={handleFiltrarRango} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
            <input type="date" className="bg-slate-800 border border-slate-700 text-white p-2.5 rounded-xl text-xs outline-none" value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)} />
            <input type="date" className="bg-slate-800 border border-slate-700 text-white p-2.5 rounded-xl text-xs outline-none" value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)} />
            <button type="submit" className="bg-slate-700 hover:bg-blue-600 text-white font-bold h-[38px] rounded-xl text-xs">{buscandoRango ? '...' : 'FILTRAR'}</button>
          </form>
          {lotesRango.length > 0 && (
            <div className="max-h-40 overflow-y-auto border border-slate-800 rounded-xl text-xs">
              {lotesRango.map(l => (
                <div key={l.codigo_lote} className="p-3 border-b border-slate-800 flex justify-between items-center hover:bg-slate-800">
                  <span className="text-slate-400">{l.created_at.split('T')[0]}</span>
                  <span className="font-bold text-white">{l.codigo_lote}</span>
                  <button onClick={() => realizarBusquedaCompleta(l.codigo_lote)} className="text-blue-400 font-bold">VER</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* REPORTE */}
      {loteSeleccionado && (
        <div id="printable-report" className="bg-white text-slate-900 p-12 rounded-sm shadow-2xl border-t-[12px] border-black print:p-0">
          <div className="flex justify-between items-start border-b-2 border-black pb-6 mb-10">
            <div><h1 className="text-3xl font-black tracking-tighter">CIMASUR S.A.</h1><p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Trazabilidad Industrial Online</p></div>
            <div className="text-right font-mono font-black text-2xl">{loteSeleccionado.lote.codigo_lote}</div>
          </div>
          <div className="space-y-10">
            <section>
              <h3 className="text-xs font-black bg-slate-100 p-2 border-l-4 border-black uppercase mb-4">1. Proceso de Fabricación</h3>
              <div className="grid grid-cols-2 gap-6 text-sm">
                <div><label className="text-[10px] font-bold text-slate-400 uppercase block">Producto / Cantidad</label><p className="font-bold">{loteSeleccionado.lote.producto} - {loteSeleccionado.lote.cantidad_frascos} Uds</p></div>
                <div><label className="text-[10px] font-bold text-slate-400 uppercase block">Responsable</label><p className="font-bold">{loteSeleccionado.responsables.fab}</p></div>
              </div>
            </section>
            <section>
              <h3 className="text-xs font-black bg-slate-100 p-2 border-l-4 border-black uppercase mb-4">2. Materia Base Origen</h3>
              <div className="grid grid-cols-2 gap-6 text-sm">
                <div><label className="text-[10px] font-bold text-slate-400 uppercase block">Código Base</label><p className="font-bold">{loteSeleccionado.base?.codigo || 'N/A'}</p></div>
                <div><label className="text-[10px] font-bold text-slate-400 uppercase block">Proveedor</label><p className="font-bold">{loteSeleccionado.base?.proveedor || 'N/A'}</p></div>
              </div>
            </section>
            <section>
              <h3 className="text-xs font-black bg-slate-100 p-2 border-l-4 border-black uppercase mb-4">3. Calidad y Distribución</h3>
              <div className="grid grid-cols-2 gap-6 text-sm mb-4">
                <div><label className="text-[10px] font-bold text-slate-400 uppercase block">Ubicación</label><p className="font-bold">{loteSeleccionado.almacen?.ubicacion || 'PENDIENTE'}</p></div>
                <div><label className="text-[10px] font-bold text-slate-400 uppercase block">QA Final</label><p className={`font-bold ${loteSeleccionado.etiquetado?.qa === 'OK' ? 'text-green-600' : 'text-red-600'}`}>{loteSeleccionado.etiquetado?.qa || 'PENDIENTE'}</p></div>
              </div>
              <table className="w-full text-xs text-left">
                <thead className="border-b border-black"><tr><th className="py-1">Cliente</th><th className="py-1 text-right">Cantidad</th></tr></thead>
                <tbody>{loteSeleccionado.ventas.map((v:any, i:number) => <tr key={i} className="border-b border-slate-100"><td className="py-2">{v.cliente}</td><td className="py-2 text-right font-bold">{v.cantidad_vendida} UDS</td></tr>)}</tbody>
              </table>
            </section>
          </div>
        </div>
      )}
    </div>
  );
};