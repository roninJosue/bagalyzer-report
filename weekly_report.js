
import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
import { generateWeeklySalesReportContent } from './src/services/report_logic.js';
import { RUTA_VENTAS_CSV, RUTA_REPORTE_SEMANAL, RUTA_LISTA } from './src/config.js';

const generateWeeklySalesReport = async () => {
  const gainsListPath = RUTA_LISTA;
  const salesCsvPath = RUTA_VENTAS_CSV;
  const outputFile = RUTA_REPORTE_SEMANAL;

  try {
    const reportContent = await generateWeeklySalesReportContent(salesCsvPath, gainsListPath);
    if (reportContent === null) return;

    fs.writeFileSync(outputFile, reportContent, 'utf-8');
    console.log(`Report saved successfully to ${outputFile}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
  }
};

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  generateWeeklySalesReport();
}
