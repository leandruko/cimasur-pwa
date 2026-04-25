import Dexie, { type Table } from 'dexie';
import type { Orden } from '../types/database';

// Extendemos el tipo Orden para incluir meta-datos de sincronización local
export interface LocalOrden extends Orden {
  synced: 0 | 1; 
  dirty: 0 | 1; // 1 si ha sido modificada localmente y no se ha subido
}

export class CimasurOfflineDB extends Dexie {
  ordenes!: Table<LocalOrden>;
  categorias!: Table<{ id: string; nombre: string }>;

  constructor() {
    super('CimasurLocalStorage');
    
    // Definimos los índices. 
    // El id es el UUID de Supabase. indexedDB buscará por id y estado de sincronización.
    this.version(1).stores({
      ordenes: 'id, tecnico_id, estado, synced, dirty',
      categorias: 'id, nombre'
    });
  }
}

export const db = new CimasurOfflineDB();