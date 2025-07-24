import { generateAnalysisReport } from './src/services/analysis_logic.js';
import { writeFile } from './src/utils/file_handler.js';
import { PATH_SALES_CSV, PATH_LIST, PATH_ANALYSIS_REPORT } from './src/config.js';
import path from 'path';

/**
 * Orchestrator script to generate the sales analysis report.
 * Can generate reports in different formats based on command line arguments.
 * @returns A promise that resolves when the analysis is complete
 */
const runAnalysis = async (): Promise<void> => {
  try {
    console.log('Starting sales analysis...');

    // Check if format is specified in command line arguments
    const args = process.argv.slice(2);
    const format = args[0] === 'html' ? 'html' : 'text';

    // Generate report content in the specified format
    const reportContent = await generateAnalysisReport(PATH_SALES_CSV, PATH_LIST, format);

    // Determine output file path based on format
    let outputPath = PATH_ANALYSIS_REPORT;
    if (format === 'html') {
      const dir = path.dirname(PATH_ANALYSIS_REPORT);
      const filename = path.basename(PATH_ANALYSIS_REPORT, path.extname(PATH_ANALYSIS_REPORT));
      outputPath = path.join(dir, `${filename}.html`);
    }

    try {
      writeFile(outputPath, reportContent);
      console.log(`Analysis completed. Report saved at: ${outputPath}`);
    } catch (error) {
      console.error(`Failed to save report: ${(error as Error).message}`);
    }
  } catch (error) {
    console.error(`Error during sales analysis: ${(error as Error).message}`);
    process.exit(1);
  }
};

// Execute the analysis
runAnalysis().catch((error) => {
  console.error(`Unhandled error in analysis: ${(error as Error).message}`);
  process.exit(1);
});
