import { useEffect } from 'react';
import { db } from '../lib/db';
import { supabase } from '../lib/supabase';

const TABLES_TO_SYNC = ['bases', 'fabricaciones', 'etiquetados', 'almacenamientos', 'ventas', 'reclamos'];

export const SyncManager = () => {
  useEffect(() => {
    const syncData = async () => {
      if (!navigator.onLine) return;

      for (const tableName of TABLES_TO_SYNC) {
        // @ts-ignore - Acceso dinámico a tablas de Dexie
        const pending = await db[tableName].where('dirty').equals(1).toArray();
        
        for (const item of pending) {
          const { dirty, synced, ...payload } = item;
          const { error } = await supabase.from(tableName).upsert(payload);

          if (!error) {
            // @ts-ignore
            await db[tableName].update(item.id, { dirty: 0, synced: 1 });
          }
        }
      }
    };

    window.addEventListener('online', syncData);
    syncData(); // Ejecución inicial
    return () => window.removeEventListener('online', syncData);
  }, []);

  return null;
};