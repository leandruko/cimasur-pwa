import dayjs from 'dayjs';

export const exportOrdenesToExcel = async (ordenes: any[]) => {
  // 1. Evitar que corra en el servidor
  if (typeof window === 'undefined') return;

  // 2. Importación dinámica (esto no rompe el build)
  const XLSX = await import('xlsx');

  const dataMap = ordenes.map(o => ({
    "ID Orden": o.id.slice(0, 8),
    "Cliente": o.cliente,
    "Categoría": o.detalles?.categoria || 'N/A',
    "Estado": o.estado.toUpperCase(),
    "Fecha Creación": dayjs(o.created_at).format('DD/MM/YYYY HH:mm'),
    "Sincronizado": o.synced === 1 ? 'SÍ' : 'NO'
  }));

  const worksheet = XLSX.utils.json_to_sheet(dataMap);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Órdenes");

  XLSX.writeFile(workbook, `Cimasur_Reporte_${dayjs().format('YYYY-MM-DD')}.xlsx`);
};