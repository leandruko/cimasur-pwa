import { db } from '../db';

/**
 * Función genérica para generar códigos con formato PREFIJO-YYYYMM-00X
 */
export const generateCode = async (prefijo: string, tabla: 'bases' | 'fabricaciones') => {
  const hoy = new Date();
  const yyyy = hoy.getFullYear();
  const mm = String(hoy.getMonth() + 1).padStart(2, '0');
  
  // 👉 INCIDENCIA SOLUCIONADA: Ahora solo considera Año y Mes (6 dígitos en total)
  const periodoStr = `${yyyy}${mm}`; 

  let totalPeriodo = 0;

  // Modificamos el filtro para buscar los registros del mes en curso
  if (tabla === 'fabricaciones') {
    const records = await db.fabricaciones
      .filter(f => typeof f.codigo_lote === 'string' && f.codigo_lote.includes(`-${periodoStr}-`))
      .toArray();
    totalPeriodo = records.length;
  } else if (tabla === 'bases') {
    const records = await db.bases
      .filter(b => typeof b.codigo === 'string' && b.codigo.includes(`-${periodoStr}-`))
      .toArray();
    totalPeriodo = records.length;
  }

  // Genera el correlativo mensual de 3 dígitos (001, 002, etc.)
  const correlativo = String(totalPeriodo + 1).padStart(3, '0');
  
  // Retorna el formato oficial: SAL-202512-001 o CB-202605-001
  return `${prefijo}-${periodoStr}-${correlativo}`;
};

/**
 * ALIAS para BaseForm
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