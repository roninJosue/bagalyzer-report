import path from 'path';
import { readFile, writeFile } from './src/utils/file_handler.js';
import { parseReportData } from './src/services/parser_logic.js';
import { generateChartFile } from './src/services/chart_logic.js';
import { PATH_WEEKLY_REPORT, PATH_CHARTS } from './src/config.js';

const createCharts = async () => {
  try {
    console.log(`Reading report from: ${PATH_WEEKLY_REPORT}`);
    const reportContent = readFile(PATH_WEEKLY_REPORT);

    if (!reportContent) {
      console.error('Error: The weekly report is empty or could not be read.');
      return;
    }

    const dailyData = parseReportData(reportContent);
    console.log(`Found data for ${dailyData.length} days in the report.`);

    for (const day of dailyData) {
      const chartData = [];
      day.salesData.forEach((sale) => {
        const productLabel = `${sale.product}\n(${sale.quantity})`;
        chartData.push({ product: productLabel, total: sale.price, type: 'Price' });
        chartData.push({ product: productLabel, total: sale.ganancia, type: 'Profit' });
      });

      const dateForFilename = day.date.replace(/\//g, '-');
      const outputPath = path.join(PATH_CHARTS, `chart_report_${dateForFilename}.svg`);
      const chartTitle = day.date;

      console.log(`Generating chart for ${chartTitle}...`);
      const svgContent = await generateChartFile(chartData, outputPath, chartTitle);

      writeFile(outputPath, svgContent);
    }

    console.log('\nAll charts have been successfully generated in the output folder.');
  } catch (error) {
    console.error(`Error during chart generation: ${error.message}`);
  }
};

createCharts();
