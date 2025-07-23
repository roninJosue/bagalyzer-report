/**
 * Report formatter module
 * This module contains functions to format report data into different output formats (txt, html, etc.)
 */
import Handlebars from 'handlebars';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Reads a Handlebars template file and returns its content
 * @param {string} templateName - Name of the template file (without extension)
 * @returns {string} Template content
 * @throws {Error} If the template file cannot be read
 */
const readTemplate = (templateName) => {
  if (!templateName) {
    throw new Error('Template name is required');
  }

  try {
    const templatePath = path.resolve(__dirname, '..', '..', 'templates', `${templateName}.hbs`);
    return fs.readFileSync(templatePath, 'utf8');
  } catch (error) {
    throw new Error(`Failed to read template '${templateName}': ${error.message}`);
  }
};

/**
 * Formats monthly report data as text
 * @param {Map} monthlyProductSales - Map of monthly product sales data
 * @returns {string} Formatted monthly report as text
 * @throws {Error} If the input data is invalid
 */
export const formatMonthlyReportAsText = (monthlyProductSales) => {
  if (!monthlyProductSales || !(monthlyProductSales instanceof Map)) {
    throw new Error('Monthly product sales data must be a Map');
  }

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

  let reportContent = '';

  // If there's no data, return an empty report with a message
  if (monthlyProductSales.size === 0) {
    return 'No monthly sales data available.\n';
  }

  const sortedMonths = Array.from(monthlyProductSales.keys()).sort((a, b) => a.localeCompare(b));

  sortedMonths.forEach((monthKey) => {
    const parts = monthKey.split('-');
    if (parts.length !== 2) {
      console.warn(`Warning: Invalid month key format: ${monthKey}`);
      return;
    }

    const [year, monthNumStr] = parts;
    const monthIndex = parseInt(monthNumStr, 10) - 1;

    if (isNaN(monthIndex) || monthIndex < 0 || monthIndex >= months.length) {
      console.warn(`Warning: Invalid month number: ${monthNumStr}`);
      return;
    }

    const monthName = months[monthIndex];
    reportContent += `--- ${monthName.toUpperCase()} ${year} ---\n`;

    const productMap = monthlyProductSales.get(monthKey);

    if (!productMap || !(productMap instanceof Map) || productMap.size === 0) {
      reportContent += '  No products sold this month.\n\n';
      return;
    }

    const sortedProducts = Array.from(productMap.entries()).sort((a, b) => b[1] - a[1]);

    // Calculate the maximum product name length for padding
    const maxProductNameLength = Math.max(
      ...sortedProducts.map(([productName]) => (productName ? productName.length : 0)),
    );

    sortedProducts.forEach(([productName, quantity]) => {
      if (productName && quantity !== undefined) {
        const paddedProductName = productName.padEnd(maxProductNameLength, ' ');
        const formattedQuantity =
          typeof quantity === 'number' ? quantity.toLocaleString() : String(quantity);
        reportContent += `  ${paddedProductName}: ${formattedQuantity}\n`;
      }
    });
    reportContent += '\n';
  });

  return reportContent;
};

/**
 * Formats total report data as text
 * @param {Map} totalProductSales - Map of total product sales data
 * @returns {string} Formatted total report as text
 * @throws {Error} If the input data is invalid
 */
export const formatTotalReportAsText = (totalProductSales) => {
  if (!totalProductSales || !(totalProductSales instanceof Map)) {
    throw new Error('Total product sales data must be a Map');
  }

  let reportContent = '==================================================\n';
  reportContent += '        TOTAL SUMMARY OF PRODUCTS SOLD       \n';
  reportContent += '==================================================\n\n';

  // If there's no data, return a report with a message
  if (totalProductSales.size === 0) {
    reportContent += '  No product sales data available.\n';
    reportContent += '\n==================================================\n';
    return reportContent;
  }

  const sortedTotalProducts = Array.from(totalProductSales.entries())
    .filter(([productName, quantity]) => productName && quantity !== undefined)
    .sort((a, b) => b[1] - a[1]);

  if (sortedTotalProducts.length === 0) {
    reportContent += '  No valid product sales data available.\n';
    reportContent += '\n==================================================\n';
    return reportContent;
  }

  // Calculate the maximum product name length for padding
  const maxTotalProductNameLength = Math.max(
    ...sortedTotalProducts.map(([productName]) => productName.length),
  );

  sortedTotalProducts.forEach(([productName, quantity]) => {
    const paddedProductName = productName.padEnd(maxTotalProductNameLength, ' ');
    const formattedQuantity =
      typeof quantity === 'number' ? quantity.toLocaleString() : String(quantity);
    reportContent += `  ${paddedProductName}: ${formattedQuantity}\n`;
  });

  reportContent += '\n==================================================\n';

  return reportContent;
};

