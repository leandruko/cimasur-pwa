import { jsPDF } from 'jspdf';
import dayjs from 'dayjs';

export const generateTrazabilidadPDF = (orden: any) => {
  const doc = new jsPDF();
  const blueIndustrial = '#2563eb';

  // --- PÁGINA 1: RESUMEN TÉCNICO ---
  doc.setFillColor(30, 41, 59); // Slate 800
  doc.rect(0, 0, 210, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.text('CIMASUR', 15, 25);
  doc.setFontSize(10);
  doc.text('REPORTE DE TRAZABILIDAD INDUSTRIAL', 15, 32);

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(14);
  doc.text('Detalles de la Orden', 15, 55);
  doc.line(15, 57, 195, 57);

  doc.setFontSize(10);
  doc.text(`ID de Control: ${orden.id}`, 15, 70);
  doc.text(`Cliente: ${orden.cliente}`, 15, 80);
  doc.text(`Fecha Registro: ${dayjs(orden.created_at).format('DD/MM/YYYY HH:mm')}`, 15, 90);
  doc.text(`Estado: ${orden.estado.toUpperCase()}`, 15, 100);

  // Sección de Observaciones
  doc.setFontSize(12);
  doc.text('Observaciones del Laboratorio:', 15, 120);
  doc.setFontSize(10);
  const splitTitle = doc.splitTextToSize(orden.detalles?.observaciones || 'Sin observaciones registradas.', 180);
  doc.text(splitTitle, 15, 130);

  // --- PÁGINA 2: HISTORIAL Y FIRMAS ---
  doc.addPage();
  doc.setFontSize(14);
  doc.text('Validación y Firmas', 15, 20);
  doc.line(15, 22, 195, 22);

  // Espacios para firmas
  doc.line(15, 80, 80, 80);
  doc.text('Firma Técnico Responsable', 15, 85);
  doc.text(`ID: ${orden.tecnico_id.slice(0, 8)}`, 15, 90);

  doc.line(120, 80, 185, 80);
  doc.text('Sello de Laboratorio', 120, 85);

  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(`Generado automáticamente por Cimasur PWA el ${dayjs().format('DD/MM/YYYY HH:mm')}`, 15, 280);

  doc.save(`Trazabilidad_Cimasur_${orden.id.slice(0, 8)}.pdf`);
};