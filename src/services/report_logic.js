import csv from 'csv-parser';
import fs from 'fs';
import path from 'path';
import { formatMonthlyReportAsText, formatTotalReportAsText, formatProductReportAsText, formatWeeklyReportAsText } from './report_formatter.js';

const parseGainsList = (filePath) => {
  const gainsMap = new Map();
  try {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const lines = fileContent.split('\n');

    lines.forEach((line) => {
      const trimmedLine = line.trim();
      if (!trimmedLine) return;

      const parts = trimmedLine.split(/\s{2,}/, 2);
      const productName = parts[0].trim();
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
    console.error(`Error: Gains list file not found at ${filePath}`);
    return null;
  }
  return gainsMap;
};

export const readSalesData = (salesFile) =>
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

export const processSalesData = (data) => {
  const monthlyProductSales = new Map();
  const totalProductSales = new Map();

  data.forEach((row, index) => {
    try {
      if (row.length < 4) return;

      const productName = row[0].trim();
      const quantityStr = row[1].replace(/"/g, '').replace(/,/g, '').trim();
      const dateStr = row[3];

      const dateParts = dateStr.split('/');
      if (dateParts.length < 3) {
        console.log(data[index]);
        return;
      }

      const month = parseInt(dateParts[0], 10);
      const year = parseInt(dateParts[2], 10);

      const quantity = parseFloat(quantityStr);
      if (isNaN(quantity)) return;

      if (isNaN(month) || isNaN(year)) return;

      const monthKey = `${year}-${String(month).padStart(2, '0')}`;

      if (!monthlyProductSales.has(monthKey)) {
        monthlyProductSales.set(monthKey, new Map());
      }

      const productMap = monthlyProductSales.get(monthKey);
      productMap.set(productName, (productMap.get(productName) || 0) + quantity);

      totalProductSales.set(productName, (totalProductSales.get(productName) || 0) + quantity);
    } catch (error) {
      // Ignore errors in rows
    }
  });

  return { monthlyProductSales, totalProductSales };
};

const generateMonthlyReport = (monthlyProductSales) => {
  return formatMonthlyReportAsText(monthlyProductSales);
};

const generateTotalReport = (totalProductSales) => {
  return formatTotalReportAsText(totalProductSales);
};

const processWeeklySalesData = (data, gainsMap) => {
  const weeklySales = new Map();
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);

  data.forEach((row) => {
    try {
      if (row.length < 4) return;

      const productName = row[0].trim();
      const quantityStr = row[1].replace(/"/g, '').replace(/,/g, '').trim();
      const priceStr = row[2].replace(/"/g, '').replace(/,/g, '').trim();
      const dateStr = row[3];
      const profitStr = row.length > 4 ? row[4].replace(/"/g, '').replace(/,/g, '').trim() : '';

      const dateParts = dateStr.split('/');
      if (dateParts.length < 3) return;

      const month = parseInt(dateParts[0], 10) - 1;
      const day = parseInt(dateParts[1], 10);
      const year = parseInt(dateParts[2], 10);

      const date = new Date(year, month, day);

      if (date >= startOfWeek && date <= endOfWeek) {
        const dayKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        if (!weeklySales.has(dayKey)) {
          weeklySales.set(dayKey, new Map());
        }

        const dailySales = weeklySales.get(dayKey);
        const cleanedPriceStr = priceStr.replace(/[^\d.]/g, '');
        const price = cleanedPriceStr ? parseFloat(cleanedPriceStr) : 0.0;
        const quantity = parseFloat(quantityStr);

        let finalProfit = 0.0;
        const cleanedProfitStr = profitStr.replace(/[^\d.]/g, '');

        if (cleanedProfitStr) {
          finalProfit = parseFloat(cleanedProfitStr);
        } else if (price === 0) {
          finalProfit = 0;
        } else if (gainsMap && gainsMap.has(productName)) {
          try {
            const quantityLookupKey = String(parseInt(quantity, 10));
            if (gainsMap.get(productName).has(quantityLookupKey)) {
              finalProfit = gainsMap.get(productName).get(quantityLookupKey);
            }
          } catch (error) {
            // ignore value errors
          }
        }

        if (!dailySales.has(productName)) {
          dailySales.set(productName, { quantity: 0, price: 0, profit: 0 });
        }

        const productSales = dailySales.get(productName);
        productSales.quantity += quantity;
        productSales.price += price;
        productSales.profit += finalProfit;
      }
    } catch (error) {
      // ignore value and index errors
    }
  });

  return weeklySales;
};

const generateWeeklyReport = (weeklySales) => {
  return formatWeeklyReportAsText(weeklySales);
};

export const generateProductReportContent = async (salesFile) => {
  const data = await readSalesData(salesFile);
  const reportData = processSalesData(data);

  return formatProductReportAsText(reportData);
};

/**
 * Processes sales data and returns the weekly sales data structure
 * @param {string} salesFile - Path to the sales CSV file
 * @param {string} gainsListPath - Path to the gains list file
 * @returns {Map|null} Map of weekly sales data or null if an error occurs
 */
export const processWeeklySalesData2 = async (salesFile, gainsListPath) => {
  try {
    const gainsData = parseGainsList(gainsListPath);
    if (gainsData === null) return null;

    const data = await readSalesData(salesFile);
    return processWeeklySalesData(data, gainsData);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    return null;
  }
};

/**
 * Generates weekly sales report content
 * @param {string} salesFile - Path to the sales CSV file
 * @param {string} gainsListPath - Path to the gains list file
 * @returns {string|null} Formatted report content or null if an error occurs
 */
export const generateWeeklySalesReportContent = async (salesFile, gainsListPath) => {
  const weeklySales = processWeeklySalesData2(salesFile, gainsListPath);
  if (weeklySales === null) return null;

  return formatWeeklyReportAsText(weeklySales);
};
