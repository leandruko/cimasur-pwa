import { useEffect } from 'react';
import { db } from '../lib/db';
import { supabase } from '../lib/supabase';

export const SyncManager = () => {
  useEffect(() => {
    const syncSubida = async () => {
      if (!navigator.onLine) return;

      const pendientes = await db.ordenes.where('dirty').equals(1).toArray();
      
      for (const orden of pendientes) {
        // Separamos los campos de Dexie de los de Supabase
        const { dirty, synced, ...datosParaSupabase } = orden;

        const { error } = await supabase
          .from('ordenes')
          .upsert(datosParaSupabase);

        if (!error) {
          await db.ordenes.update(orden.id, { dirty: 0, synced: 1 });
          console.log(`Orden ${orden.id} sincronizada.`);
        }
      }
    };

    // Escuchar cambios de red
    window.addEventListener('online', syncSubida);
    // Ejecutar una vez al cargar por si ya estamos online
    syncSubida();

    return () => window.removeEventListener('online', syncSubida);
  }, []);

  return null; // Este componente no renderiza nada
};