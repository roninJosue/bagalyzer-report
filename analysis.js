import { generateAnalysisReport } from './src/services/analysis_logic.js';
import { escribirArchivo } from './src/utils/file_handler.js';
import { RUTA_VENTAS_CSV, RUTA_LISTA, RUTA_REPORTE_ANALISIS } from './src/config.js';

/**
 * Script orquestador para generar el reporte de análisis de ventas.
 */
const runAnalysis = async () => {
  try {
    console.log('Iniciando análisis de ventas...');
    
    const reportContent = await generateAnalysisReport(RUTA_VENTAS_CSV, RUTA_LISTA);
    
    escribirArchivo(RUTA_REPORTE_ANALISIS, reportContent);
    
    console.log(`Análisis completado. Reporte guardado en: ${RUTA_REPORTE_ANALISIS}`);

  } catch (error) {
    console.error(`Error durante el análisis de ventas: ${error.message}`);
  }
};

runAnalysis();
