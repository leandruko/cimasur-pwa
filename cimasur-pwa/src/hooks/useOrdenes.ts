import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';

export const useOrdenes = () => {
  const ordenes = useLiveQuery(
    () => db.ordenes.orderBy('created_at').reverse().toArray()
  );

  const stats = useLiveQuery(async () => {
    const all = await db.ordenes.toArray();
    return {
      total: all.length,
      pendientes: all.filter(o => o.estado === 'pendiente').length,
      sincronizadas: all.filter(o => o.synced === 1).length
    };
  });

  return { ordenes, stats, loading: ordenes === undefined };
};