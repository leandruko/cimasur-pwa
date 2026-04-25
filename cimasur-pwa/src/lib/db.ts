import Dexie, { type Table } from 'dexie';

// Interfaz genérica para manejo offline
// Usamos 'synced' para saber si ya está en Supabase
// Usamos 'dirty' para saber si hubo cambios locales pendientes de subir
interface OfflineMeta {
  synced: 0 | 1;
  dirty: 0 | 1;
}

export class CimasurOfflineDB extends Dexie {
  // Definimos las tablas basadas en tu SQL
  categorias!: Table<any>;
  bases!: Table<any & OfflineMeta>;
  fabricaciones!: Table<any & OfflineMeta>;
  etiquetados!: Table<any & OfflineMeta>;
  almacenamientos!: Table<any & OfflineMeta>;
  ventas!: Table<any & OfflineMeta>;
  reclamos!: Table<any & OfflineMeta>;

  constructor() {
    super('CimasurLocalStorage');
    
    /**
     * IMPORTANTE:
     * El primer campo es la Llave Primaria (id).
     * Los demás son índices para búsquedas rápidas.
     */
    this.version(2).stores({
      categorias: 'id, prefijo',
      bases: 'id, codigo_base, tecnico_id, synced, dirty',
      fabricaciones: 'id, codigo_lote, base_id, synced, dirty',
      etiquetados: 'id, fabricacion_id, synced, dirty',
      almacenamientos: 'id, fabricacion_id, synced, dirty',
      ventas: 'id, fabricacion_id, synced, dirty',
      reclamos: 'id, fabricacion_id, synced, dirty'
    });
  }
}

export const db = new CimasurOfflineDB();