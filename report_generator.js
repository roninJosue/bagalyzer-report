import path from 'path';
import { generateProductReportContent } from './src/services/report_logic.js';
import { escribirArchivo } from './src/utils/file_handler.js';
import {RUTA_REPORTE_CONSOLIDADO, RUTA_REPORTE_SEMANAL, RUTA_VENTAS_CSV} from './src/config.js';

const runReport = async () => {
  // La ruta del archivo de entrada sigue hardcodeada por ahora,
  // ya que no estaba en la configuración original.
  // Idealmente, también estaría en config.js
  const salesFile = RUTA_VENTAS_CSV;
  const outputFile = RUTA_REPORTE_CONSOLIDADO; // Usamos la ruta del config

  try {
    console.log(`Leyendo datos de: ${salesFile}`);
    const reportContent = await generateProductReportContent(salesFile);

    console.log(`Generando reporte en: ${outputFile}`);
    escribirArchivo(outputFile, reportContent);

    console.log('Reporte generado exitosamente.');
  } catch (error) {
    console.error(`Error al generar el reporte: ${error.message}`);
  }
};

runReport();
