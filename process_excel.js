import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
import { processExcelToCsv } from './src/services/excel_processor_logic.js';
import {RUTA_VENTAS_CSV} from './src/config.js';

/**
 * Script para procesar un archivo Excel y convertirlo a CSV.
 * Esta versión mantiene compatibilidad con versiones anteriores pero
 * utiliza la lógica centralizada en excel_processor_logic.js.
 */
const processExcel = async () => {
  const today = new Date();
  const day = String(today.getDate()).padStart(2, '0');
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const year = today.getFullYear();
  const dateStr = `${day}-${month}-${year}`;
  const excelFilename = `ventas_${dateStr}.xlsx`;
  const csvFilename = RUTA_VENTAS_CSV

  if (!fs.existsSync(excelFilename)) {
    console.error(`Error: File '${excelFilename}' not found. Please run the download script first.`);
    return;
  }

  try {
    // Usar la función centralizada de excel_processor_logic.js
    await processExcelToCsv(excelFilename, csvFilename, 'Ventas');

    console.log(`Successfully converted the 'Ventas' sheet from '${excelFilename}' to '${csvFilename}'.`);
  } catch (error) {
    console.error(`An error occurred: ${error}`);
  }
};

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  processExcel();
}
