import dayjs from 'dayjs';

/**
 * Genera un código tipo SALI-202604-001
 * @param prefijo Prefijo de la materia prima (SALI, ALCO, etc)
 * @param correlativo Número secuencial (debe venir de contar registros actuales)
 */
export const generarCodigoBase = (prefijo: string, correlativo: number) => {
  const fecha = dayjs().format('YYYYMM');
  const nro = String(correlativo).padStart(3, '0');
  return `${prefijo.toUpperCase()}-${fecha}-${nro}`;
};