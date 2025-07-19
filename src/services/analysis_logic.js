import { readFile } from '../utils/file_handler.js';
import csv from 'csv-parser';
import fs from 'fs';
import { formatAnalysisReportAsText, formatAnalysisReportAsHtml } from './report_formatter.js';

/**
 * Helper function to get a safe, trimmed string value
 * @param {*} value - The value to convert to a trimmed string
 * @returns {string} A trimmed string representation of the value, or an empty string if the value is null or undefined
 */
const getSafeValue = (value) => {
  return value !== undefined && value !== null ? String(value).trim() : '';
};

/**
 * Parses the gains list from a file
 * @param {string} filePath - Path to the gains list file
 * @returns {Map|null} Map of product names to gains, or null if parsing failed
 */
const parseGainsList = (filePath) => {
  const gainsMap = new Map();
  try {
    const fileContent = readFile(filePath);
    const lines = fileContent.split('\n');

    lines.forEach((line) => {
      const trimmedLine = getSafeValue(line);
      if (!trimmedLine) return;

      const parts = trimmedLine.split(/\s{2,}/, 2);
      const productName = getSafeValue(parts[0]);
      gainsMap.set(productName, new Map());

      if (parts.length > 1 && parts[1].trim()) {
        const rulesPart = parts[1].trim();
        const rules = rulesPart.split(',');

        rules.forEach((rule) => {
          if (rule.includes(':')) {
            const [quantity, gain] = rule.split(':');
            if (quantity && gain) {
              const trimmedQuantity = quantity.trim();
              const trimmedGain = gain.trim();
              const parsedGain = parseFloat(trimmedGain);

              if (!isNaN(parsedGain)) {
                gainsMap.get(productName).set(trimmedQuantity, parsedGain);
              } else {
                console.warn(`Warning: Invalid gain value in rule "${rule}" for product "${productName}"`);
              }
            } else {
              console.warn(`Warning: Malformed rule "${rule}" for product "${productName}"`);
            }
          }
        });
      }
    });
  } catch (error) {
    console.error(`Error: Could not read gains list from ${filePath}: ${error.message}`);
    return null;
  }

  return gainsMap;
};

/**
 * Reads sales data from a CSV file
 * @param {string} salesFile - Path to the sales CSV file
 * @returns {Promise<Array>} Promise resolving to an array of sales data rows
 */
const readSalesData = (salesFile) =>
  new Promise((resolve, reject) => {
    if (!salesFile) {
      reject(new Error('Sales file path is required'));
      return;
    }

    if (!fs.existsSync(salesFile)) {
      reject(new Error(`Sales file not found at ${salesFile}`));
      return;
    }

    const data = [];
    const stream = fs.createReadStream(salesFile);

    stream.on('error', (error) => {
      reject(new Error(`Error reading sales file: ${error.message}`));
    });

    stream
      .pipe(csv({ header: false }))
      .on('data', (row) => {
        if (row && Object.values(row).length > 0) {
          data.push(Object.values(row));
        }
      })
      .on('end', () => resolve(data))
      .on('error', (error) => {
        reject(new Error(`Error parsing CSV data: ${error.message}`));
      });
  });

/**
 * Parses a date string and returns a month key if valid
 * @param {string} dateStr - The date string to parse
 * @param {number} rowIndex - The index of the row for error reporting
 * @returns {string|null} The month key in format 'YYYY-MM' or null if invalid
 */
const parseMonthKey = (dateStr, rowIndex) => {
  const dateParts = dateStr.split('/');
  if (dateParts.length < 3) {
    console.warn(`Warning: Skipping row #${rowIndex + 1} of CSV due to invalid date format.`);
    return null;
  }

  const month = parseInt(dateParts[0], 10);
  const day = parseInt(dateParts[1], 10);
  const year = parseInt(dateParts[2], 10);

  if (isNaN(month) || isNaN(day) || isNaN(year)) {
    console.warn(`Warning: Skipping row #${rowIndex + 1} of CSV due to invalid date components.`);
    return null;
  }

  return `${year}-${String(month).padStart(2, '0')}`;
};

/**
 * Calculates the profit for a sale
 * @param {string} profitStr - The profit string from the CSV
 * @param {number} price - The calculated price
 * @param {string} productName - The name of the product
 * @param {string} quantityStr - The quantity string
 * @param {Map} gainsMap - The map of product gains
 * @returns {number} The calculated profit
 */
const calculateProfit = (profitStr, price, productName, quantityStr, gainsMap) => {
  const cleanedProfitStr = profitStr.replace(/[^\d.]/g, '');

  if (cleanedProfitStr !== '0') {
    const parsedProfit = parseFloat(cleanedProfitStr);
    return isNaN(parsedProfit) ? 0.0 : parsedProfit;
  }

  if (price === 0) {
    return 0;
  }

  if (gainsMap?.has(productName)) {
    const quantity = parseFloat(quantityStr);
    // Only look up if the quantity is a valid number
    if (!isNaN(quantity)) {
      try {
        const quantityLookupKey = String(parseInt(quantity, 10));
        if (gainsMap.get(productName).has(quantityLookupKey)) {
          return gainsMap.get(productName).get(quantityLookupKey);
        }
      } catch (error) {
        console.warn(`Warning: Error looking up gain for product "${productName}": ${error.message}`);
      }
    }
  }

  return 0.0;
};

