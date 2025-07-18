import path from 'path';
import { leerArchivo, escribirArchivo } from './src/utils/file_handler.js';
import { parseReportData } from './src/services/parser_logic.js';
import { generateChartFile } from './src/services/chart_logic.js';
import { RUTA_REPORTE_SEMANAL, RUTA_GRAFICOS } from './src/config.js';

const createCharts = async () => {
  try {
    console.log(`Leyendo reporte desde: ${RUTA_REPORTE_SEMANAL}`);
    const reportContent = leerArchivo(RUTA_REPORTE_SEMANAL);

    if (!reportContent) {
      console.error('Error: El reporte semanal está vacío o no se pudo leer.');
      return;
    }

    const dailyData = parseReportData(reportContent);
    console.log(`Se encontraron datos de ${dailyData.length} días en el reporte.`);

    for (const day of dailyData) {
      const chartData = [];
      day.salesData.forEach(sale => {
        const productLabel = `${sale.product}\n(${sale.quantity})`;
        chartData.push({ product: productLabel, total: sale.price, type: 'Precio' });
        chartData.push({ product: productLabel, total: sale.ganancia, type: 'Ganancia' });
      });

      const dateForFilename = day.date.replace(/\//g, '-');
      const outputPath = path.join(RUTA_GRAFICOS, `reporte_grafico_${dateForFilename}.svg`);
      const chartTitle = day.date;

      console.log(`Generando gráfico para ${chartTitle}...`);
      const svgContent = await generateChartFile(chartData, outputPath, chartTitle);

      escribirArchivo(outputPath, svgContent);
    }

    console.log('\nTodos los gráficos han sido generados exitosamente en la carpeta output.');

  } catch (error) {
    console.error(`Error durante la generación de gráficos: ${error.message}`);
  }
};

createCharts();