/**
 * Formats product report data as text
 * @param {Object} reportData - Object containing monthlyProductSales and totalProductSales
 * @returns {string} Formatted product report as text
 * @throws {Error} If the input data is invalid
 */
export const formatProductReportAsText = (reportData) => {
  if (!reportData || typeof reportData !== 'object') {
    throw new Error('Report data must be an object');
  }

  const { monthlyProductSales, totalProductSales } = reportData;

  if (!monthlyProductSales || !totalProductSales) {
    throw new Error('Report data must contain monthlyProductSales and totalProductSales');
  }

  let reportContent = '==================================================\n';
  reportContent += '        REPORT OF PRODUCTS SOLD           \n';
  reportContent += '==================================================\n\n';

  try {
    // Format monthly report
    reportContent += formatMonthlyReportAsText(monthlyProductSales);

    // Format total report
    reportContent += formatTotalReportAsText(totalProductSales);
  } catch (error) {
    throw new Error(`Error formatting product report: ${error.message}`);
  }

  return reportContent;
};

/**
 * Formats product report data as HTML
 * @param {Object} reportData - Object containing monthlyProductSales and totalProductSales
 * @returns {string} Formatted product report as HTML
 */
export const formatProductReportAsHtml = (reportData) => {
  const { monthlyProductSales, totalProductSales } = reportData;
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

  // Read and compile the template
  const templateSource = readTemplate('product_report');
  const template = Handlebars.compile(templateSource);

  // Prepare data for the template
  const sortedMonths = Array.from(monthlyProductSales.keys()).sort((a, b) => a.localeCompare(b));

  const monthsData = sortedMonths.map((monthKey) => {
    const [year, monthNumStr] = monthKey.split('-');
    const monthName = months[parseInt(monthNumStr, 10) - 1].toUpperCase();

    const productMap = monthlyProductSales.get(monthKey);
    const sortedProducts = Array.from(productMap.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name, quantity]) => ({
        name,
        quantity: quantity.toLocaleString(),
      }));

    return {
      year,
      monthName,
      products: sortedProducts,
    };
  });

  const totalProductsData = Array.from(totalProductSales.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([name, quantity]) => ({
      name,
      quantity: quantity.toLocaleString(),
    }));

  // Render the template with data
  return template({
    months: monthsData,
    totalProducts: totalProductsData,
  });
};

/**
 * Formats weekly report data as HTML
 * @param {Map} weeklySales - Map of weekly sales data
 * @returns {string} Formatted weekly report as HTML
 */
