import path from 'path';
import { writeFile } from './src/utils/file_handler.js';
import { generateChartFile } from './src/services/chart_logic.js';
import { PATH_SALES_CSV, PATH_LIST, PATH_CHARTS } from './src/config.js';
import { getWeeklySalesData } from './src/services/report_logic.js';

const createCharts = async () => {
  try {
    console.log(`Reading data from: ${PATH_SALES_CSV}`);
    const weeklySales = await getWeeklySalesData(PATH_SALES_CSV, PATH_LIST);

    if (!weeklySales || weeklySales.size === 0) {
      console.error('Error: No weekly sales data found.');
      return;
    }

    console.log(`Found data for ${weeklySales.size} days in the report.`);

    for (const [dateKey, dailySales] of weeklySales.entries()) {
      const chartData = [];

      // Format date for display (YYYY-MM-DD to MM/DD/YYYY)
      const [year, month, day] = dateKey.split('-');
      const formattedDate = `${month}/${day}/${year}`;

      for (const [product, saleData] of dailySales.entries()) {
        const productLabel = `${product}\n(${saleData.quantity})`;
        chartData.push({ product: productLabel, total: saleData.price, type: 'Price' });
        chartData.push({ product: productLabel, total: saleData.profit, type: 'Profit' });
      }

      const dateForFilename = formattedDate.replace(/\//g, '-');
      const outputPath = path.join(PATH_CHARTS, `chart_report_${dateForFilename}.svg`);
      const chartTitle = formattedDate;

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