/**
 * Processes sales data and calculates monthly prices and earnings
 * @param {Array} data - Array of sales data rows
 * @param {Map} gainsMap - Map of product names to gains
 * @returns {Object} Object containing monthlyPrices and monthlyEarnings maps
 */
const processSalesData = (data, gainsMap) => {
  const monthlyPrices = new Map();
  const monthlyEarnings = new Map();

  if (!Array.isArray(data)) {
    console.error('Error: Sales data must be an array');
    return { monthlyPrices, monthlyEarnings };
  }

  data.forEach((row, index) => {
    // Make sure row is an array and has enough elements
    if (!Array.isArray(row) || row.length < 5) {
      console.warn(
        `Warning: Skipping row #${index + 1} of CSV due to unexpected format or insufficient data.`
      );
      return;
    }

    try {
      // Use default values to avoid errors in null or undefined data
      const productName = getSafeValue(row[0]);
      const quantityStr = getSafeValue(row[1]).replace(/"/g, '').replace(/,/g, '');
      const priceStr = getSafeValue(row[2]) || '0';
      const dateStr = getSafeValue(row[3]);
      const profitStr = getSafeValue(row[4]) || '0';

      // If essential data like name or date is missing, skip the row
      if (!productName || !dateStr) {
        console.warn(
          `Warning: Skipping row #${index + 1} of CSV due to missing data (product or date).`
        );
        return;
      }

      const cleanedPriceStr = priceStr.replace(/[^\d.]/g, '');
      const price = cleanedPriceStr ? parseFloat(cleanedPriceStr) : 0.0;

      const monthKey = parseMonthKey(dateStr, index);
      if (!monthKey) {
        return; // Skip this row due to invalid date
      }

      const finalProfit = calculateProfit(profitStr, price, productName, quantityStr, gainsMap);

      // Update monthly totals
      const currentMonthPrice = monthlyPrices.get(monthKey) || 0;
      const currentMonthEarnings = monthlyEarnings.get(monthKey) || 0;

      monthlyPrices.set(monthKey, currentMonthPrice + price);
      monthlyEarnings.set(monthKey, currentMonthEarnings + finalProfit);
    } catch (error) {
      console.warn(
        `Warning: Row #${index + 1} in the CSV was skipped due to an unexpected error: ${error.message}`
      );
    }
  });

  return { monthlyPrices, monthlyEarnings };
};

/**
 * Generates a report from monthly prices and earnings data
 * @param {Map} monthlyPrices - Map of monthly prices
 * @param {Map} monthlyEarnings - Map of monthly earnings
 * @param {string} format - Format of the report ('text' or 'html')
 * @returns {string} Formatted report
 * @throws {Error} If the format is not supported or if formatting fails
 */
const generateReport = (monthlyPrices, monthlyEarnings, format = 'text') => {
  if (!monthlyPrices || !monthlyEarnings) {
    throw new Error('Monthly prices and earnings data are required');
  }

  const reportData = { monthlyPrices, monthlyEarnings };

  try {
    if (format === 'html') {
      return formatAnalysisReportAsHtml(reportData);
    }

    if (format !== 'text') {
      console.warn(`Warning: Unsupported format '${format}', defaulting to 'text'`);
    }

    return formatAnalysisReportAsText(reportData);
  } catch (error) {
    throw new Error(`Failed to generate ${format} report: ${error.message}`);
  }
};

/**
 * Processes sales data and returns the analysis data structure
 * @param {string} salesFile - Path to the sales CSV file
 * @param {string} gainsListPath - Path to the gains list file
 * @returns {Promise<Object>} Promise resolving to an object containing monthlyPrices and monthlyEarnings
 * @throws {Error} If the gains list cannot be parsed or if the sales data cannot be read
 */
export const processAnalysisData = async (salesFile, gainsListPath) => {
  if (!salesFile || !gainsListPath) {
    throw new Error('Sales file and gains list paths are required');
  }

  const gainsData = parseGainsList(gainsListPath);
  if (gainsData === null) {
    throw new Error(`Could not parse gains list from ${gainsListPath}`);
  }

  try {
    const data = await readSalesData(salesFile);
    return processSalesData(data, gainsData);
  } catch (error) {
    throw new Error(`Error processing sales data: ${error.message}`);
  }
};

/**
 * Generates an analysis report
 * @param {string} salesFile - Path to the sales CSV file
 * @param {string} gainsListPath - Path to the gains list file
 * @param {string} format - Format of the report ('text' or 'html')
 * @returns {Promise<string>} Promise resolving to the formatted report
 * @throws {Error} If the analysis data cannot be processed or if the report cannot be generated
 */
export const generateAnalysisReport = async (salesFile, gainsListPath, format = 'text') => {
  if (!salesFile || !gainsListPath) {
    throw new Error('Sales file and gains list paths are required');
  }

  try {
    const { monthlyPrices, monthlyEarnings } = await processAnalysisData(salesFile, gainsListPath);
    return generateReport(monthlyPrices, monthlyEarnings, format);
  } catch (error) {
    throw new Error(`Error generating analysis report: ${error.message}`);
  }
};

// Export the remaining functions
export { parseGainsList, readSalesData, processSalesData, generateReport };
