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
  
    this.version(4).stores({
      tipo_base: 'id, nombre',
      categoria_producto: 'id, nombre',
      perfiles: 'id, rol, nombre_completo',
      bases: 'codigo, tipo_id, responsable_id, synced',
      fabricaciones: 'codigo_lote, base_salina_id, categoria_id, synced',
      almacenamientos: 'lote_id, responsable_id, synced',
      etiquetados: 'lote_id, qa, synced',
      ventas: 'id, lote_id, cliente, synced',
      reclamos: 'id, lote_id, estado, synced'
    });
  }
}

export const db = new CimasurOfflineDB();