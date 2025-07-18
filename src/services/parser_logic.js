/**
 * Parser logic for processing report data
 * This module contains functions to parse report content into structured data
 */

/**
 * Parses the weekly report content into structured daily data
 * @param {string} reportContent - The content of the weekly report
 * @returns {Array} An array of daily data objects, each containing date and sales data
 */
export const parseReportData = (reportContent) => {
  // Split the report into lines
  const lines = reportContent.split('\n');
  const dailyData = [];

  let currentDay = null;
  let currentSalesData = [];
  let isInTable = false;
  let isHeaderRow = false;

  // Process each line
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Check if this is a day header line
    if (line.startsWith('---') && line.endsWith('---')) {
      // If we were processing a previous day, add it to the result
      if (currentDay && currentSalesData.length > 0) {
        dailyData.push({
          date: currentDay,
          salesData: currentSalesData
        });
      }

      // Start a new day
      currentDay = line.replace(/---/g, '').trim();
      currentSalesData = [];
      isInTable = false;
      isHeaderRow = false;
      continue;
    }

    // Check if this is the start of a table
    if (line.startsWith('+-') && !isInTable) {
      isInTable = true;
      isHeaderRow = true;
      continue;
    }

    // Skip header row
    if (isHeaderRow && line.startsWith('|')) {
      isHeaderRow = false;
      continue;
    }

    // Skip table separators and total row
    if (line.startsWith('+-') || line.includes('| Total')) {
      continue;
    }

    // Process data rows
    if (isInTable && line.startsWith('|') && !line.includes('| Total')) {
      // Split the line by | and remove empty entries
      const columns = line.split('|').map(col => col.trim()).filter(col => col);

      if (columns.length >= 4) {
        const product = columns[0];
        const quantity = parseInt(columns[1], 10);
        // Remove 'C$' prefix and convert to number
        const price = parseFloat(columns[2].replace('C$', '').trim());
        const ganancia = parseFloat(columns[3].replace('C$', '').trim());

        currentSalesData.push({
          product,
          quantity,
          price,
          ganancia
        });
      }
    }
  }

  // Add the last day if it exists
  if (currentDay && currentSalesData.length > 0) {
    dailyData.push({
      date: currentDay,
      salesData: currentSalesData
    });
  }

  return dailyData;
};
