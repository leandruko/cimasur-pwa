// src/lib/db.ts
import Dexie, { type Table } from 'dexie';

export class CimasurDB extends Dexie {
  // Declaramos las tablas maestras (las que vienen de Supabase)
  tipo_base!: Table<any, string>;
  categoria_producto!: Table<any, string>;
  perfiles!: Table<any, string>;
  
  // Declaramos las tablas transaccionales (las que creamos offline)
  bases!: Table<any, string>;
  fabricaciones!: Table<any, string>;
  almacenamientos!: Table<any, string>;
  etiquetados!: Table<any, string>;
  ventas!: Table<any, string>;
  reclamos!: Table<any, string>;

  constructor() {
    super('CimasurDB');
    this.version(1).stores({
      // PK (Primary Key) es el primer valor
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

export const db = new CimasurDB();