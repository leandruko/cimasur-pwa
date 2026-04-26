import { useEffect } from 'react';
import { db } from '../lib/db';
import { supabase } from '../lib/supabase';

const TABLES_TO_SYNC = ['bases', 'fabricaciones', 'etiquetados', 'almacenamientos', 'ventas', 'reclamos'];

export const SyncManager = () => {
  useEffect(() => {

    const syncPerfiles = async () => {
      if (!navigator.onLine) return;
      
      const { data, error } = await supabase.from('perfiles').select('*');
      if (data && !error) {
        // Actualizamos la tabla local de perfiles con los datos frescos de Supabase
        await db.perfiles.clear();
        await db.perfiles.bulkAdd(data);
      }
    };

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