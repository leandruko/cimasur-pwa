import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { db } from '../../lib/db'; 
import { useLiveQuery } from 'dexie-react-hooks';
import { generateCode } from '../../lib/utils/codigos';
import { RefreshCw, Loader2, Beaker } from 'lucide-react';
import { registrarAuditoria } from '../../services/auditService';

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
        .order('codigo', { ascending: false });
      
      if (error) throw error;
      if (data) setBasesOnline(data);
    } catch (err: any) {
      console.error("Error al cargar bases:", err.message);
    } finally {
      setLoadingBases(false);
    }
  };

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
          base_salina_id: formData.base_id, 
          ingrediente_activo: formData.ingrediente_activo,
          temperatura: parseFloat(formData.temperatura),
          responsable_id: formData.responsable_id,
          qa: formData.qa,
          observaciones: formData.observaciones || null
        }]);

      if (error) throw error;

      await registrarAuditoria(
        'CREAR', 
        'Fabricación', 
        `Registró nuevo lote de fabricación: ${loteGenerado} | Producto: ${formData.producto} (${formData.cantidad_frascos} frascos)`
      );

      setMensaje({ tipo: 'success', texto: `✅ Lote ${loteGenerado} registrado con éxito.` });
      
      setFormData({
        categoria_id: '', producto: '', cantidad_frascos: '',
        base_id: '', ingrediente_activo: '', temperatura: '',
        responsable_id: '', qa: 'OK', observaciones: ''
      });
      setLoteGenerado('');
      fetchBasesOnline();

    } catch (error: any) {
      setMensaje({ tipo: 'error', texto: `❌ Error: ${error.message}` });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      {/* TARJETA BLANCA CON BORDES REDONDEADOS SEGÚN LA IMAGEN REFERENCIAL */}
      <form onSubmit={handleSubmit} className="bg-white border border-slate-100 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
        
        {/* CABECERA DE LA TARJETA (Título oscuro + Badge del lote a la derecha) */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-slate-100 pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-cyan-50 rounded-xl">
                <Beaker className="text-cyan-500" size={20} />
              </div>
              <h2 className="text-xl font-bold text-slate-800 tracking-tight uppercase">
                Proceso de Fabricación
              </h2>
            </div>
            <p className="text-slate-500 text-xs font-medium">
              Registre las mezclas de lote y parámetros de control térmico en laboratorio.
            </p>
          </div>
          
          {loteGenerado && (
            <div className="bg-cyan-50 border border-cyan-100 px-4 py-2 rounded-xl flex flex-col justify-center items-center shrink-0 animate-in fade-in zoom-in duration-300">
              <span className="text-[9px] font-black uppercase text-cyan-600 tracking-widest mb-0.5">LOTE GENERADO</span>
              <span className="font-mono font-black text-slate-700 text-base uppercase">{loteGenerado}</span>
            </div>
          )}
        </div>

        {/* FEEDBACK DE ACCIÓN */}
        {mensaje.texto && (
          <div className={`p-4 rounded-xl border text-xs font-bold animate-in fade-in duration-300 ${
            mensaje.tipo === 'success' 
              ? 'bg-green-50 border-green-100 text-green-700' 
              : 'bg-red-50 border-red-100 text-red-700'
          }`}>
            {mensaje.texto}
          </div>
        )}

        {/* CONTENEDORES DE INPUTS EN FONDO CLARO CON ENFOQUE CIAN */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          
          {/* CATEGORÍA */}
          <div className="flex flex-col space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Categoría *</label>
            <div className="flex gap-2">
              <select 
                required
                className="flex-1 bg-slate-50 border border-slate-200 text-slate-800 p-3 rounded-xl text-sm outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-all font-medium"
                onChange={(e) => setFormData({...formData, categoria_id: e.target.value})}
                value={formData.categoria_id}
              >
                <option value="" className="text-slate-400">Seleccione categoría...</option>
                {categorias?.map(c => <option key={c.id} value={c.id} className="text-slate-800">{c.nombre}</option>)}
              </select>
              <button 
                type="button" 
                onClick={handleGenerateLote} 
                className="bg-cyan-500 hover:bg-cyan-600 text-white px-4 rounded-xl font-bold text-xs uppercase tracking-wider transition-all active:scale-95 shrink-0 shadow-sm"
              >
                Generar
              </button>
            </div>
          </div>

          {/* NOMBRE DEL PRODUCTO */}
          <div className="flex flex-col space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nombre del Producto *</label>
            <input 
              required 
              type="text"
              placeholder="Ej: Paracetamol Gotas 100mg"
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 p-3 rounded-xl text-sm outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-all font-medium placeholder:text-slate-400"
              onChange={(e) => setFormData({...formData, producto: e.target.value})}
              value={formData.producto}
            />
          </div>

          {/* BASE DE ORIGEN */}
          <div className="flex flex-col space-y-1.5">
            <label className="flex justify-between items-center text-xs font-bold text-slate-500 uppercase tracking-wider">
              <span>Base de Origen *</span>
              {loadingBases && <Loader2 className="w-3 h-3 animate-spin text-cyan-500" />}
            </label>
            <div className="flex gap-2">
              <select 
                required
                className="flex-1 bg-slate-50 border border-slate-200 text-slate-800 p-3 rounded-xl text-sm outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-all font-medium"
                onChange={(e) => setFormData({...formData, base_id: e.target.value})}
                value={formData.base_id}
              >
                <option value="" className="text-slate-400">{loadingBases ? 'Cargando bases...' : 'Seleccione Base...'}</option>
                {basesOnline.map(b => (
                  <option key={b.codigo} value={b.codigo} className="text-slate-800 font-mono">
                    {b.codigo} ({b.proveedor || 'Sin Proveedor'})
                  </option>
                ))}
              </select>
              <button 
                type="button" 
                onClick={fetchBasesOnline} 
                className="bg-slate-100 hover:bg-slate-200 text-slate-600 p-3 rounded-xl transition-colors border border-slate-200"
              >
                <RefreshCw size={16} className={loadingBases ? "animate-spin text-cyan-500" : ""} />
              </button>
            </div>
          </div>

          {/* FRASCOS Y TEMPERATURA */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cant. Frascos</label>
              <input 
                type="number"
                placeholder="0"
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 p-3 rounded-xl text-sm outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-all font-medium font-mono placeholder:text-slate-400"
                onChange={(e) => setFormData({...formData, cantidad_frascos: e.target.value})}
                value={formData.cantidad_frascos}
              />
            </div>
            <div className="flex flex-col space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Temp. (°C)</label>
              <input 
                type="number" 
                step="0.1"
                placeholder="18.0"
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 p-3 rounded-xl text-sm outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-all font-medium font-mono placeholder:text-slate-400"
                onChange={(e) => setFormData({...formData, temperatura: e.target.value})}
                value={formData.temperatura}
              />
            </div>
          </div>
          
          {/* INGREDIENTE ACTIVO */}
          <div className="flex flex-col space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ingrediente Activo</label>
            <input 
              type="text"
              placeholder="Ej: Principio Activo A"
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 p-3 rounded-xl text-sm outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-all font-medium placeholder:text-slate-400"
              onChange={(e) => setFormData({...formData, ingrediente_activo: e.target.value})}
              value={formData.ingrediente_activo}
            />
          </div>

          {/* RESPONSABLE */}
          <div className="flex flex-col space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Responsable *</label>
            <select 
              required
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 p-3 rounded-xl text-sm outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-all font-medium"
              onChange={(e) => setFormData({...formData, responsable_id: e.target.value})}
              value={formData.responsable_id}
            >
              <option value="" className="text-slate-400">Seleccione responsable...</option>
              {usuarios?.map(u => <option key={u.id} value={u.id} className="text-slate-800 font-bold">{u.nombre_completo}</option>)}
            </select>
          </div>

          {/* ESTADO QA */}
          <div className="flex flex-col space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Estado QA *</label>
            <select 
              className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-sm outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-all font-bold text-slate-800"
              onChange={(e) => setFormData({...formData, qa: e.target.value})}
              value={formData.qa}
            >
              <option value="OK" className="text-green-600 font-bold">✅ OK (Aprobado)</option>
              <option value="NO" className="text-red-600 font-bold">❌ NO (Rechazado)</option>
            </select>
          </div>

          {/* OBSERVACIONES */}
          <div className="flex flex-col space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Observaciones</label>
            <textarea 
              rows={1}
              placeholder="Notas internas del lote..."
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 p-3 rounded-xl text-sm outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-all font-medium placeholder:text-slate-400"
              onChange={(e) => setFormData({...formData, observaciones: e.target.value})}
              value={formData.observaciones}
            ></textarea>
          </div>
        </div>

        {/* BOTÓN CIAN ELECTRÓNICO */}
        <div className="pt-4 border-t border-slate-100">
          <button 
            type="submit"
            disabled={!loteGenerado || loading}
            className="w-full bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-3.5 rounded-xl shadow-sm transition-all transform active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2 uppercase tracking-wider text-xs"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={14} /> REGISTRANDO...
              </>
            ) : 'Registrar Fabricación'}
          </button>
        </div>
      </form>
    </div>
  );
};