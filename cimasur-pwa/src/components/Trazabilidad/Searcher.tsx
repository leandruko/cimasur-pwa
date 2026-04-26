import React, { useState } from 'react';
import { db } from '../../lib/db';

export const BuscadorTrazabilidad = () => {
  const [query, setQuery] = useState('');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!query) return;
    setLoading(true);
    
    // 1. Buscamos la fabricación (el eje central)
    const fab = await db.fabricaciones.get(query);
    
    if (fab) {
      // 2. Buscamos todas las relaciones (Equivalente a select_related en Django)
      const [base, almacen, etiqueta, ventas, reclamos] = await Promise.all([
        db.bases.get(fab.base_salina_id),
        db.almacenamientos.get(fab.codigo_lote),
        db.etiquetados.get(fab.codigo_lote),
        db.ventas.where('lote_id').equals(fab.codigo_lote).toArray(),
        db.reclamos.where('lote_id').equals(fab.codigo_lote).toArray()
      ]);

      setData({ fab, base, almacen, etiqueta, ventas, reclamos });
    } else {
      alert("Lote no encontrado.");
      setData(null);
    }
    setLoading(false);
  };

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      {/* BARRA DE BÚSQUEDA */}
      <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl flex gap-4">
        <input 
          type="text"
          placeholder="Ingrese Código de Lote (Ej: CA-202604-001)"
          className="flex-1 bg-slate-800 border border-slate-700 text-white p-3 rounded-xl font-mono focus:ring-2 focus:ring-blue-500 outline-none"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button 
          onClick={handleSearch}
          className="bg-blue-600 hover:bg-blue-500 text-white px-8 rounded-xl font-bold transition-all"
        >
          {loading ? 'Buscando...' : 'RASTREAR'}
        </button>
      </div>

      {data && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4">
          
          {/* COLUMNA 1: ORIGEN Y PROCESO */}
          <div className="space-y-6">
            <Card title="Materia Prima (Base)" icon="🧪" color="text-blue-400">
              <Item label="Código Base" value={data.base?.codigo} />
              <Item label="Proveedor" value={data.base?.proveedor} />
              <Item label="Lote Proveedor" value={data.base?.lote_materia_prima} />
              <Item label="Concentración" value={data.base?.concentracion} />
            </Card>

            <Card title="Fabricación" icon="⚗️" color="text-purple-400">
              <Item label="Producto" value={data.fab.producto} />
              <Item label="Ingrediente Activo" value={data.fab.ingrediente_activo} />
              <Item label="Temp. Mezcla" value={`${data.fab.temperatura} °C`} />
              <Item label="Frascos" value={data.fab.cantidad_frascos} />
            </Card>
          </div>

          {/* COLUMNA 2: LOGÍSTICA Y CALIDAD */}
          <div className="space-y-6">
            <Card title="Almacenamiento" icon="📦" color="text-amber-400">
              <Item label="Ubicación" value={data.almacen?.ubicacion || 'No registrado'} />
              <Item label="Temp. Verificada" value={data.almacen ? `${data.almacen.temperatura_verificada} °C` : '-'} />
            </Card>

            <Card title="Etiquetado y QA" icon="🏷️" color="text-emerald-400">
              <Item label="Estado QA" value={data.etiqueta?.qa ? '✅ OK' : '❌ PENDIENTE'} />
              <Item label="Vencimiento" value={data.etiqueta?.vencimiento_etiqueta} />
              <Item label="Cant. Final" value={data.etiqueta?.cantidad_etiquetada} />
            </Card>
          </div>

          {/* COLUMNA 3: SALIDA Y POST-VENTA */}
          <div className="space-y-6">
            <Card title="Historial de Ventas" icon="🛒" color="text-indigo-400">
              {data.ventas.length > 0 ? data.ventas.map((v: any) => (
                <div key={v.id} className="border-b border-slate-800 pb-2 mb-2 last:border-0">
                  <p className="text-white text-sm font-bold">{v.cliente}</p>
                  <p className="text-slate-500 text-[10px]">Factura: {v.nro_factura} | Cant: {v.cantidad_vendida}</p>
                </div>
              )) : <p className="text-slate-500 text-sm">Sin ventas registradas</p>}
            </Card>

            {data.reclamos.length > 0 && (
              <Card title="Reclamos" icon="⚠️" color="text-red-400">
                {data.reclamos.map((r: any) => (
                  <div key={r.id} className="bg-red-500/10 border border-red-500/20 p-2 rounded mb-2">
                    <p className="text-red-400 text-xs font-bold">{r.tipo_problema}</p>
                    <p className="text-slate-300 text-[10px]">{r.detalles}</p>
                  </div>
                ))}
              </Card>
            )}
          </div>

        </div>
      )}
    </div>
  );
};

// Componentes auxiliares para el diseño
const Card = ({ title, icon, color, children }: any) => (
  <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg">
    <h3 className={`flex items-center gap-2 font-bold mb-4 ${color}`}>
      <span>{icon}</span> {title}
    </h3>
    <div className="space-y-3">{children}</div>
  </div>
);

const Item = ({ label, value }: any) => (
  <div>
    <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">{label}</p>
    <p className="text-slate-200 text-sm font-medium">{value || '---'}</p>
  </div>
);