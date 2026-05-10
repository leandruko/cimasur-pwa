import { db } from '../db';

/**
 * Función genérica para generar códigos con formato PREFIJO-YYYYMMDD-00X
 */
export const generateCode = async (prefijo: string, tabla: 'bases' | 'fabricaciones') => {
  const hoy = new Date();
  const yyyy = hoy.getFullYear();
  const mm = String(hoy.getMonth() + 1).padStart(2, '0');
  const dd = String(hoy.getDate()).padStart(2, '0');
  const fechaStr = `${yyyy}${mm}${dd}`;

  let totalHoy = 0;

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

  const correlativo = String(totalHoy + 1).padStart(3, '0');
  return `${prefijo}-${fechaStr}-${correlativo}`;
};

/**
 * ALIAS para BaseForm (para que no te de error el import que ya tienes)
 */
export const generarCodigoBase = async (prefijo: string) => {
  return await generateCode(prefijo, 'bases');
};

/**
 * ALIAS para FabricacionForm
 */
export const generarCodigoLote = async (prefijo: string) => {
  return await generateCode(prefijo, 'fabricaciones');
};