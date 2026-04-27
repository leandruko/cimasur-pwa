import React, { useState, useEffect } from 'react';
import { db } from '../../lib/db';
import { 
  Search, Loader2, Printer, ChevronRight, X, AlertCircle, Package, History
} from 'lucide-react';

export const Searcher = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [lotesHoy, setLotesHoy] = useState<any[]>([]);
  const [sugerencias, setSugerencias] = useState<any[]>([]);
  const [loteSeleccionado, setLoteSeleccionado] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Cargar lotes de hoy al inicio
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
      // Consultas seguras (si una falla, las otras siguen)
      const [base, almacen, etiquetado, ventas, reclamos, perfiles] = await Promise.all([
        lote.base_salina_id ? db.bases.where('codigo').equals(lote.base_salina_id).first() : null,
        db.almacenamientos.where('lote_id').equals(lote.codigo_lote).first(),
        db.etiquetados.where('lote_id').equals(lote.codigo_lote).first(),
        db.ventas.where('lote_id').equals(lote.codigo_lote).toArray(),
        db.reclamos.where('lote_id').equals(lote.codigo_lote).toArray(),
        db.perfiles.toArray()
      ]);

      const getNombre = (id: string) => {
        if (!id) return 'N/A';
        return perfiles.find(p => p.id === id)?.nombre_completo || 'N/A';
      };

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
      console.error(err);
      setError("Error al cargar los detalles del lote.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-6">
      
      {/* 1. INTERFAZ DE BUSQUEDA (no-print) */}
      <div className="no-print space-y-4">
        {/* Lotes de Hoy */}
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

        {/* Buscador Principal */}
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
            {searchTerm && (
              <button 
                type="button"
                onClick={() => {setSearchTerm(''); setLoteSeleccionado(null); setSugerencias([]);}}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
              >
                <X size={18} />
              </button>
            )}
          </div>
          <button className="bg-blue-600 hover:bg-blue-500 text-white px-8 rounded-2xl font-bold transition-all shadow-lg shadow-blue-900/20">
            {loading ? <Loader2 className="animate-spin" /> : 'RASTREAR'}
          </button>
        </form>

        {/* Sugerencias de búsqueda */}
        {sugerencias.length > 0 && (
          <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="text-[10px] font-bold text-slate-500 p-3 bg-slate-800/50 border-b border-slate-800">COINCIDENCIAS ENCONTRADAS ({sugerencias.length})</div>
            {sugerencias.map(s => (
              <button 
                key={s.codigo_lote} 
                onClick={() => seleccionarLote(s)} 
                className="w-full text-left p-4 hover:bg-blue-600/20 text-white text-sm border-b border-slate-800/50 flex justify-between items-center group"
              >
                <span className="font-mono font-bold group-hover:text-blue-400">{s.codigo_lote}</span>
                <ChevronRight className="w-4 h-4 text-slate-600" />
              </button>
            ))}
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-400 text-sm">
            <AlertCircle size={18} /> {error}
          </div>
        )}
      </div>

      {/* 2. DOCUMENTO DE TRAZABILIDAD (Seccion Imprimible) */}
      {loteSeleccionado && (
        <div id="printable-report" className="bg-white text-slate-900 p-12 rounded-sm shadow-2xl border-t-[12px] border-black print:shadow-none print:p-0 print:border-none">
          
          {/* Cabecera del Documento */}
          <div className="flex justify-between items-start border-b-2 border-black pb-6 mb-10">
            <div>
              <h1 className="text-3xl font-black tracking-tighter">CIMASUR S.A.</h1>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Reporte de Trazabilidad Industrial</p>
            </div>
            <div className="text-right">
              <button 
                onClick={() => window.print()} 
                className="no-print mb-4 bg-slate-900 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-xs font-bold hover:bg-slate-800 transition-all"
              >
                <Printer size={14} /> IMPRIMIR REGISTRO
              </button>
              <p className="text-[9px] font-bold text-slate-400 uppercase">Documento Lote Nº</p>
              <p className="text-2xl font-mono font-black">{loteSeleccionado.lote.codigo_lote}</p>
            </div>
          </div>

          <div className="space-y-12">
            {/* Seccion 1: Fabricación */}
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
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase">Rendimiento</label>
                  <p className="font-bold">{loteSeleccionado.lote.rendimiento || 0}%</p>
                </div>
              </div>
            </section>

            {/* Seccion 2: Materia Base */}
            <section>
              <h3 className="text-xs font-black bg-slate-100 p-2 mb-6 border-l-4 border-black uppercase">2. Trazabilidad de Materia Base</h3>
              <div className="grid grid-cols-2 gap-x-12 gap-y-6 text-sm">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase">Código de Base Origen</label>
                  <p className="font-bold font-mono">{loteSeleccionado.base?.codigo || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase">Proveedor / Lote MP</label>
                  <p className="font-bold">{loteSeleccionado.base?.proveedor || 'N/A'} | {loteSeleccionado.base?.lote_materia_prima || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase">Responsable Base</label>
                  <p className="font-bold">{loteSeleccionado.responsables.base}</p>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase">Litros/Kilos Utilizados</label>
                  <p className="font-bold">{loteSeleccionado.lote.cantidad_base || 0} L/Kg</p>
                </div>
              </div>
            </section>

            {/* Seccion 3: Almacen y Calidad */}
            <section>
              <h3 className="text-xs font-black bg-slate-100 p-2 mb-6 border-l-4 border-black uppercase">3. Control de Calidad y Logística</h3>
              <div className="grid grid-cols-2 gap-x-12 gap-y-6 text-sm">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase">Ubicación en Almacén</label>
                  <p className="font-bold">{loteSeleccionado.almacen?.ubicacion || 'PENDIENTE'}</p>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase">Aprobación Etiquetado (QA)</label>
                  <p className={`font-bold ${loteSeleccionado.etiquetado?.qa ? 'text-green-600' : 'text-slate-400'}`}>
                    {loteSeleccionado.etiquetado?.qa || 'PENDIENTE'}
                  </p>
                </div>
              </div>
            </section>

            {/* Seccion 4: Salidas / Ventas */}
            <section>
              <h3 className="text-xs font-black bg-slate-100 p-2 mb-6 border-l-4 border-black uppercase">4. Registro de Salidas y Clientes</h3>
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b-2 border-black">
                    <th className="py-2 text-[10px] font-bold text-slate-400 uppercase">Cliente / Destino</th>
                    <th className="py-2 text-[10px] font-bold text-slate-400 uppercase text-right">Cantidad Despachada</th>
                  </tr>
                </thead>
                <tbody>
                  {loteSeleccionado.ventas.length > 0 ? loteSeleccionado.ventas.map((v: any, i: number) => (
                    <tr key={i} className="border-b border-slate-100">
                      <td className="py-3 font-medium">{v.cliente}</td>
                      <td className="py-3 text-right font-bold">{v.cantidad_vendida} UDS</td>
                    </tr>
                  )) : (
                    <tr><td colSpan={2} className="py-6 text-center text-slate-400 italic">No se registran salidas comerciales para este lote.</td></tr>
                  )}
                </tbody>
              </table>
            </section>

            {/* Seccion 5: Reclamos */}
            <section>
              <h3 className="text-xs font-black bg-slate-100 p-2 mb-6 border-l-4 border-black uppercase">5. Incidencias y Reclamos Reportados</h3>
              {loteSeleccionado.reclamos.length > 0 ? (
                <div className="space-y-4">
                  {loteSeleccionado.reclamos.map((r: any, i: number) => (
                    <div key={i} className="p-4 border border-slate-200 rounded-lg">
                      <p className="text-[10px] font-bold text-red-600 uppercase mb-1">{r.tipo_reclamo} - {r.fecha || r.fecha_registro?.split('T')[0]}</p>
                      <p className="text-sm font-bold text-slate-700">{r.descripcion}</p>
                      <p className="text-[10px] text-slate-400 mt-2">Estado: {r.estado}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center bg-slate-50 border border-slate-100 rounded-2xl text-slate-400 text-xs italic">
                  Lote libre de incidencias y reclamos.
                </div>
              )}
            </section>
          </div>

          {/* Firmas */}
          <div className="mt-24 grid grid-cols-2 gap-20 text-center text-[9px] font-black uppercase tracking-widest text-slate-400">
            <div>
              <div className="border-t border-slate-300 mb-2"></div>
              Responsable de Producción
            </div>
            <div>
              <div className="border-t border-slate-300 mb-2"></div>
              Responsable Control de Calidad
            </div>
          </div>
        </div>
      )}

      {/* ESTILOS DE IMPRESIÓN MEJORADOS */}
      <style>{`
        @media print {
          /* Ocultar TODO el cuerpo */
          body * {
            visibility: hidden;
            background-color: white !important;
          }
          /* Mostrar SOLO el reporte y sus hijos */
          #printable-report, #printable-report * {
            visibility: visible;
          }
          /* Posicionar el reporte arriba */
          #printable-report {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 0;
            box-shadow: none;
            border: none;
          }
          .no-print {
            display: none !important;
          }
          @page {
            size: portrait;
            margin: 1.5cm;
          }
        }
      `}</style>
    </div>
  );
};