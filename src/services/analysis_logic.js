import { readFile } from '../utils/file_handler.js';
import csv from 'csv-parser';
import fs from 'fs';

// Helper function to get a safe, trimmed string value
const getSafeValue = (value) => {
  return value !== undefined && value !== null ? String(value).trim() : '';
};

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
            try {
              const [quantity, gain] = rule.split(':');
              gainsMap.get(productName).set(quantity.trim(), parseFloat(gain.trim()));
            } catch (error) {
              // ignore value errors
            }
          }
        });
      }
    });
  } catch (error) {
    console.error(`Error: Could not read gains list from ${filePath}`);
    return null;
  }

  return gainsMap;
};

const readSalesData = (salesFile) =>
  new Promise((resolve, reject) => {
    if (!fs.existsSync(salesFile)) {
      reject(new Error(`Sales file not found at ${salesFile}`));
      return;
    }

    const data = [];
    fs.createReadStream(salesFile)
      .pipe(csv({ header: false }))
      .on('data', (row) => data.push(Object.values(row)))
      .on('end', () => resolve(data))
      .on('error', reject);
  });

const processSalesData = (data, gainsMap) => {
  const monthlyPrices = new Map();
  const monthlyEarnings = new Map();

  data.forEach((row, index) => {
    // Make sure row is an array and has enough elements
    if (!Array.isArray(row) || row.length < 5) {
      console.warn(
        `Warning: Skipping row #${index + 1} of CSV due to unexpected format or insufficient data.`,
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
          `Warning: Skipping row #${index + 1} of CSV due to missing data (product or date).`,
        );
        return;
      }

      const cleanedPriceStr = priceStr.replace(/[^\d.]/g, '');
      const price = cleanedPriceStr ? parseFloat(cleanedPriceStr) : 0.0;

      const dateParts = dateStr.split('/');
      if (dateParts.length < 3) {
        console.warn(`Warning: Skipping row #${index + 1} of CSV due to invalid date format.`);
        return;
      }

      const month = parseInt(dateParts[0], 10);
      const day = parseInt(dateParts[1], 10);
      const year = parseInt(dateParts[2], 10);

      if (isNaN(month) || isNaN(day) || isNaN(year)) {
        console.warn(`Warning: Skipping row #${index + 1} of CSV due to invalid date components.`);
        return;
      }

      const monthKey = `${year}-${String(month).padStart(2, '0')}`;

      let finalProfit = 0.0;
      const cleanedProfitStr = profitStr.replace(/[^\d.]/g, '');

      if (cleanedProfitStr !== '0') {
        finalProfit = parseFloat(cleanedProfitStr);
      } else if (price === 0) {
        finalProfit = 0;
      } else if (gainsMap && gainsMap.has(productName)) {
        const quantity = parseFloat(quantityStr);
        // Only look up if the quantity is a valid number
        if (!isNaN(quantity)) {
          try {
            const quantityLookupKey = String(parseInt(quantity, 10));
            if (gainsMap.get(productName).has(quantityLookupKey)) {
              finalProfit = gainsMap.get(productName).get(quantityLookupKey);
            }
          } catch (error) {
            // ignore lookup errors
          }
        }
      }

      monthlyPrices.set(monthKey, (monthlyPrices.get(monthKey) || 0) + price);
      monthlyEarnings.set(monthKey, (monthlyEarnings.get(monthKey) || 0) + finalProfit);
    } catch (error) {
      console.warn(
        `Warning: Row #${index + 1} in the CSV was skipped due to an unexpected error: ${error.message}`,
      );
    }
  });

  return { monthlyPrices, monthlyEarnings };
};

const generateReport = (monthlyPrices, monthlyEarnings) => {
  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  let reportContent = 'Updated Monthly Summary (Total Price and Total Profit)\n\n';
  const sortedMonths = Array.from(monthlyPrices.keys()).sort();
  let totalPricesAllTime = 0;
  let totalEarningsAllTime = 0;

  sortedMonths.forEach((monthKey) => {
    const [year, monthNumStr] = monthKey.split('-');
    const monthName = months[parseInt(monthNumStr, 10) - 1];
    const monthlyPrice = monthlyPrices.get(monthKey);
    const monthlyEarning = monthlyEarnings.get(monthKey);
    totalPricesAllTime += monthlyPrice;
    totalEarningsAllTime += monthlyEarning;

    reportContent += `*   **${year} - ${monthName}:**\n`;
    reportContent += `    *   Sum of Prices: C$${monthlyPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n`;
    reportContent += `    *   Sum of Profits: C$${monthlyEarning.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n\n`;
  });

  reportContent += '--------------------------------------------------\n';
  reportContent += 'Total Summary of All Months\n\n';
  reportContent += `*   **Total Sum of Prices:** C$${totalPricesAllTime.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n`;
  reportContent += `*   **Total Sum of Profits:** C$${totalEarningsAllTime.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n`;
  reportContent += '--------------------------------------------------\n';

  return reportContent;
};

const generateAnalysisReport = async (salesFile, gainsListPath) => {
  const gainsData = parseGainsList(gainsListPath);
  if (gainsData === null) {
    throw new Error(`Could not parse gains list from ${gainsListPath}`);
  }

  const data = await readSalesData(salesFile);
  const { monthlyPrices, monthlyEarnings } = processSalesData(data, gainsData);
  return generateReport(monthlyPrices, monthlyEarnings);
};

// Export the functions
export { parseGainsList, readSalesData, processSalesData, generateReport, generateAnalysisReport };
