import React, { useState } from 'react';
import { db } from '../lib/db';
import { v4 as uuidv4 } from 'uuid';

export const OrdenForm = ({ tecnicoId }: { tecnicoId: string }) => {
  const [cliente, setCliente] = useState('');
  const [categoria, setCategoria] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [enviando, setEnviando] = useState(false);

  const guardarLocal = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnviando(true);

    const nuevaOrden = {
      id: uuidv4(), // Generamos el UUID en el cliente para evitar colisiones
      cliente,
      tecnico_id: tecnicoId,
      estado: 'pendiente' as const,
      detalles: { observaciones, categoria },
      created_at: new Date().toISOString(),
      synced: 0 as const,
      dirty: 1 as const
    };

    try {
      await db.ordenes.add(nuevaOrden);
      // Limpiar formulario
      setCliente('');
      setObservaciones('');
      alert('Orden guardada localmente. Se sincronizará al detectar conexión.');
      window.location.href = '/dashboard';
    } catch (error) {
      console.error('Error al guardar:', error);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <form onSubmit={guardarLocal} className="max-w-2xl bg-slate-900 p-8 rounded-xl border border-slate-800 shadow-2xl space-y-6">
      <div className="border-b border-slate-800 pb-4">
        <h2 className="text-xl font-bold text-blue-400">Datos de Trazabilidad</h2>
        <p className="text-slate-400 text-sm">Ingrese la información del equipo o proceso.</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">Cliente / Laboratorio</label>
        <input 
          type="text" 
          required
          value={cliente}
          onChange={(e) => setCliente(e.target.value)}
          className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-600 outline-none"
          placeholder="Nombre de la entidad"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Categoría</label>
          <select 
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-600 outline-none"
          >
            <option value="">Seleccionar...</option>
            <option value="instrumentacion">Instrumentación</option>
            <option value="quimica">Química</option>
            <option value="muestreo">Muestreo</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">Observaciones Técnicas</label>
        <textarea 
          rows={4}
          value={observaciones}
          onChange={(e) => setObservaciones(e.target.value)}
          className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-600 outline-none"
          placeholder="Detalle el estado o hallazgos..."
        ></textarea>
      </div>

      <button 
        type="submit" 
        disabled={enviando}
        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg transition-all shadow-lg shadow-blue-900/20 disabled:bg-slate-700"
      >
        {enviando ? 'Procesando...' : 'Registrar Orden'}
      </button>
    </form>
  );
};