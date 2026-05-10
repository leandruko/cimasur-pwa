import { supabase } from '../lib/supabase';
import { db } from '../lib/db';

export const pullMasterData = async () => {
  if (!navigator.onLine) {
    console.warn('Sincronización abortada: El dispositivo está offline.');
    return;
  }

  console.log('🔄 Iniciando sincronización de datos maestros...');

  // Función interna para sincronizar una tabla específica de forma segura
  const syncTable = async (tableName: string, dexieTable: any) => {
    try {
      const { data, error } = await supabase.from(tableName).select('*');
      
      if (error) throw error;

      if (data) {
        // Limpiamos los datos locales antiguos para que coincidan 100% con la nube
        await dexieTable.clear();
        // Insertamos los nuevos
        await dexieTable.bulkPut(data);
        console.log(`✅ Tabla [${tableName}] sincronizada: ${data.length} registros.`);
      }
    } catch (error) {
      console.error(`❌ Error sincronizando tabla [${tableName}]:`, error);
    }
  };

  // Ejecutamos todas las sincronizaciones en paralelo para mayor velocidad
  await Promise.all([
    syncTable('tipo_base', db.tipo_base),
    syncTable('categoria_producto', db.categoria_producto),
    syncTable('perfiles', db.perfiles)
  ]);

  console.log('🏁 Proceso de sincronización finalizado.');
};