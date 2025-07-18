
import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
import { generateWeeklySalesReportContent } from './src/services/report_logic.js';
import { PATH_SALES_CSV, PATH_WEEKLY_REPORT, PATH_LIST } from './src/config.js';

const generateWeeklySalesReport = async () => {
  const gainsListPath = PATH_LIST;
  const salesCsvPath = PATH_SALES_CSV;
  const outputFile = PATH_WEEKLY_REPORT;

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
