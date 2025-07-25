import path from 'path';
import { processSalesData, readSalesData } from './src/services/report_logic.js';
import {
  formatProductReportAsText,
  formatProductReportAsHtml,
} from './src/services/report_formatter.js';
import { writeFile } from './src/utils/file_handler.js';
import { PATH_CONSOLIDATED_REPORT, PATH_SALES_CSV } from './src/config.js';

/**
 * Generates a product report in the specified format
 * @param format - Format of the report ('text' or 'html')
 */
const runReport = async (format: string = 'text'): Promise<void> => {
  const salesFile = PATH_SALES_CSV;

  // Determine output file path based on format
  let outputFile = PATH_CONSOLIDATED_REPORT;
  if (format === 'html') {
    const dir = path.dirname(PATH_CONSOLIDATED_REPORT);
    const filename = path.basename(
      PATH_CONSOLIDATED_REPORT,
      path.extname(PATH_CONSOLIDATED_REPORT),
    );
    outputFile = path.join(dir, `${filename}.html`);
  }

  try {
    console.log(`Reading data from: ${salesFile}`);
    const data = await readSalesData(salesFile);
    const reportData = processSalesData(data);

    console.log(`Generating ${format} report at: ${outputFile}`);
    let reportContent: string;

    if (format === 'html') {
      reportContent = formatProductReportAsHtml(reportData);
    } else {
      reportContent = formatProductReportAsText(reportData);
    }

    writeFile(outputFile, reportContent);

    console.log('Report generated successfully.');
  } catch (error) {
    console.error(`Error generating the report: ${(error as Error).message}`);
  }
};

// Check if format is specified in command line arguments
const args = process.argv.slice(2);
const format = args[0] === 'html' ? 'html' : 'text';

runReport(format);