export const formatWeeklyReportAsHtml = (weeklySales) => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  // Read and compile the template
  const templateSource = readTemplate('weekly_report');
  const template = Handlebars.compile(templateSource);

  // Prepare data for the template
  const sortedDays = Array.from(weeklySales.keys()).sort((a, b) => a.localeCompare(b));

  const daysData = sortedDays.map((dayKey) => {
    const [year, month, day] = dayKey.split('-');
    const date = new Date(year, month - 1, day);
    const dayName = days[date.getDay()];

    const dailySales = weeklySales.get(dayKey);
    const products = Array.from(dailySales.keys()).sort((a, b) => a.localeCompare(b));

    // Check if there are sales for this day
    const hasSales = products.length > 0;

    let sales = [];
    let totalPrice = 0;
    let totalProfit = 0;

    if (hasSales) {
      sales = products.map((productName) => {
        const sale = dailySales.get(productName);
        totalPrice += sale.price;
        totalProfit += sale.profit;
        return {
          product: productName,
          quantity: sale.quantity.toString(),
          price: `C$${sale.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          profit: `C$${sale.profit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        };
      });
    }

    return {
      dayName,
      day,
      month,
      year,
      hasSales,
      sales,
      totalPrice: `C$${totalPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      totalProfit: `C$${totalProfit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    };
  });

  // Render the template with data
  return template({
    days: daysData,
  });
};

/**
 * Formats weekly report data as text
 * @param {Map} weeklySales - Map of weekly sales data
 * @returns {string} Formatted weekly report as text
 */
export const formatWeeklyReportAsText = (weeklySales) => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  let reportContent = 'Weekly Sales Report\n\n';
  const sortedDays = Array.from(weeklySales.keys()).sort((a, b) => a.localeCompare(b));

  sortedDays.forEach((dayKey) => {
    const [year, month, day] = dayKey.split('-');
    const date = new Date(year, month - 1, day);
    const dayName = days[date.getDay()];
    reportContent += `--- ${dayName} ${day}/${month}/${year} ---\n`;

    const dailySales = weeklySales.get(dayKey);
    const products = Array.from(dailySales.keys()).sort((a, b) => a.localeCompare(b));

    if (products.length === 0) {
      reportContent += 'No sales for this day.\n\n';
      return;
    }

    let totalPrice = 0;
    let totalProfit = 0;

    const salesData = products.map((productName) => {
      const sale = dailySales.get(productName);
      totalPrice += sale.price;
      totalProfit += sale.profit;
      return {
        product: productName,
        quantity: sale.quantity.toString(),
        price: `C$${sale.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        profit: `C$${sale.profit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      };
    });

    const headers = {
      product: 'Product',
      quantity: 'Quantity',
      price: 'Price',
      profit: 'Profit',
    };

    const totalRow = {
      product: 'Total',
      quantity: '',
      price: `C$${totalPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      profit: `C$${totalProfit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    };

    const colWidths = {
      product: Math.max(
        ...[headers.product, ...salesData.map((s) => s.product), totalRow.product].map(
          (s) => s.length,
        ),
      ),
      quantity: Math.max(
        ...[headers.quantity, ...salesData.map((s) => s.quantity)].map((s) => s.length),
      ),
      price: Math.max(
        ...[headers.price, ...salesData.map((s) => s.price), totalRow.price].map((s) => s.length),
      ),
      profit: Math.max(
        ...[headers.profit, ...salesData.map((s) => s.profit), totalRow.profit].map(
          (s) => s.length,
        ),
      ),
    };

    const rowSeparator = `+-${'-'.repeat(colWidths.product)}-+-${'-'.repeat(colWidths.quantity)}-+-${'-'.repeat(colWidths.price)}-+-${'-'.repeat(colWidths.profit)}-+\n`;

    reportContent += rowSeparator;
    reportContent += `| ${headers.product.padEnd(colWidths.product)} | ${headers.quantity.padEnd(colWidths.quantity)} | ${headers.price.padEnd(colWidths.price)} | ${headers.profit.padEnd(colWidths.profit)} |\n`;
    reportContent += rowSeparator;

    salesData.forEach((sale) => {
      reportContent += `| ${sale.product.padEnd(colWidths.product)} | ${sale.quantity.padEnd(colWidths.quantity)} | ${sale.price.padEnd(colWidths.price)} | ${sale.profit.padEnd(colWidths.profit)} |\n`;
    });

    reportContent += rowSeparator;
    reportContent += `| ${totalRow.product.padEnd(colWidths.product)} | ${totalRow.quantity.padEnd(colWidths.quantity)} | ${totalRow.price.padEnd(colWidths.price)} | ${totalRow.profit.padEnd(colWidths.profit)} |\n`;
    reportContent += rowSeparator + '\n';
  });

  return reportContent;
};

/**
 * Formats analysis report data as text
 * @param {Object} reportData - Object containing monthlyPrices and monthlyEarnings
 * @returns {string} Formatted analysis report as text
 * @throws {Error} If the input data is invalid
 */
export const formatAnalysisReportAsText = (reportData) => {
  if (!reportData || typeof reportData !== 'object') {
    throw new Error('Report data must be an object');
  }

  const { monthlyPrices, monthlyEarnings } = reportData;

  if (!monthlyPrices || !(monthlyPrices instanceof Map)) {
    throw new Error('Monthly prices data must be a Map');
  }

  if (!monthlyEarnings || !(monthlyEarnings instanceof Map)) {
    throw new Error('Monthly earnings data must be a Map');
  }

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

  // If there's no data, return a report with a message
  if (monthlyPrices.size === 0) {
    reportContent += 'No monthly data available.\n';
    reportContent += '--------------------------------------------------\n';
    return reportContent;
  }

  const sortedMonths = Array.from(monthlyPrices.keys()).sort((a, b) => a.localeCompare(b));
  let totalPricesAllTime = 0;
  let totalEarningsAllTime = 0;

  sortedMonths.forEach((monthKey) => {
    const parts = monthKey.split('-');
    if (parts.length !== 2) {
      console.warn(`Warning: Invalid month key format: ${monthKey}`);
      return;
    }

    const [year, monthNumStr] = parts;
    const monthIndex = parseInt(monthNumStr, 10) - 1;

    if (isNaN(monthIndex) || monthIndex < 0 || monthIndex >= months.length) {
      console.warn(`Warning: Invalid month number: ${monthNumStr}`);
      return;
    }

    const monthName = months[monthIndex];
    const monthlyPrice = monthlyPrices.get(monthKey) || 0;
    const monthlyEarning = monthlyEarnings.get(monthKey) || 0;

    totalPricesAllTime += monthlyPrice;
    totalEarningsAllTime += monthlyEarning;

    const formattedPrice = monthlyPrice.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    const formattedEarning = monthlyEarning.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    reportContent += `*   **${year} - ${monthName}:**\n`;
    reportContent += `    *   Sum of Prices: C$${formattedPrice}\n`;
    reportContent += `    *   Sum of Profits: C$${formattedEarning}\n\n`;
  });

  const formattedTotalPrice = totalPricesAllTime.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const formattedTotalEarning = totalEarningsAllTime.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  reportContent += '--------------------------------------------------\n';
  reportContent += 'Total Summary of All Months\n\n';
  reportContent += `*   **Total Sum of Prices:** C$${formattedTotalPrice}\n`;
  reportContent += `*   **Total Sum of Profits:** C$${formattedTotalEarning}\n`;
  reportContent += '--------------------------------------------------\n';

  return reportContent;
};

/**
 * Formats analysis report data as HTML
 * @param {Object} reportData - Object containing monthlyPrices and monthlyEarnings
 * @returns {string} Formatted analysis report as HTML
 * @throws {Error} If the input data is invalid or if the template cannot be rendered
 */
export const formatAnalysisReportAsHtml = (reportData) => {
  if (!reportData || typeof reportData !== 'object') {
    throw new Error('Report data must be an object');
  }

  const { monthlyPrices, monthlyEarnings } = reportData;

  if (!monthlyPrices || !(monthlyPrices instanceof Map)) {
    throw new Error('Monthly prices data must be a Map');
  }

  if (!monthlyEarnings || !(monthlyEarnings instanceof Map)) {
    throw new Error('Monthly earnings data must be a Map');
  }

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

  try {
    // Read and compile the template
    const templateSource = readTemplate('analysis_report');
    const template = Handlebars.compile(templateSource);

    // If there's no data, render a template with a message
    if (monthlyPrices.size === 0) {
      return template({
        months: [],
        noData: true,
        message: 'No monthly data available.',
        totalPricesAllTime: 'C$0.00',
        totalEarningsAllTime: 'C$0.00',
      });
    }

    // Prepare data for the template
    const sortedMonths = Array.from(monthlyPrices.keys()).sort((a, b) => a.localeCompare(b));
    let totalPricesAllTime = 0;
    let totalEarningsAllTime = 0;

    const monthsData = sortedMonths
      .map((monthKey) => {
        const parts = monthKey.split('-');
        if (parts.length !== 2) {
          console.warn(`Warning: Invalid month key format: ${monthKey}`);
          return null;
        }

        const [year, monthNumStr] = parts;
        const monthIndex = parseInt(monthNumStr, 10) - 1;

        if (isNaN(monthIndex) || monthIndex < 0 || monthIndex >= months.length) {
          console.warn(`Warning: Invalid month number: ${monthNumStr}`);
          return null;
        }

        const monthName = months[monthIndex];
        const monthlyPrice = monthlyPrices.get(monthKey) || 0;
        const monthlyEarning = monthlyEarnings.get(monthKey) || 0;

        totalPricesAllTime += monthlyPrice;
        totalEarningsAllTime += monthlyEarning;

        const formattedPrice = monthlyPrice.toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });

        const formattedEarning = monthlyEarning.toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });

        return {
          year,
          monthName,
          monthlyPrice: `C$${formattedPrice}`,
          monthlyEarning: `C$${formattedEarning}`,
        };
      })
      .filter((item) => item !== null);

    const formattedTotalPrice = totalPricesAllTime.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    const formattedTotalEarning = totalEarningsAllTime.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    // Render the template with data
    return template({
      months: monthsData,
      noData: monthsData.length === 0,
      message: monthsData.length === 0 ? 'No valid monthly data available.' : '',
      totalPricesAllTime: `C$${formattedTotalPrice}`,
      totalEarningsAllTime: `C$${formattedTotalEarning}`,
    });
  } catch (error) {
    throw new Error(`Failed to format analysis report as HTML: ${error.message}`);
  }
};
