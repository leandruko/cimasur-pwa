import { db } from '../db';

export const generateCode = async (prefijo: string, tabla: 'bases' | 'fabricaciones') => {
  // 1. Obtener la fecha en formato YYYYMMDD
  const hoy = new Date();
  const yyyy = hoy.getFullYear();
  const mm = String(hoy.getMonth() + 1).padStart(2, '0');
  const dd = String(hoy.getDate()).padStart(2, '0');
  const fechaStr = `${yyyy}${mm}${dd}`;

  let totalHoy = 0;

  // 2. Contar cuántos registros van hoy en esa tabla para hacer el correlativo
  if (tabla === 'fabricaciones') {
    const records = await db.fabricaciones
      .filter(f => typeof f.codigo_lote === 'string' && f.codigo_lote.includes(fechaStr))
      .toArray();
    totalHoy = records.length;
  } else if (tabla === 'bases') {
    const records = await db.bases
      .filter(b => typeof b.codigo === 'string' && b.codigo.includes(fechaStr))
      .toArray();
    totalHoy = records.length;
  }

  // 3. Sumar 1 y asegurar que tenga 3 dígitos (001, 002, 015, etc.)
  const correlativo = String(totalHoy + 1).padStart(3, '0');
  
  // 4. Retornar el código formateado
  return `${prefijo}-${fechaStr}-${correlativo}`;
};