import Dexie, { type Table } from 'dexie';

interface OfflineMeta {
  synced: 0 | 1;
  dirty: 0 | 1;
}

export class CimasurOfflineDB extends Dexie {
  tipo_base!: Table<any>;
  categoria_producto!: Table<any>;
  perfiles!: Table<any>; 
  bases!: Table<any & OfflineMeta>;
  fabricaciones!: Table<any & OfflineMeta>;
  etiquetados!: Table<any & OfflineMeta>;
  almacenamientos!: Table<any & OfflineMeta>;
  ventas!: Table<any & OfflineMeta>;
  reclamos!: Table<any & OfflineMeta>;

  constructor() {
    super('CimasurLocalStorage');
  
    this.version(10).stores({
      tipo_base: 'id, nombre',
      categoria_producto: 'id, nombre',
      perfiles: 'id, cargo, nombre_completo', // <--- UNA SOLA VEZ
      bases: 'codigo, tipo_id, responsable_id, synced, dirty',
      fabricaciones: 'codigo_lote, base_salina_id, categoria_id, synced, dirty',
      almacenamientos: 'lote_id, responsable_id, synced, dirty',
      etiquetados: 'lote_id, qa, synced, dirty',
      ventas: 'id, lote_id, cliente, synced, dirty',
      reclamos: 'id, lote_id, estado, synced, dirty'
    });
  }
}

export const db = new CimasurOfflineDB();