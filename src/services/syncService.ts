import { supabase } from '../lib/supabase';
import { db } from '../lib/db';

export const pullMasterData = async () => {
  if (!navigator.onLine) {
    return;
  }


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

      }
    } catch (error) {

    }
  };

  // Ejecutamos todas las sincronizaciones en paralelo para mayor velocidad
  await Promise.all([
    syncTable('tipo_base', db.tipo_base),
    syncTable('categoria_producto', db.categoria_producto),
    syncTable('perfiles', db.perfiles)
  ]);
};