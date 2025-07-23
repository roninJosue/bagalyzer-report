import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
import { getWeeklySalesData } from './src/services/report_logic.js';
import {
  formatWeeklyReportAsText,
  formatWeeklyReportAsHtml,
} from './src/services/report_formatter.js';
import { PATH_SALES_CSV, PATH_WEEKLY_REPORT, PATH_LIST } from './src/config.js';

/**
 * Generates a weekly sales report in the specified format
 * @param {string} format - Format of the report ('text' or 'html')
 */
const generateWeeklySalesReport = async (format = 'text') => {
  const gainsListPath = PATH_LIST;
  const salesCsvPath = PATH_SALES_CSV;

  // Determine output file path based on format
  let outputFile = PATH_WEEKLY_REPORT;
  if (format === 'html') {
    const dir = path.dirname(PATH_WEEKLY_REPORT);
    const filename = path.basename(PATH_WEEKLY_REPORT, path.extname(PATH_WEEKLY_REPORT));
    outputFile = path.join(dir, `${filename}.html`);
  }

  try {
    console.log('Processing weekly sales data...');
    const weeklySales = await getWeeklySalesData(salesCsvPath, gainsListPath);

    console.log(`Generating ${format} report...`);
    let reportContent;

    if (format === 'html') {
      reportContent = formatWeeklyReportAsHtml(weeklySales);
    } else {
      reportContent = formatWeeklyReportAsText(weeklySales);
    }

    fs.writeFileSync(outputFile, reportContent, 'utf-8');
    console.log(`Report saved successfully to ${outputFile}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
  }
};

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  // Check if format is specified in command line arguments
  const args = process.argv.slice(2);
  const format = args[0] === 'html' ? 'html' : 'text';

  generateWeeklySalesReport(format);
}
