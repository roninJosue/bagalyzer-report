import csv from 'csv-parser';
import fs from 'fs';
import {
  formatMonthlyReportAsText,
  formatTotalReportAsText,
  formatProductReportAsText,
  formatWeeklyReportAsText,
} from './report_formatter.js';

// Define types for the application
type GainsRule = Map<string, number>;
type GainsMap = Map<string, GainsRule>;
type MonthlyProductSales = Map<string, Map<string, number>>;
type TotalProductSales = Map<string, number>;
type DailySales = Map<string, ProductSale>;
type WeeklySales = Map<string, DailySales>;

interface ProductSale {
  quantity: number;
  price: number;
  profit: number;
}

interface ProductReportData {
  monthlyProductSales: MonthlyProductSales;
  totalProductSales: TotalProductSales;
}

interface RowData {
  productName: string;
  quantityStr: string;
  priceStr: string;
  dateStr: string;
  profitStr: string;
}

interface DateComponents {
  month: number;
  day: number;
  year: number;
  date: Date;
}

/**
 * Parses the gains list from a file
 * @param filePath - Path to the gains list file
 * @returns Map of product names to gains, or null if parsing failed
 */
const parseGainsList = (filePath: string): GainsMap | null => {
  const gainsMap: GainsMap = new Map();
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
            const [quantity, gain] = rule.split(':');
            if (quantity && gain) {
              const trimmedQuantity = quantity.trim();
              const trimmedGain = gain.trim();
              const parsedGain = parseFloat(trimmedGain);

              if (!isNaN(parsedGain)) {
                gainsMap.get(productName)?.set(trimmedQuantity, parsedGain);
              } else {
                console.warn(
                  `Warning: Invalid gain value in rule "${rule}" for product "${productName}"`,
                );
              }
            } else {
              console.warn(`Warning: Malformed rule "${rule}" for product "${productName}"`);
            }
          }
        });
      }
    });
  } catch (error) {
    console.error(`Error: Could not read gains list from ${filePath}: ${(error as Error).message}`);
    return null;
  }
  return gainsMap;
};

/**
 * Reads sales data from a CSV file
 * @param salesFile - Path to the sales CSV file
 * @returns Promise resolving to an array of sales data rows
 * @throws {Error} If the sales file cannot be read or parsed
 */
export const readSalesData = (salesFile: string): Promise<string[][]> =>
  new Promise((resolve, reject) => {
    if (!salesFile) {
      reject(new Error('Sales file path is required'));
      return;
    }

    if (!fs.existsSync(salesFile)) {
      reject(new Error(`Sales file not found at ${salesFile}`));
      return;
    }

    const data: string[][] = [];
    const stream = fs.createReadStream(salesFile);

    stream.on('error', (error) => {
      reject(new Error(`Error reading sales file: ${error.message}`));
    });

    stream
      .pipe(csv() as any)
      .on('data', (row: Record<string, string>) => {
        if (row && Object.values(row).length > 0) {
          data.push(Object.values(row));
        }
      })
      .on('end', () => resolve(data))
      .on('error', (error: Error) => {
        reject(new Error(`Error parsing CSV data: ${error.message}`));
      });
  });

/**
 * Processes sales data and calculates monthly and total product sales
 * @param data - Array of sales data rows
 * @returns Object containing monthlyProductSales and totalProductSales maps
 */
