// src/lib/db.ts
import Dexie, { type Table } from 'dexie';

export class CimasurDB extends Dexie {
  tipo_base!: Table<any, string>;
  categoria_producto!: Table<any, string>;
  perfiles!: Table<any, string>;
  bases!: Table<any, string>;
  fabricaciones!: Table<any, string>;
  almacenamientos!: Table<any, string>;
  etiquetados!: Table<any, string>;
  ventas!: Table<any, string>;
  reclamos!: Table<any, string>;

  constructor() {
    super('CimasurDB');
    this.version(1).stores({
      tipo_base: 'id, nombre, prefijo',
      categoria_producto: 'id, nombre, prefijo',
      perfiles: 'id, nombre_completo, cargo, rol',
      bases: 'codigo, tipo_id, proveedor', 
      fabricaciones: 'codigo_lote, base_salina_id, categoria_id',
      almacenamientos: 'lote_id, ubicacion',
      etiquetados: 'lote_id, qa',
      ventas: 'id, lote_id, cliente',
      reclamos: 'id, lote_id, estado'
    });
  }
}

// ✅ EL FIX: Solo inicializamos si estamos en el navegador (client-side)
// Si estamos en el servidor (Vercel Build), exportamos un objeto vacío o null
export const db = typeof window !== 'undefined' 
  ? new CimasurDB() 
  : {} as CimasurDB;