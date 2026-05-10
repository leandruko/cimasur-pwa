import { useEffect } from 'react';
import { db } from '../lib/db';
import { supabase } from '../lib/supabase';

// Tablas que el usuario crea offline y deben subirse
const TABLES_TO_PUSH = ['bases', 'fabricaciones', 'etiquetados', 'almacenamientos', 'ventas', 'reclamos'];
// Tablas maestras que vienen de la nube y deben bajarse
const MASTER_TABLES = ['perfiles', 'tipo_base', 'categoria_producto'];

export const SyncManager = () => {
  useEffect(() => {
    
    // 1. FUNCIÓN PARA BAJAR DATOS (PULL)
    // Esto garantiza que los responsables y tipos de base aparezcan en los formularios
    const pullMasterData = async () => {
      if (!navigator.onLine) return;
      
      console.log('🔄 Sincronizando datos maestros desde Supabase...');
      
      for (const table of MASTER_TABLES) {
        try {
          const { data, error } = await supabase.from(table).select('*');
          if (data && !error) {
            // @ts-ignore
            await db[table].clear(); // Limpiamos para evitar datos obsoletos
            // @ts-ignore
            await db[table].bulkPut(data); // bulkPut actualiza o inserta sin dar error
          }
        } catch (err) {
          console.error(`Error bajando tabla ${table}:`, err);
        }
      }
      console.log('✅ Datos maestros (Responsables, Tipos, Categorías) actualizados.');
    };

    // 2. FUNCIÓN PARA SUBIR DATOS (PUSH)
    // Envía los registros marcados como "dirty" (pendientes) a la nube
    const pushOfflineData = async () => {
      if (!navigator.onLine) return;

      console.log('📤 Subiendo cambios locales pendientes...');

      for (const tableName of TABLES_TO_PUSH) {
        try {
          // @ts-ignore
          const pending = await db[tableName].where('dirty').equals(1).toArray();
          
          for (const item of pending) {
            // Extraemos dirty y synced para no enviarlos a las columnas de Supabase
            const { dirty, synced, ...payload } = item;
            
            const { error } = await supabase.from(tableName).upsert(payload);

            if (!error) {
              // Identificamos la PK correcta para actualizar el estado local
              const pk = item.id || item.codigo || item.codigo_lote || item.lote_id;
              // @ts-ignore
              await db[tableName].update(pk, { dirty: 0, synced: 1 });
            } else {
              console.error(`Error subiendo item a ${tableName}:`, error.message);
            }
          }
        } catch (err) {
          console.error(`Error en push para ${tableName}:`, err);
        }
      }
    };

    // 3. EJECUCIÓN COORDINADA
    const runFullSync = async () => {
      await pullMasterData(); // Primero bajamos para que los formularios funcionen
      await pushOfflineData(); // Luego subimos lo acumulado
    };

    // Escuchar cuando el navegador recupera internet
    window.addEventListener('online', runFullSync);
    
    // Ejecución inicial automática al cargar la App
    runFullSync();

    return () => window.removeEventListener('online', runFullSync);
  }, []);

  return null; // Componente lógico, no renderiza nada visualmente
};