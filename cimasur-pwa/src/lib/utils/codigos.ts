// src/lib/utils/codigos.ts
import dayjs from 'dayjs';
import { db } from '../db';

export const generateCode = async (prefix: string, tableName: 'bases' | 'fabricaciones') => {
  const monthYear = dayjs().format('YYYYMM');
  const baseCode = `${prefix}-${monthYear}`;
  
  // Determinamos el campo de búsqueda según la tabla
  const fieldName = tableName === 'fabricaciones' ? 'codigo_lote' : 'codigo';
  
  // Buscamos en la DB local (Dexie) el último que empiece con ese prefijo
  const lastRecord = await db[tableName]
    .where(fieldName)
    .startsWith(baseCode)
    .last();

  if (lastRecord) {
    const lastCodeValue = lastRecord[fieldName];
    const lastNumber = parseInt(lastCodeValue.split('-').pop() || '0');
    const newNumber = String(lastNumber + 1).padStart(3, '0');
    return `${baseCode}-${newNumber}`;
  }

  return `${baseCode}-001`;
};