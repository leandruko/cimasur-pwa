import { db } from '../db';
import { supabase } from '../supabase';

/**
 * Función genérica para generar códigos con formato PREFIJO-YYYYMM-00X
 */
export const generateCode = async (prefijo: string, tabla: 'bases' | 'fabricaciones') => {
  const hoy = new Date();
  const yyyy = hoy.getFullYear();
  const mm = String(hoy.getMonth() + 1).padStart(2, '0');
  const periodoStr = `${yyyy}${mm}`; // Ejemplo: 202605

  let totalPeriodo = 0;

  try {
    if (tabla === 'fabricaciones') {
      // Consultamos a Supabase cuántos lotes se han creado en este mes
      const { data, error } = await supabase
        .from('fabricaciones')
        .select('codigo_lote')
        .ilike('codigo_lote', `%-${periodoStr}-%`);

      if (!error && data) {
        totalPeriodo = data.length;
      }
    } else if (tabla === 'bases') {
      // Consultamos a Supabase cuántas bases se han creado en este mes
      const { data, error } = await supabase
        .from('bases')
        .select('codigo')
        .ilike('codigo', `%-${periodoStr}-%`);

      if (!error && data) {
        totalPeriodo = data.length;
      }
    }
  } catch (err) {
    console.error("Error consultando correlativo en la nube, usando fallback local:", err);
  }

  // Generamos el correlativo real basado en lo que hay en producción
  const correlativo = String(totalPeriodo + 1).padStart(3, '0');
  
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