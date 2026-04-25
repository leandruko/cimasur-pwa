import React, { useState } from 'react';
import { db } from '../../lib/db';

export const TrazabilidadSearcher = () => {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const buscarHistoria = async () => {
    if (!query) return;
    setLoading(true);
    
    // 1. Buscamos la fabricación por el código de lote
    const fab = await db.fabricaciones.where('codigo_lote').equals(query).first();
    
    if (fab) {
      // 2. Buscamos en paralelo toda la información relacionada
      const [base, storage, qa, sale,claim] = await Promise.all([
        db.bases.get(fab.base_id),
        db.almacenamientos.where('fabricacion_id').equals(fab.id).first(),
        db.etiquetados.where('fabricacion_id').equals(fab.id).first(),
        db.ventas.where('fabricacion_id').equals(fab.id).first(),
        db.reclamos.where('fabricacion_id').equals(fab.id).first()
      ]);

      setResult({ fab, base, storage, qa, sale,claim });
    } else {
      alert("Código de lote no encontrado en la base de datos local.");
      setResult(null);
    }
    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Barra de Búsqueda */}
      <div className="flex gap-2 p-2 bg-slate-900 border border-slate-700 rounded-2xl shadow-xl">
        <input 
          className="flex-1 bg-transparent p-4 text-white font-mono outline-none"
          placeholder="Ingrese código de lote (Ej: SA-202604-001)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && buscarHistoria()}
        />
        <button 
          onClick={buscarHistoria}
          className="bg-blue-600 hover:bg-blue-500 text-white px-8 rounded-xl font-bold transition-all"
        >
          {loading ? 'Buscando...' : 'RASTREAR'}
        </button>
      </div>

      {result && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
            {/* Encabezado del Resultado */}
            <div className="bg-blue-600/10 p-6 border-b border-slate-800 flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-black text-white font-mono">{result.fab.codigo_lote}</h3>
                <p className="text-blue-400 text-xs font-bold uppercase tracking-widest">Expediente Digital de Trazabilidad</p>
              </div>
              <span className={`px-4 py-1 rounded-full text-xs font-bold ${result.qa?.estado_qa === 'aprobado' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                {result.qa?.estado_qa?.toUpperCase() || 'CALIDAD PENDIENTE'}
              </span>
            </div>

            {/* Línea de Tiempo / Detalles */}
            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
              <section className="space-y-6">
                <TimelineStep 
                  icon="🧪" title="Origen: Materia Prima" 
                  detail={`Base: ${result.base?.codigo_base}`}
                  subDetail={`Proveedor: ${result.base?.proveedor} | Lote: ${result.base?.lote_materia_prima}`}
                />
                <TimelineStep 
                  icon="⚗️" title="Proceso: Fabricación" 
                  detail={`Fecha: ${new Date(result.fab.created_at).toLocaleDateString()}`}
                  subDetail={`Cantidad: ${result.fab.cantidad_producida} Lts/Kg`}
                />
              </section>

              <section className="space-y-6">
                <TimelineStep 
                  icon="📦" title="Logística: Almacén" 
                  detail={result.storage ? `${result.storage.bodega} - Estante ${result.storage.estante}` : 'Sin registro de ubicación'}
                  subDetail={result.storage ? `Temperatura Controlada: ${result.storage.temperatura_control}°C` : ''}
                />
                <TimelineStep 
                  icon="🛒" title="Salida: Cliente Final" 
                  detail={result.sale ? result.sale.cliente : 'En inventario'}
                  subDetail={result.sale ? `Doc: ${result.sale.nro_documento} | Fecha: ${new Date(result.sale.fecha_venta).toLocaleDateString()}` : 'Disponible para despacho'}
                />
              </section>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const TimelineStep = ({ icon, title, detail, subDetail }: any) => (
  <div className="flex gap-4">
    <div className="text-2xl">{icon}</div>
    <div>
      <h4 className="text-slate-500 text-[10px] font-black uppercase tracking-widest">{title}</h4>
      <p className="text-slate-100 font-bold">{detail}</p>
      <p className="text-slate-400 text-xs mt-1 italic">{subDetail}</p>
    </div>
  </div>
);