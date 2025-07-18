import path from 'path';
import { processExcelToCsv } from './src/services/excel_processor_logic.js';
import { PATH_SALES_CSV } from './src/config.js';
import fs from 'fs';

/**
 * Script orquestador para procesar el archivo Excel de ventas descargado.
 */
const runProcessing = async () => {
  try {
    // 1. Determinar el nombre del archivo de entrada basado en la fecha
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = today.getFullYear();
    const excelFilename = `ventas_${day}-${month}-${year}.xlsx`;
    const inputExcelPath = path.join(process.cwd(), 'data', excelFilename);

    console.log(`Buscando el archivo de entrada: ${inputExcelPath}`);

    // Verificar si el archivo de entrada existe
    if (!fs.existsSync(inputExcelPath)) {
        throw new Error(`El archivo de entrada no se encontró en ${inputExcelPath}. Asegúrate de descargarlo primero.`);
    }

    // 2. Definir la hoja a procesar y la ruta de salida
    const sheetName = 'Ventas';
    const outputCsvPath = PATH_SALES_CSV; // De nuestro config

    // 3. Llamar a la lógica de procesamiento, que ahora se encarga de escribir el archivo
    console.log(`Procesando la hoja '${sheetName}' y guardando en ${outputCsvPath}...`);
    await processExcelToCsv(inputExcelPath, outputCsvPath, sheetName);

    console.log(`\nProceso completado. Archivo CSV guardado exitosamente.`);

  } catch (error) {
    // El error ya se loguea en el módulo de lógica, aquí solo mostramos un mensaje final.
    console.error(`\nEl procesamiento del archivo Excel falló: ${error.message}`);
  }
};

runProcessing();
