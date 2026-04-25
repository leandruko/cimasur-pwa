import * as XLSX from 'xlsx';
import dayjs from 'dayjs';

export const exportOrdenesToExcel = (ordenes: any[]) => {
  // 1. Formatear datos para el Excel
  const dataMap = ordenes.map(o => ({
    "ID Orden": o.id.slice(0, 8),
    "Cliente": o.cliente,
    "Categoría": o.detalles?.categoria || 'N/A',
    "Estado": o.estado.toUpperCase(),
    "Fecha Creación": dayjs(o.created_at).format('DD/MM/YYYY HH:mm'),
    "Sincronizado": o.synced === 1 ? 'SÍ' : 'NO'
  }));

  // 2. Crear libro y hoja
  const worksheet = XLSX.utils.json_to_sheet(dataMap);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Órdenes");

  // 3. Descargar
  XLSX.writeFile(workbook, `Cimasur_Reporte_${dayjs().format('YYYY-MM-DD')}.xlsx`);
};