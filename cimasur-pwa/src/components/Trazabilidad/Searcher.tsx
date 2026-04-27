import React, { useState, useEffect } from 'react';
import { db } from '../../lib/db';
import * as XLSX from 'xlsx'; // Importamos la librería para Excel
import { 
  Search, Loader2, Printer, ChevronRight, X, AlertCircle, FileSpreadsheet, History
} from 'lucide-react';

export const Searcher = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [lotesHoy, setLotesHoy] = useState<any[]>([]);
  const [sugerencias, setSugerencias] = useState<any[]>([]);
  const [loteSeleccionado, setLoteSeleccionado] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const cargarLotesHoy = async () => {
      try {
        const hoyStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
        const todos = await db.fabricaciones.toArray();
        const filtrados = todos.filter(f => f.codigo_lote && f.codigo_lote.includes(hoyStr));
        setLotesHoy(filtrados);
      } catch (e) {
        console.error("Error cargando lotes de hoy:", e);
      }
    };
    cargarLotesHoy();
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const term = searchTerm.trim().toUpperCase();
    if (!term) return;

    setLoading(true);
    setError(null);
    setLoteSeleccionado(null);

    try {
      const todasFab = await db.fabricaciones.toArray();
      const coincidencias = todasFab.filter(f => 
        f.codigo_lote && f.codigo_lote.toUpperCase().includes(term)
      );
      setSugerencias(coincidencias);
      if (coincidencias.length === 0) setError("No se encontraron lotes con ese código.");
    } catch (err) {
      setError("Error al buscar en la base de datos.");
    } finally {
      setLoading(false);
    }
  };

  const seleccionarLote = async (lote: any) => {
    setLoading(true);
    setError(null);
    try {
      const [base, almacen, etiquetado, ventas, reclamos, perfiles] = await Promise.all([
        lote.base_salina_id ? db.bases.where('codigo').equals(lote.base_salina_id).first() : null,
        db.almacenamientos.where('lote_id').equals(lote.codigo_lote).first(),
        db.etiquetados.where('lote_id').equals(lote.codigo_lote).first(),
        db.ventas.where('lote_id').equals(lote.codigo_lote).toArray(),
        db.reclamos.where('lote_id').equals(lote.codigo_lote).toArray(),
        db.perfiles.toArray()
      ]);

      const getNombre = (id: string) => perfiles.find(p => p.id === id)?.nombre_completo || 'N/A';

      setLoteSeleccionado({ 
        lote, base, almacen, etiquetado, ventas: ventas || [], reclamos: reclamos || [],
        responsables: {
          fab: getNombre(lote.responsable_id),
          base: base ? getNombre(base.responsable_id) : 'N/A',
          almacen: almacen ? getNombre(almacen.responsable_id) : 'N/A'
        }
      });
      setSugerencias([]);
      setSearchTerm(lote.codigo_lote);
    } catch (err) {
      setError("Error al cargar los detalles del lote.");
    } finally {
      setLoading(false);
    }
  };

  // --- FUNCIÓN PARA EXPORTAR A EXCEL ---
  const exportarExcel = () => {
    if (!loteSeleccionado) return;

    const { lote, base, almacen, etiquetado, ventas, responsables } = loteSeleccionado;

    // Hoja 1: Resumen de Trazabilidad
    const resumenData = [
      { SECCIÓN: "PROCESO", CAMPO: "Lote Final", VALOR: lote.codigo_lote },
      { SECCIÓN: "PROCESO", CAMPO: "Fecha Producción", VALOR: lote.created_at?.split('T')[0] },
      { SECCIÓN: "PROCESO", CAMPO: "Responsable Planta", VALOR: responsables.fab },
      { SECCIÓN: "PROCESO", CAMPO: "Cantidad Unidades", VALOR: lote.cantidad_final },
      { SECCIÓN: "ORIGEN", CAMPO: "Materia Base", VALOR: base?.codigo || 'N/A' },
      { SECCIÓN: "ORIGEN", CAMPO: "Proveedor", VALOR: base?.proveedor || 'N/A' },
      { SECCIÓN: "ORIGEN", CAMPO: "Lote MP", VALOR: base?.lote_materia_prima || 'N/A' },
      { SECCIÓN: "CALIDAD", CAMPO: "Ubicación Almacén", VALOR: almacen?.ubicacion || 'PENDIENTE' },
      { SECCIÓN: "CALIDAD", CAMPO: "Aprobación QA", VALOR: etiquetado?.qa || 'PENDIENTE' },
    ];

    // Hoja 2: Distribución (Ventas)
    const ventasData = ventas.map((v: any) => ({
      Cliente: v.cliente,
      Cantidad: v.cantidad_vendida,
      Unidad: "UDS",
      Fecha_Venta: v.created_at?.split('T')[0] || 'N/A'
    }));

    // Crear el Libro y las Hojas
    const wb = XLSX.utils.book_new();
    const wsResumen = XLSX.utils.json_to_sheet(resumenData);
    const wsVentas = XLSX.utils.json_to_sheet(ventasData);

    // Añadir hojas al libro
    XLSX.utils.book_append_sheet(wb, wsResumen, "Resumen Técnico");
    XLSX.utils.book_append_sheet(wb, wsVentas, "Registro de Distribución");

    // Descargar archivo
    XLSX.writeFile(wb, `Trazabilidad_${lote.codigo_lote}.xlsx`);
  };

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-6">
      
      {/* 1. INTERFAZ DE BUSQUEDA (no-print) */}
      <div className="no-print space-y-4">
        {/* Acciones de exportación rápidas si hay un lote seleccionado */}
        {loteSeleccionado && (
          <div className="flex justify-end gap-3 animate-in fade-in slide-in-from-right-4">
            <button 
              onClick={() => window.print()} 
              className="bg-slate-800 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-xs font-bold hover:bg-slate-700 transition-all border border-slate-700"
            >
              <Printer size={14} /> PDF
            </button>
            <button 
              onClick={exportarExcel}
              className="bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-xs font-bold hover:bg-green-600 transition-all border border-green-800"
            >
              <FileSpreadsheet size={14} /> EXCEL
            </button>
          </div>
        )}

        <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-800">
          <div className="flex items-center gap-2 mb-3 text-slate-400 text-xs font-bold uppercase">
            <History size={14} /> Producción Reciente (Hoy)
          </div>
          <div className="flex flex-wrap gap-2">
            {lotesHoy.length > 0 ? lotesHoy.map(l => (
              <button 
                key={l.codigo_lote} 
                onClick={() => seleccionarLote(l)} 
                className="text-[10px] bg-slate-800 hover:bg-blue-600 text-white px-3 py-1.5 rounded-lg border border-slate-700 transition-colors font-mono"
              >
                {l.codigo_lote}
              </button>
            )) : <p className="text-slate-600 text-[10px] italic">Sin registros hoy.</p>}
          </div>
        </div>

        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
            <input
              type="text"
              className="w-full bg-slate-900 border-2 border-slate-800 text-white p-4 pl-12 rounded-2xl focus:border-blue-500 outline-none transition-all"
              placeholder="Buscar por lote (ej: 001, 2026...)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="bg-blue-600 hover:bg-blue-500 text-white px-8 rounded-2xl font-bold transition-all shadow-lg">
            {loading ? <Loader2 className="animate-spin" /> : 'RASTREAR'}
          </button>
        </form>

        {sugerencias.length > 0 && (
          <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
            {sugerencias.map(s => (
              <button 
                key={s.codigo_lote} 
                onClick={() => seleccionarLote(s)} 
                className="w-full text-left p-4 hover:bg-blue-600/20 text-white text-sm border-b border-slate-800/50 flex justify-between items-center"
              >
                <span className="font-mono font-bold">{s.codigo_lote}</span>
                <ChevronRight className="w-4 h-4 text-slate-600" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 2. DOCUMENTO DE TRAZABILIDAD (Seccion Imprimible) */}
      {loteSeleccionado && (
        <div id="printable-report" className="bg-white text-slate-900 p-12 rounded-sm shadow-2xl border-t-[12px] border-black print:shadow-none print:p-0 print:border-none">
          
          <div className="flex justify-between items-start border-b-2 border-black pb-6 mb-10">
            <div>
              <h1 className="text-3xl font-black tracking-tighter">CIMASUR S.A.</h1>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Reporte de Trazabilidad Industrial</p>
            </div>
            <div className="text-right">
              <p className="text-[9px] font-bold text-slate-400 uppercase">Documento Lote Nº</p>
              <p className="text-2xl font-mono font-black">{loteSeleccionado.lote.codigo_lote}</p>
            </div>
          </div>

          <div className="space-y-12">
            <section>
              <h3 className="text-xs font-black bg-slate-100 p-2 mb-6 border-l-4 border-black uppercase">1. Información de Proceso y Lote</h3>
              <div className="grid grid-cols-2 gap-x-12 gap-y-6 text-sm">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase">Fecha Producción</label>
                  <p className="font-bold">{loteSeleccionado.lote.created_at?.split('T')[0] || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase">Cantidad Total</label>
                  <p className="font-bold">{loteSeleccionado.lote.cantidad_final || 0} Unidades</p>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase">Responsable de Planta</label>
                  <p className="font-bold">{loteSeleccionado.responsables.fab}</p>
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-xs font-black bg-slate-100 p-2 mb-6 border-l-4 border-black uppercase">2. Trazabilidad de Materia Base</h3>
              <div className="grid grid-cols-2 gap-x-12 gap-y-6 text-sm">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase">Código de Base Origen</label>
                  <p className="font-bold font-mono">{loteSeleccionado.base?.codigo || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase">Proveedor / Lote MP</label>
                  <p className="font-bold">{loteSeleccionado.base?.proveedor || 'N/A'}</p>
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-xs font-black bg-slate-100 p-2 mb-6 border-l-4 border-black uppercase">3. Registro de Salidas y Clientes</h3>
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b-2 border-black">
                    <th className="py-2 text-[10px] font-bold text-slate-400 uppercase">Cliente / Destino</th>
                    <th className="py-2 text-[10px] font-bold text-slate-400 uppercase text-right">Cantidad Entregada</th>
                  </tr>
                </thead>
                <tbody>
                  {loteSeleccionado.ventas.length > 0 ? loteSeleccionado.ventas.map((v: any, i: number) => (
                    <tr key={i} className="border-b border-slate-100">
                      <td className="py-3 font-medium">{v.cliente}</td>
                      <td className="py-3 text-right font-bold">{v.cantidad_vendida} UDS</td>
                    </tr>
                  )) : (
                    <tr><td colSpan={2} className="py-6 text-center text-slate-400 italic">No se registran salidas.</td></tr>
                  )}
                </tbody>
              </table>
            </section>

            <section>
              <h3 className="text-xs font-black bg-slate-100 p-2 mb-6 border-l-4 border-black uppercase">4. Incidencias y Reclamos</h3>
              {loteSeleccionado.reclamos.length > 0 ? (
                <div className="space-y-4">
                  {loteSeleccionado.reclamos.map((r: any, i: number) => (
                    <div key={i} className="p-4 border border-slate-200 rounded-lg">
                      <p className="text-[10px] font-bold text-red-600 uppercase mb-1">{r.tipo_reclamo}</p>
                      <p className="text-sm font-bold text-slate-700">{r.descripcion}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs italic text-slate-500">Lote libre de incidencias.</p>
              )}
            </section>
          </div>
        </div>
      )}

      <style>{`
        @media print {
          body * { visibility: hidden; background-color: white !important; }
          #printable-report, #printable-report * { visibility: visible; }
          #printable-report { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 0; }
          .no-print { display: none !important; }
          @page { size: portrait; margin: 1.5cm; }
        }
      `}</style>
    </div>
  );
};