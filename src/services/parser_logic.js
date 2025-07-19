/**
 * Parser logic for processing report data
 * This module contains functions to parse report content into structured data
 */

/**
 * Processes a day header line and updates the current state
 * @param {string} line - The line to process
 * @param {string|null} currentDay - The current day being processed
 * @param {Array} currentSalesData - The current sales data for the day
 * @param {Array} dailyData - The array of daily data objects
 * @returns {Object} Updated state with new currentDay, currentSalesData, isInTable, and isHeaderRow
 */
const processDayHeader = (line, currentDay, currentSalesData, dailyData) => {
  // If we were processing a previous day, add it to the result
  if (currentDay && currentSalesData.length > 0) {
    dailyData.push({
      date: currentDay,
      salesData: currentSalesData,
    });
  }

  // Start a new day
  return {
    currentDay: line.replace(/---/g, '').trim(),
    currentSalesData: [],
    isInTable: false,
    isHeaderRow: false
  };
};

/**
 * Processes a data row and adds it to the current sales data
 * @param {string} line - The line to process
 * @param {Array} currentSalesData - The current sales data for the day
 * @returns {boolean} True if the line was processed as a data row, false otherwise
 */
const processDataRow = (line, currentSalesData) => {
  // Split the line by | and remove empty entries
  const columns = line
    .split('|')
    .map((col) => col.trim())
    .filter((col) => col);

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
      ganancia,
    });
    return true;
  }
  return false;
};

/**
 * Adds daily data to the result array if it exists
 * @param {string|null} currentDay - The current day being processed
 * @param {Array} currentSalesData - The current sales data for the day
 * @param {Array} dailyData - The array of daily data objects to add to
 */
const addDailyData = (currentDay, currentSalesData, dailyData) => {
  if (currentDay && currentSalesData.length > 0) {
    dailyData.push({
      date: currentDay,
      salesData: currentSalesData,
    });
  }
};

/**
 * Processes a line and updates the parsing state
 * @param {string} trimmedLine - The trimmed line to process
 * @param {Object} state - The current parsing state
 * @param {Array} dailyData - The array of daily data objects
 * @returns {Object} Updated parsing state
 */
const processLine = (trimmedLine, state, dailyData) => {
  const { currentDay, currentSalesData, isInTable, isHeaderRow } = state;

  // Check if this is a day header line
  if (trimmedLine.startsWith('---') && trimmedLine.endsWith('---')) {
    return processDayHeader(trimmedLine, currentDay, currentSalesData, dailyData);
  }

  // Check if this is the start of a table
  if (trimmedLine.startsWith('+-') && !isInTable) {
    return {
      currentDay,
      currentSalesData,
      isInTable: true,
      isHeaderRow: true
    };
  }

  // Skip header row
  if (isHeaderRow && trimmedLine.startsWith('|')) {
    return {
      currentDay,
      currentSalesData,
      isInTable,
      isHeaderRow: false
    };
  }

  // Skip table separators and total row
  if (trimmedLine.startsWith('+-') || trimmedLine.includes('| Total')) {
    return state;
  }

  // Process data rows
  if (isInTable && trimmedLine.startsWith('|') && !trimmedLine.includes('| Total')) {
    processDataRow(trimmedLine, currentSalesData);
  }

  return state;
};

/**
 * Parses the weekly report content into structured daily data
 * @param {string} reportContent - The content of the weekly report
 * @returns {Array} An array of daily data objects, each containing date and sales data
 */
export const parseReportData = (reportContent) => {
  // Split the report into lines
  const lines = reportContent.split('\n');
  const dailyData = [];

  let state = {
    currentDay: null,
    currentSalesData: [],
    isInTable: false,
    isHeaderRow: false
  };

  // Process each line
  for (const line of lines) {
    const trimmedLine = line.trim();
    state = processLine(trimmedLine, state, dailyData);
  }

  // Add the last day if it exists
  addDailyData(state.currentDay, state.currentSalesData, dailyData);

  return dailyData;
};
