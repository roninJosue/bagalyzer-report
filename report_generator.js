import path from 'path';
import { generateProductReportContent } from './src/services/report_logic.js';
import { writeFile } from './src/utils/file_handler.js';
import {PATH_CONSOLIDATED_REPORT, PATH_WEEKLY_REPORT, PATH_SALES_CSV} from './src/config.js';

const runReport = async () => {
  // The input file path is still hardcoded for now,
  // as it wasn't in the original configuration.
  // Ideally, it would also be in config.js
  const salesFile = PATH_SALES_CSV;
  const outputFile = PATH_CONSOLIDATED_REPORT; // Using the path from config

  try {
    console.log(`Reading data from: ${salesFile}`);
    const reportContent = await generateProductReportContent(salesFile);

    console.log(`Generating report at: ${outputFile}`);
    writeFile(outputFile, reportContent);

    console.log('Report generated successfully.');
  } catch (error) {
    console.error(`Error generating the report: ${error.message}`);
  }
};

runReport();
