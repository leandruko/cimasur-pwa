export type Rol = 'Admin' | 'Tecnico' | 'Auditor';

export interface Perfil {
  id: string;
  email: string;
  rol: Rol;
}

export interface Orden {
  id: string; // UUID
  cliente: string;
  categoria_id: string;
  tecnico_id: string;
  estado: 'pendiente' | 'completado' | 'reclamo';
  created_at: string;
  last_sync_at?: string;
  synced: 0 | 1; // 0: Solo en IndexedDB, 1: Sincronizado con Supabase
}