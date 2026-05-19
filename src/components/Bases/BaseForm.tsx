import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { generarCodigoBase } from '../../lib/utils/codigos';
import { useLiveQuery } from 'dexie-react-hooks'; 
import { db } from '../../lib/db'; 
import { registrarAuditoria } from '../../services/auditService';
import { Beaker, Loader2 } from 'lucide-react';

export const BaseForm = () => {
  const tiposBase = useLiveQuery(() => db.tipo_base.toArray()) || [];
  const responsables = useLiveQuery(() => db.perfiles.toArray()) || [];

  const [codigoGenerated, setCodigoGenerated] = useState('');
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });
  
  const [formData, setFormData] = useState({
    tipo_id: '', proveedor: '', lote_materia_prima: '', cantidad: '',
    concentracion: '', fecha_elaboracion: '', vencimiento: '', responsable_id: '', qa: 'OK'
  });

  const handleGenerarCodigo = async () => {
    if (!formData.tipo_id) {
      setMensaje({ tipo: 'error', texto: 'Selecciona el Tipo de Base primero.' });
      return;
    }
    try {
      const tipoSeleccionado = tiposBase.find(t => String(t.id) === String(formData.tipo_id));
      const codigo = await generarCodigoBase(tipoSeleccionado?.nombre || 'GEN');
      setCodigoGenerated(codigo);
    } catch (error) {
      setMensaje({ tipo: 'error', texto: 'Error al generar el código.' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!codigoGenerated) {
      setMensaje({ tipo: 'error', texto: 'Debes generar el código base antes de registrar.' });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('bases')
        .insert([{
          codigo: codigoGenerated,
          tipo_id: formData.tipo_id,
          proveedor: formData.proveedor,
          lote_materia_prima: formData.lote_materia_prima,
          cantidad: Number(formData.cantidad),
          concentracion: formData.concentracion,
          fecha_elaboracion: formData.fecha_elaboracion,
          vencimiento: formData.vencimiento,
          responsable_id: formData.responsable_id,
          qa: formData.qa
        }]);

      if (error) throw error;

      const tipoSeleccionado = tiposBase.find(t => String(t.id) === String(formData.tipo_id));
      await registrarAuditoria(
        'CREAR', 
        'Materia Base', 
        `Registró un nuevo lote de ${tipoSeleccionado?.nombre || 'Base'} (Código: ${codigoGenerated} | Cant: ${formData.cantidad})`
      );

      setMensaje({ tipo: 'success', texto: `Lote registrado exitosamente in la nube: ${codigoGenerated}` });
      
      setFormData({
        tipo_id: '', proveedor: '', lote_materia_prima: '', cantidad: '',
        concentracion: '', fecha_elaboracion: '', vencimiento: '',
        responsable_id: '', qa: 'OK'
      });
      setCodigoGenerated('');
      
    } catch (error: any) {
      console.error("Error en Supabase:", error);
      setMensaje({ tipo: 'error', texto: `Error al guardar en la nube: ${error.message}` });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="bg-white border border-slate-100 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
        
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-slate-100 pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-cyan-50 rounded-xl">
                <Beaker className="text-cyan-500" size={20} />
              </div>
              <h2 className="text-xl font-bold text-slate-800 tracking-tight">
                Ingreso de Materia Base
              </h2>
            </div>
            <p className="text-slate-500 text-xs font-medium">
              Complete los datos del lote para generar la trazabilidad analítica inicial.
            </p>
          </div>
          
          {codigoGenerated && (
            <div className="bg-cyan-50 border border-cyan-100 px-4 py-2 rounded-xl flex flex-col justify-center items-center shrink-0 animate-in fade-in zoom-in duration-300">
              <span className="text-[9px] font-black uppercase text-cyan-600 tracking-widest mb-0.5">CÓDIGO MAESTRO</span>
              <span className="font-mono font-black text-slate-700 text-base uppercase">{codigoGenerated}</span>
            </div>
          )}
        </div>

        {mensaje.texto && (
          <div className={`p-4 rounded-xl border text-xs font-bold animate-in fade-in duration-300 ${
            mensaje.tipo === 'success' 
              ? 'bg-green-50 border-green-100 text-green-700' 
              : 'bg-red-50 border-red-100 text-red-700'
          }`}>
            {mensaje.texto}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          
          {/* TIPO DE BASE */}
          <div className="flex flex-col space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tipo de Base *</label>
            <div className="flex gap-2">
              <select 
                required
                className="flex-1 bg-slate-50 border border-slate-200 text-slate-800 p-3 rounded-xl text-sm outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-all font-medium"
                value={formData.tipo_id}
                onChange={(e) => setFormData({...formData, tipo_id: e.target.value})}
              >
                <option value="" className="bg-white text-slate-400">Seleccione tipo de base...</option>
                {tiposBase.map(t => <option key={t.id} value={t.id} className="bg-white text-slate-800 uppercase font-bold">{t.nombre}</option>)}
              </select>
              <button 
                type="button" 
                onClick={handleGenerarCodigo} 
                className="bg-cyan-500 hover:bg-cyan-600 text-white px-4 rounded-xl font-bold text-xs uppercase tracking-wider transition-all active:scale-95 shrink-0 shadow-sm"
              >
                GENERAR
              </button>
            </div>
          </div>

          {/* PROVEEDOR (INCIDENCIA: Se eliminó / Fabricante) */}
          <div className="flex flex-col space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Proveedor</label>
            <input 
              type="text" 
              placeholder="Ej: Merck S.A."
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 p-3 rounded-xl text-sm outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-all font-medium placeholder:text-slate-400"
              value={formData.proveedor} 
              onChange={(e) => setFormData({...formData, proveedor: e.target.value})}
            />
          </div>

          {/* CANTIDAD Y CONCENTRACIÓN (INCIDENCIA: Solo en Litros) */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cant. (solo en Litros)</label>
              <input 
                type="number" 
                step="0.01" 
                placeholder="0.00"
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 p-3 rounded-xl text-sm outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-all font-medium font-mono placeholder:text-slate-400"
                value={formData.cantidad} 
                onChange={(e) => setFormData({...formData, cantidad: e.target.value})}
              />
            </div>
            <div className="flex flex-col space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Concentración</label>
              <input 
                type="text" 
                placeholder="Ej: 99.8%"
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 p-3 rounded-xl text-sm outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-all font-medium placeholder:text-slate-400"
                value={formData.concentracion} 
                onChange={(e) => setFormData({...formData, concentracion: e.target.value})}
              />
            </div>
          </div>

          {/* LOTE ORIGEN PROVEEDOR (INCIDENCIA: Nombre de campo modificado) */}
          <div className="flex flex-col space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Lote Origen Proveedor</label>
            <input 
              type="text" 
              placeholder="Código de lote de fábrica"
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 p-3 rounded-xl text-sm outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-all font-medium font-mono placeholder:text-slate-400"
              value={formData.lote_materia_prima} 
              onChange={(e) => setFormData({...formData, lote_materia_prima: e.target.value})}
            />
          </div>

          {/* FECHA ELABORACIÓN */}
          <div className="flex flex-col space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Fecha Elaboración</label>
            <input 
              type="date" 
              className="w-full bg-slate-50 border border-slate-200 text-slate-600 p-3 rounded-xl text-sm outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-all font-medium"
              value={formData.fecha_elaboracion} 
              onChange={(e) => setFormData({...formData, fecha_elaboracion: e.target.value})}
            />
          </div>

          {/* FECHA VENCIMIENTO */}
          <div className="flex flex-col space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Fecha Vencimiento</label>
            <input 
              type="date" 
              className="w-full bg-slate-50 border border-slate-200 text-slate-600 p-3 rounded-xl text-sm outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-all font-medium"
              value={formData.vencimiento} 
              onChange={(e) => setFormData({...formData, vencimiento: e.target.value})}
            />
          </div>

          {/* RESPONSABLE (INCIDENCIA: Se eliminó Analista) */}
          <div className="flex flex-col space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Responsable *</label>
            <select 
              required 
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 p-3 rounded-xl text-sm outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-all font-medium"
              value={formData.responsable_id} 
              onChange={(e) => setFormData({...formData, responsable_id: e.target.value})}
            >
              <option value="" className="text-slate-400">Seleccione un profesional...</option>
              {responsables.map(r => <option key={r.id} value={r.id} className="text-slate-800 font-bold">{r.nombre_completo}</option>)}
            </select>
          </div>

          {/* ESTADO CONTROL DE CALIDAD QA (INCIDENCIA: Solo conforme y rechazado) */}
          <div className="flex flex-col space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Estado de Control (QA) *</label>
            <select 
              className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-sm outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-all font-bold text-slate-800"
              value={formData.qa} 
              onChange={(e) => setFormData({...formData, qa: e.target.value})}
            >
              <option value="OK" className="text-green-600 font-bold">conforme</option>
              <option value="NO" className="text-red-600 font-bold">rechazado</option>
            </select>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100">
          <button 
            type="submit" 
            disabled={!codigoGenerated || loading} 
            className="w-full bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-3.5 rounded-xl shadow-sm transition-all transform active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2 uppercase tracking-wider text-xs"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={14} /> REGISTRANDO LOTE...
              </>
            ) : (
              'Ingresar Lote Maestro'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};