export const processSalesData = (data: string[][]): ProductReportData => {
  const monthlyProductSales: MonthlyProductSales = new Map();
  const totalProductSales: TotalProductSales = new Map();

  if (!Array.isArray(data)) {
    console.error('Error: Sales data must be an array');
    return { monthlyProductSales, totalProductSales };
  }

  data.forEach((row, index) => {
    try {
      if (!Array.isArray(row) || row.length < 4) {
        console.warn(`Warning: Skipping row #${index + 1} due to insufficient data`);
        return;
      }

      const productName = row[0] ? row[0].trim() : '';
      if (!productName) {
        console.warn(`Warning: Skipping row #${index + 1} due to missing product name`);
        return;
      }

      const quantityStr = row[1] ? row[1].replace(/"/g, '').replace(/,/g, '').trim() : '';
      const dateStr = row[3] ? row[3].trim() : '';

      if (!dateStr) {
        console.warn(`Warning: Skipping row #${index + 1} due to missing date`);
        return;
      }

      const dateParts = dateStr.split('/');
      if (dateParts.length < 3) {
        console.warn(`Warning: Skipping row #${index + 1} due to invalid date format`);
        return;
      }

      const month = parseInt(dateParts[0], 10);
      const year = parseInt(dateParts[2], 10);

      const quantity = parseFloat(quantityStr);
      if (isNaN(quantity)) {
        console.warn(`Warning: Skipping row #${index + 1} due to invalid quantity`);
        return;
      }

      if (isNaN(month) || isNaN(year)) {
        console.warn(`Warning: Skipping row #${index + 1} due to invalid date components`);
        return;
      }

      const monthKey = `${year}-${String(month).padStart(2, '0')}`;

      if (!monthlyProductSales.has(monthKey)) {
        monthlyProductSales.set(monthKey, new Map());
      }

      const productMap = monthlyProductSales.get(monthKey);
      if (productMap) {
        const currentQuantity = productMap.get(productName) || 0;
        productMap.set(productName, currentQuantity + quantity);
      }

      const totalQuantity = totalProductSales.get(productName) || 0;
      totalProductSales.set(productName, totalQuantity + quantity);
    } catch (error) {
      console.warn(`Warning: Error processing row #${index + 1}: ${(error as Error).message}`);
    }
  });

  return { monthlyProductSales, totalProductSales };
};

/**
 * Generates a monthly sales report as text
 * @param monthlyProductSales - Map of monthly product sales data
 * @returns Formatted monthly report as text
 * @throws {Error} If the input data is invalid
 */
const generateMonthlyReport = (monthlyProductSales: MonthlyProductSales): string => {
  if (!monthlyProductSales || !(monthlyProductSales instanceof Map)) {
    throw new Error('Monthly product sales data must be a Map');
  }
  return formatMonthlyReportAsText(monthlyProductSales);
};

/**
 * Generates a total sales report as text
 * @param totalProductSales - Map of total product sales data
 * @returns Formatted total report as text
 * @throws {Error} If the input data is invalid
 */
const generateTotalReport = (totalProductSales: TotalProductSales): string => {
  if (!totalProductSales || !(totalProductSales instanceof Map)) {
    throw new Error('Total product sales data must be a Map');
  }
  return formatTotalReportAsText(totalProductSales);
};

/**
 * Calculates the profit for a sale
 * @param profitStr - The profit string from the CSV
 * @param price - The calculated price
 * @param productName - The name of the product
 * @param quantity - The quantity
 * @param gainsMap - The map of product gains
 * @returns The calculated profit
 */
const calculateProfit = (
  profitStr: string,
  price: number,
  productName: string,
  quantity: number,
  gainsMap: GainsMap | null
): number => {
  const cleanedProfitStr = profitStr.replace(/[^\d.]/g, '');

  if (cleanedProfitStr) {
    const parsedProfit = parseFloat(cleanedProfitStr);
    return isNaN(parsedProfit) ? 0.0 : parsedProfit;
  }

  if (price === 0) {
    return 0;
  }

  if (gainsMap?.has(productName)) {
    try {
      const quantityLookupKey = String(parseInt(quantity.toString(), 10));
      const productGains = gainsMap.get(productName);
      if (productGains && productGains.has(quantityLookupKey)) {
        const gain = productGains.get(quantityLookupKey);
        return gain !== undefined ? gain : 0;
      }
    } catch (error) {
      console.warn(`Warning: Error looking up gain for product "${productName}": ${(error as Error).message}`);
    }
  }

  return 0.0;
};

/**
 * Updates the sales data for a product in the daily sales map
 * @param dailySales - The map of daily sales
 * @param productName - The name of the product
 * @param quantity - The quantity
 * @param price - The price
 * @param profit - The profit
 */
const updateProductSales = (
  dailySales: DailySales,
  productName: string,
  quantity: number,
  price: number,
  profit: number
): void => {
  if (!dailySales.has(productName)) {
    dailySales.set(productName, { quantity: 0, price: 0, profit: 0 });
  }

  const productSales = dailySales.get(productName);
  if (productSales) {
    productSales.quantity += quantity;
    productSales.price += price;
    productSales.profit += profit;
  }
};

/**
 * Extracts and validates data from a sales row
 * @param row - The sales data row
 * @param index - The row index for error reporting
 * @returns Extracted data or null if validation fails
 */
const extractRowData = (row: string[], index: number): RowData | null => {
  if (!Array.isArray(row) || row.length < 4) {
    console.warn(`Warning: Skipping row #${index + 1} due to insufficient data`);
    return null;
  }

  const productName = row[0] ? row[0].trim() : '';
  if (!productName) {
    console.warn(`Warning: Skipping row #${index + 1} due to missing product name`);
    return null;
  }

  const quantityStr = row[1] ? row[1].replace(/"/g, '').replace(/,/g, '').trim() : '';
  const priceStr = row[2] ? row[2].replace(/"/g, '').replace(/,/g, '').trim() : '';
  const dateStr = row[3] ? row[3].trim() : '';
  const profitStr = row.length > 4 ? row[4].replace(/"/g, '').replace(/,/g, '').trim() : '';

  if (!dateStr) {
    console.warn(`Warning: Skipping row #${index + 1} due to missing date`);
    return null;
  }

  return { productName, quantityStr, priceStr, dateStr, profitStr };
};

/**
 * Parses a date string into date components
 * @param dateStr - The date string to parse
 * @param index - The row index for error reporting
 * @returns Date components or null if parsing fails
 */
const parseDateComponents = (dateStr: string, index: number): DateComponents | null => {
  const dateParts = dateStr.split('/');
  if (dateParts.length < 3) {
    console.warn(`Warning: Skipping row #${index + 1} due to invalid date format`);
    return null;
  }

  const month = parseInt(dateParts[0], 10) - 1;
  const day = parseInt(dateParts[1], 10);
  const year = parseInt(dateParts[2], 10);

  if (isNaN(month) || isNaN(day) || isNaN(year)) {
    console.warn(`Warning: Skipping row #${index + 1} due to invalid date components`);
    return null;
  }

  return { month, day, year, date: new Date(year, month, day) };
};

/**
 * Processes a sales row for the current week
 * @param rowData - The extracted row data
 * @param dateComponents - The parsed date components
 * @param weeklySales - The map of weekly sales
 * @param gainsMap - The map of product gains
 * @param index - The row index for error reporting
 * @returns True if processing succeeded, false otherwise
 */
const processWeeklyRow = (
  rowData: RowData,
  dateComponents: DateComponents,
  weeklySales: WeeklySales,
  gainsMap: GainsMap | null,
  index: number
): boolean => {
  const { productName, quantityStr, priceStr, profitStr } = rowData;
  const { year, month, day } = dateComponents;

  const dayKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  if (!weeklySales.has(dayKey)) {
    weeklySales.set(dayKey, new Map());
  }

  const dailySales = weeklySales.get(dayKey);
  if (!dailySales) {
    return false;
  }

  const cleanedPriceStr = priceStr.replace(/[^\d.]/g, '');
  const price = cleanedPriceStr ? parseFloat(cleanedPriceStr) : 0.0;
  const quantity = parseFloat(quantityStr);

  if (isNaN(quantity)) {
    console.warn(`Warning: Skipping row #${index + 1} due to invalid quantity`);
    return false;
  }

  const finalProfit = calculateProfit(profitStr, price, productName, quantity, gainsMap);
  updateProductSales(dailySales, productName, quantity, price, finalProfit);
  return true;
};

/**
 * Processes sales data to calculate weekly sales
 * @param data - Array of sales data rows
 * @param gainsMap - Map of product names to gains
 * @returns Map of daily sales data for the current week
 */
const processWeeklySalesData = (data: string[][], gainsMap: GainsMap | null): WeeklySales => {
  const weeklySales: WeeklySales = new Map();

  if (!Array.isArray(data)) {
    console.error('Error: Sales data must be an array');
    return weeklySales;
  }

  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);

  data.forEach((row, index) => {
    try {
      const rowData = extractRowData(row, index);
      if (!rowData) return;

      const dateComponents = parseDateComponents(rowData.dateStr, index);
      if (!dateComponents) return;

      if (dateComponents.date >= startOfWeek && dateComponents.date <= endOfWeek) {
        processWeeklyRow(rowData, dateComponents, weeklySales, gainsMap, index);
      }
    } catch (error) {
      console.warn(`Warning: Error processing row #${index + 1}: ${(error as Error).message}`);
    }
  });

  return weeklySales;
};

/**
 * Generates a weekly sales report as text
 * @param weeklySales - Map of weekly sales data
 * @returns Formatted weekly report as text
 * @throws {Error} If the input data is invalid
 */
const generateWeeklyReport = (weeklySales: WeeklySales): string => {
  if (!weeklySales || !(weeklySales instanceof Map)) {
    throw new Error('Weekly sales data must be a Map');
  }
  return formatWeeklyReportAsText(weeklySales);
};

/**
 * Generates a product sales report as text
 * @param salesFile - Path to the sales CSV file
 * @returns Promise resolving to the formatted product report as text
 * @throws {Error} If the sales file cannot be read or if the report cannot be generated
 */
export const generateProductReportContent = async (salesFile: string): Promise<string> => {
  if (!salesFile) {
    throw new Error('Sales file path is required');
  }

  try {
    const data = await readSalesData(salesFile);
    const reportData = processSalesData(data);
    return formatProductReportAsText(reportData);
  } catch (error) {
    throw new Error(`Error generating product report: ${(error as Error).message}`);
  }
};

/**
 * Processes sales data and returns the weekly sales data structure
 * @param salesFile - Path to the sales CSV file
 * @param gainsListPath - Path to the gains list file
 * @returns Promise resolving to a map of weekly sales data
 * @throws {Error} If the sales file or gains list cannot be read or processed
 */
export const getWeeklySalesData = async (
  salesFile: string,
  gainsListPath: string
): Promise<WeeklySales> => {
  if (!salesFile || !gainsListPath) {
    throw new Error('Sales file and gains list paths are required');
  }

  const gainsData = parseGainsList(gainsListPath);
  if (gainsData === null) {
    throw new Error(`Could not parse gains list from ${gainsListPath}`);
  }

  try {
    const data = await readSalesData(salesFile);
    return processWeeklySalesData(data, gainsData);
  } catch (error) {
    throw new Error(`Error processing weekly sales data: ${(error as Error).message}`);
  }
};

/**
 * Generates weekly sales report content
 * @param salesFile - Path to the sales CSV file
 * @param gainsListPath - Path to the gains list file
 * @returns Promise resolving to the formatted weekly report
 * @throws {Error} If the weekly sales data cannot be processed or if the report cannot be generated
 */
export const generateWeeklySalesReportContent = async (
  salesFile: string,
  gainsListPath: string
): Promise<string> => {
  if (!salesFile || !gainsListPath) {
    throw new Error('Sales file and gains list paths are required');
  }

  try {
    const weeklySales = await getWeeklySalesData(salesFile, gainsListPath);
    return formatWeeklyReportAsText(weeklySales);
  } catch (error) {
    throw new Error(`Error generating weekly sales report: ${(error as Error).message}`);
  }
};
