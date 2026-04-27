import React, { useState } from 'react';
import { db } from '../../lib/db';
import { 
  Search, Loader2, Printer, FileText, 
  CheckCircle, AlertCircle, Calendar, Hash, User, MapPin
} from 'lucide-react';

export const Searcher = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const term = searchTerm.trim().toUpperCase();
    if (!term) return;

    setLoading(true);
    try {
      // 1. Buscamos en Fabricaciones (Lotes) permitiendo coincidencias parciales
      const todasFab = await db.fabricaciones.toArray();
      const lote = todasFab.find(f => f.codigo_lote.toUpperCase().includes(term));

      if (!lote) {
        setResults('NOT_FOUND');
        setLoading(false);
        return;
      }

      // 2. Buscamos toda la cadena de datos relacionada
      const [base, almacen, etiquetado, ventas, reclamos, perfiles] = await Promise.all([
        db.bases.where('codigo').equals(lote.base_salina_id).first(),
        db.almacenamientos.where('lote_id').equals(lote.codigo_lote).first(),
        db.etiquetados.where('lote_id').equals(lote.codigo_lote).first(),
        db.ventas.where('lote_id').equals(lote.codigo_lote).toArray(),
        db.reclamos.where('lote_id').equals(lote.codigo_lote).toArray(),
        db.perfiles.toArray()
      ]);

      // Función para resolver nombres de responsables
      const getNombre = (id: string) => perfiles.find(p => p.id === id)?.nombre_completo || 'No asignado';

      setResults({
        lote,
        base,
        almacen,
        etiquetado,
        ventas,
        reclamos,
        responsables: {
          fabricacion: getNombre(lote.responsable_id),
          base: base ? getNombre(base.responsable_id) : 'N/A',
          almacen: almacen ? getNombre(almacen.responsable_id) : 'N/A',
          etiquetado: etiquetado ? getNombre(etiquetado.responsable_id) : 'N/A'
        }
      });
    } catch (error) {
      console.error("Error en búsqueda:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-6">
      {/* BUSCADOR (No se verá en el PDF/Impresión) */}
      <form onSubmit={handleSearch} className="flex gap-2 no-print">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            className="w-full bg-slate-900 border-2 border-slate-800 text-white p-4 pl-12 rounded-2xl focus:border-blue-500 outline-none transition-all"
            placeholder="Escriba el lote (ej: 001, MUR...)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="bg-blue-600 hover:bg-blue-500 text-white px-8 rounded-2xl font-bold flex items-center gap-2">
          {loading ? <Loader2 className="animate-spin" /> : 'GENERAR REPORTE'}
        </button>
      </form>

      {results === 'NOT_FOUND' && (
        <div className="p-8 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-center">
          No se encontró ningún lote que coincida con "{searchTerm}"
        </div>
      )}

      {/* DOCUMENTO DE TRAZABILIDAD */}
      {results && results !== 'NOT_FOUND' && (
        <div className="bg-white text-slate-900 p-12 shadow-2xl rounded-sm border-t-[16px] border-blue-600 print:shadow-none print:p-0 relative">
          
          {/* Botón de Impresión Flotante (Solo pantalla) */}
          <button 
            onClick={handlePrint}
            className="absolute top-6 right-6 no-print bg-slate-100 hover:bg-slate-200 p-3 rounded-full transition-colors"
            title="Imprimir o Guardar PDF"
          >
            <Printer className="w-6 h-6 text-slate-600" />
          </button>

          {/* ENCABEZADO OFICIAL */}
          <div className="flex justify-between items-start border-b-2 border-slate-100 pb-8 mb-10">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-black text-3xl">C</span>
              </div>
              <div>
                <h1 className="text-3xl font-black tracking-tighter text-slate-900">CIMASUR S.A.</h1>
                <p className="text-[10px] font-bold text-blue-600 uppercase tracking-[0.2em]">Quality Control & Traceability System</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black text-slate-400 uppercase">Certificado de Lote</p>
              <p className="text-3xl font-mono font-black text-slate-900">{results.lote.codigo_lote}</p>
              <p className="text-[10px] text-slate-400 mt-1">Generado: {new Date().toLocaleString()}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-12">
            
            {/* SECCIÓN 1: MATERIA BASE */}
            <section>
              <h3 className="flex items-center gap-2 text-blue-600 font-black text-sm mb-5">
                <div className="w-2 h-4 bg-blue-600"></div> 1. INFORMACIÓN DE MATERIA BASE (ORIGEN)
              </h3>
              <div className="grid grid-cols-3 gap-6 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                <div>
                  <label className="block text-[9px] font-black text-slate-400 uppercase mb-1">Código de Base</label>
                  <p className="font-bold text-sm">{results.base?.codigo || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-[9px] font-black text-slate-400 uppercase mb-1">Proveedor / Lote MP</label>
                  <p className="font-bold text-sm">{results.base?.proveedor || 'No reg.'} | {results.base?.lote_materia_prima || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-[9px] font-black text-slate-400 uppercase mb-1">Responsable Proceso</label>
                  <p className="font-bold text-sm">{results.responsables.base}</p>
                </div>
              </div>
            </section>

            {/* SECCIÓN 2: FABRICACIÓN */}
            <section>
              <h3 className="flex items-center gap-2 text-blue-600 font-black text-sm mb-5">
                <div className="w-2 h-4 bg-blue-600"></div> 2. REGISTRO DE PRODUCCIÓN INDUSTRIAL
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 border border-slate-100 p-8 rounded-2xl">
                <div>
                  <div className="flex items-center gap-2 text-slate-400 mb-2"><Calendar size={14}/> <span className="text-[9px] font-bold uppercase">Fecha</span></div>
                  <p className="font-bold text-sm">{results.lote.created_at ? results.lote.created_at.split('T')[0] : 'No reg.'}</p>
                </div>
                <div>
                  <div className="flex items-center gap-2 text-slate-400 mb-2"><Hash size={14}/> <span className="text-[9px] font-bold uppercase">Cantidades</span></div>
                  <p className="text-xs">Uso: <span className="font-bold">{results.lote.cantidad_base}L/Kg</span></p>
                  <p className="text-xs">Prod: <span className="font-bold text-blue-600">{results.lote.cantidad_final} Unidades</span></p>
                </div>
                <div>
                  <div className="flex items-center gap-2 text-slate-400 mb-2"><User size={14}/> <span className="text-[9px] font-bold uppercase">Operador</span></div>
                  <p className="font-bold text-sm">{results.responsables.fabricacion}</p>
                </div>
                <div>
                  <div className="flex items-center gap-2 text-slate-400 mb-2"><CheckCircle size={14} className="text-green-500"/> <span className="text-[9px] font-bold uppercase">Eficiencia</span></div>
                  <p className="font-bold text-sm">{results.lote.rendimiento}%</p>
                </div>
              </div>
            </section>

            {/* SECCIÓN 3: LOGÍSTICA Y CALIDAD */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <section>
                <h3 className="flex items-center gap-2 text-blue-600 font-black text-sm mb-5">
                  <div className="w-2 h-4 bg-blue-600"></div> 3. LOGÍSTICA & ALMACÉN
                </h3>
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                    <span className="flex items-center gap-2 text-[9px] font-bold text-slate-400 uppercase"><MapPin size={12}/> Ubicación</span>
                    <span className="font-bold text-sm">{results.almacen?.ubicacion || 'Pendiente'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-2 text-[9px] font-bold text-slate-400 uppercase"><User size={12}/> Verificado por</span>
                    <span className="font-bold text-sm">{results.responsables.almacen}</span>
                  </div>
                </div>
              </section>

              <section>
                <h3 className="flex items-center gap-2 text-blue-600 font-black text-sm mb-5">
                  <div className="w-2 h-4 bg-blue-600"></div> 4. SALIDAS Y DESPACHOS (VENTAS)
                </h3>
                <div className="space-y-2 max-h-[200px] overflow-auto">
                  {results.ventas.map((v: any, index: number) => (
                    <div key={index} className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border-l-4 border-slate-300">
                      <span className="text-xs font-bold text-slate-700">{v.cliente}</span>
                      <span className="text-[10px] bg-white px-3 py-1 rounded-full shadow-sm font-black">{v.cantidad_vendida} UDS</span>
                    </div>
                  ))}
                  {results.ventas.length === 0 && <p className="text-xs italic text-slate-400 text-center py-4">Sin registros de venta para este lote.</p>}
                </div>
              </section>
            </div>

            {/* SECCIÓN 4: RECLAMOS */}
            <section>
              <h3 className={`flex items-center gap-2 font-black text-sm mb-5 ${results.reclamos.length > 0 ? 'text-red-600' : 'text-green-600'}`}>
                <div className={`w-2 h-4 ${results.reclamos.length > 0 ? 'bg-red-600' : 'bg-green-600'}`}></div> 5. INCIDENCIAS Y NO CONFORMIDADES
              </h3>
              {results.reclamos.length > 0 ? (
                <div className="grid grid-cols-1 gap-3">
                  {results.reclamos.map((r: any, idx: number) => (
                    <div key={idx} className="bg-red-50 p-5 rounded-2xl border border-red-100 flex gap-4">
                      <div>
                        <p className="text-[9px] font-black text-red-600 uppercase mb-1">{r.tipo_reclamo} - {r.fecha}</p>
                        <p className="text-sm text-red-900 leading-relaxed">{r.descripcion}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-green-50 p-6 rounded-2xl border border-green-100 flex items-center gap-4">
                  <CheckCircle className="text-green-600" />
                  <p className="text-xs font-bold text-green-700 uppercase tracking-tight">Producto verificado: El lote no presenta registros de reclamos o incidencias técnicas.</p>
                </div>
              )}
            </section>
          </div>

          {/* PIE DE PÁGINA DOCUMENTO */}
          <div className="mt-20 pt-10 border-t border-slate-100">
            <div className="flex justify-between items-end">
              <div className="text-[8px] text-slate-400 uppercase tracking-widest font-bold">
                CIMASUR PWA - Traceability Module v1.0<br/>
                Internal Document - Confidential
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CSS para Impresión */}
      <style>{`
        @media print {
          body { background: white !important; }
          .no-print { display: none !important; }
          #trazabilidad-documento { 
            box-shadow: none !important; 
            border: none !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          @page { margin: 1cm; }
        }
      `}</style>
    </div>
  );
};