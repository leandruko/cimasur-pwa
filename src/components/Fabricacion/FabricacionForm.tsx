import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { db } from '../../lib/db'; 
import { useLiveQuery } from 'dexie-react-hooks';
import { generateCode } from '../../lib/utils/codigos';
import { RefreshCw, Loader2, Beaker } from 'lucide-react';

export const FabricacionForm = () => {
  // 1. Datos maestros locales (Categorías y Usuarios)
  const categorias = useLiveQuery(() => db.categoria_producto.toArray());
  const usuarios = useLiveQuery(() => db.perfiles.toArray());

  // 2. Estados para la nube
  const [basesOnline, setBasesOnline] = useState<any[]>([]);
  const [loadingBases, setLoadingBases] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });
  const [loteGenerado, setLoteGenerado] = useState('');

  const [formData, setFormData] = useState({
    categoria_id: '',
    producto: '',
    cantidad_frascos: '',
    base_id: '', 
    ingrediente_activo: '',
    temperatura: '',
    responsable_id: '',
    qa: 'OK', 
    observaciones: '',
  });

  // 3. Función de carga automática desde Supabase
  const fetchBasesOnline = async () => {
    setLoadingBases(true);
    try {
      const { data, error } = await supabase
        .from('bases')
        .select('codigo, proveedor')
        .order('codigo', { ascending: false }); // Ordenamos por código si no hay created_at
      
      if (error) throw error;
      if (data) setBasesOnline(data);
    } catch (err: any) {
      console.error("Error al cargar bases:", err.message);
    } finally {
      setLoadingBases(false);
    }
  };

  // EFECTO DE CARGA INICIAL (Se ejecuta apenas entra al componente)
  useEffect(() => {
    fetchBasesOnline();
  }, []);

  const handleGenerateLote = async () => {
    if (!formData.categoria_id) {
      return setMensaje({ tipo: 'error', texto: "Seleccione una categoría primero" });
    }
    const cat = categorias?.find(c => String(c.id) === String(formData.categoria_id));
    if (cat) {
      const prefijo = cat.prefijo || cat.nombre.substring(0, 3).toUpperCase();
      const nuevoLote = await generateCode(prefijo, 'fabricaciones');
      setLoteGenerado(nuevoLote);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loteGenerado) return setMensaje({ tipo: 'error', texto: "Debe generar el código de lote." });
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('fabricaciones')
        .insert([{
          codigo_lote: loteGenerado,
          categoria_id: formData.categoria_id,
          producto: formData.producto,
          cantidad_frascos: parseInt(formData.cantidad_frascos),
          // IMPORTANTE: base_salina_id es el nombre en tu Supabase
          base_salina_id: formData.base_id, 
          ingrediente_activo: formData.ingrediente_activo,
          temperatura: parseFloat(formData.temperatura),
          responsable_id: formData.responsable_id,
          qa: formData.qa,
          observaciones: formData.observaciones || null
        }]);

      if (error) throw error;

      setMensaje({ tipo: 'success', texto: `✅ Lote ${loteGenerado} registrado con éxito.` });
      
      setFormData({
        categoria_id: '', producto: '', cantidad_frascos: '',
        base_id: '', ingrediente_activo: '', temperatura: '',
        responsable_id: '', qa: 'OK', observaciones: ''
      });
      setLoteGenerado('');
      fetchBasesOnline(); // Refrescar lista tras guardar

    } catch (error: any) {
      setMensaje({ tipo: 'error', texto: `❌ Error: ${error.message}` });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl space-y-6">
        
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Beaker className="text-purple-500" />
            Proceso de Fabricación
          </h2>
          {loteGenerado && (
            <div className="bg-purple-500/10 border border-purple-500/20 px-4 py-2 rounded-lg font-mono font-bold text-purple-400">
              {loteGenerado}
            </div>
          )}
        </div>

        {mensaje.texto && (
          <div className={`p-4 rounded-xl border animate-in fade-in zoom-in duration-300 ${
            mensaje.tipo === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'
          }`}>
            {mensaje.texto}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Categoría *</label>
              <div className="flex gap-2">
                <select 
                  required
                  className="flex-1 bg-slate-800 border border-slate-700 text-white p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-purple-500"
                  onChange={(e) => setFormData({...formData, categoria_id: e.target.value})}
                  value={formData.categoria_id}
                >
                  <option value="">Seleccione categoría...</option>
                  {categorias?.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
                <button type="button" onClick={handleGenerateLote} className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg font-bold text-xs uppercase transition-all">
                  Generar
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Nombre del Producto *</label>
              <input 
                required type="text"
                className="w-full bg-slate-800 border border-slate-700 text-white p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-purple-500"
                onChange={(e) => setFormData({...formData, producto: e.target.value})}
                value={formData.producto}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="flex justify-between text-sm font-medium text-slate-400 mb-1">
                <span>Base de Origen *</span>
                {loadingBases && <Loader2 className="w-3 h-3 animate-spin text-blue-400" />}
              </label>
              <div className="flex gap-2">
                <select 
                  required
                  className="flex-1 bg-slate-800 border border-slate-700 text-white p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-purple-500"
                  onChange={(e) => setFormData({...formData, base_id: e.target.value})}
                  value={formData.base_id}
                >
                  <option value="">{loadingBases ? 'Cargando bases...' : 'Seleccione Base...'}</option>
                  {basesOnline.map(b => (
                    <option key={b.codigo} value={b.codigo}>
                      {b.codigo} ({b.proveedor || 'S/P'})
                    </option>
                  ))}
                </select>
                <button type="button" onClick={fetchBasesOnline} className="bg-slate-700 hover:bg-slate-600 text-white p-2.5 rounded-lg transition-colors">
                  <RefreshCw size={16} className={loadingBases ? "animate-spin" : ""} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Cant. Frascos</label>
                <input 
                  type="number"
                  className="w-full bg-slate-800 border border-slate-700 text-white p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-purple-500"
                  onChange={(e) => setFormData({...formData, cantidad_frascos: e.target.value})}
                  value={formData.cantidad_frascos}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Temp. (°C)</label>
                <input 
                  type="number" step="0.1"
                  className="w-full bg-slate-800 border border-slate-700 text-white p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-purple-500"
                  onChange={(e) => setFormData({...formData, temperatura: e.target.value})}
                  value={formData.temperatura}
                />
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Ingrediente Activo</label>
              <input 
                type="text"
                className="w-full bg-slate-800 border border-slate-700 text-white p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-purple-500"
                onChange={(e) => setFormData({...formData, ingrediente_activo: e.target.value})}
                value={formData.ingrediente_activo}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Responsable *</label>
              <select 
                required
                className="w-full bg-slate-800 border border-slate-700 text-white p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-purple-500"
                onChange={(e) => setFormData({...formData, responsable_id: e.target.value})}
                value={formData.responsable_id}
              >
                <option value="">Seleccione responsable...</option>
                {usuarios?.map(u => <option key={u.id} value={u.id}>{u.nombre_completo}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Estado QA *</label>
              <select 
                className="w-full bg-slate-800 border border-slate-700 text-white p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-purple-500"
                onChange={(e) => setFormData({...formData, qa: e.target.value})}
                value={formData.qa}
              >
                <option value="OK">✅ OK (Aprobado)</option>
                <option value="NO">❌ NO (Rechazado)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Observaciones</label>
              <textarea 
                rows={1}
                className="w-full bg-slate-800 border border-slate-700 text-white p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-purple-500"
                onChange={(e) => setFormData({...formData, observaciones: e.target.value})}
                value={formData.observaciones}
              ></textarea>
            </div>
          </div>
        </div>

        <button 
          type="submit"
          disabled={!loteGenerado || loading}
          className="w-full bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-500 hover:to-purple-700 text-white font-bold py-4 rounded-xl shadow-lg transition-all transform active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 uppercase tracking-widest"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin" /> REGISTRANDO...
            </>
          ) : 'Registrar Fabricación'}
        </button>
      </form>
    </div>
  );
};