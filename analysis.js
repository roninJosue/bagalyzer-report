import { generateAnalysisReport } from './src/services/analysis_logic.js';
import { writeFile } from './src/utils/file_handler.js';
import { PATH_SALES_CSV, PATH_LIST, PATH_ANALYSIS_REPORT } from './src/config.js';

/**
 * Orchestrator script to generate the sales analysis report.
 */
const runAnalysis = async () => {
  try {
    console.log('Starting sales analysis...');

    const reportContent = await generateAnalysisReport(PATH_SALES_CSV, PATH_LIST);

    writeFile(PATH_ANALYSIS_REPORT, reportContent);

    console.log(`Analysis completed. Report saved at: ${PATH_ANALYSIS_REPORT}`);
  } catch (error) {
    console.error(`Error during sales analysis: ${error.message}`);
  }
};

runAnalysis();
