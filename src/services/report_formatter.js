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
 */
const readTemplate = (templateName) => {
  const templatePath = path.resolve(__dirname, '..', '..', 'templates', `${templateName}.hbs`);
  return fs.readFileSync(templatePath, 'utf8');
};

/**
 * Formats monthly report data as text
 * @param {Map} monthlyProductSales - Map of monthly product sales data
 * @returns {string} Formatted monthly report as text
 */
export const formatMonthlyReportAsText = (monthlyProductSales) => {
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
  const sortedMonths = Array.from(monthlyProductSales.keys()).sort();

  sortedMonths.forEach((monthKey) => {
    const [year, monthNumStr] = monthKey.split('-');
    const monthName = months[parseInt(monthNumStr, 10) - 1];
    reportContent += `--- ${monthName.toUpperCase()} ${year} ---\n`;

    const productMap = monthlyProductSales.get(monthKey);
    const sortedProducts = Array.from(productMap.entries()).sort((a, b) => b[1] - a[1]);

    const maxProductNameLength = Math.max(
      ...sortedProducts.map(([productName]) => productName.length),
    );

    sortedProducts.forEach(([productName, quantity]) => {
      const paddedProductName = productName.padEnd(maxProductNameLength, ' ');
      reportContent += `  ${paddedProductName}: ${quantity.toLocaleString()}\n`;
    });
    reportContent += '\n';
  });

  return reportContent;
};

/**
 * Formats total report data as text
 * @param {Map} totalProductSales - Map of total product sales data
 * @returns {string} Formatted total report as text
 */
export const formatTotalReportAsText = (totalProductSales) => {
  let reportContent = '==================================================\n';
  reportContent += '        TOTAL SUMMARY OF PRODUCTS SOLD       \n';
  reportContent += '==================================================\n\n';

  const sortedTotalProducts = Array.from(totalProductSales.entries()).sort((a, b) => b[1] - a[1]);

  const maxTotalProductNameLength = Math.max(
    ...sortedTotalProducts.map(([productName]) => productName.length),
  );

  sortedTotalProducts.forEach(([productName, quantity]) => {
    const paddedProductName = productName.padEnd(maxTotalProductNameLength, ' ');
    reportContent += `  ${paddedProductName}: ${quantity.toLocaleString()}\n`;
  });
  reportContent += '\n==================================================\n';

  return reportContent;
};

/**
 * Formats product report data as text
 * @param {Object} reportData - Object containing monthlyProductSales and totalProductSales
 * @returns {string} Formatted product report as text
 */
export const formatProductReportAsText = (reportData) => {
  const { monthlyProductSales, totalProductSales } = reportData;

  let reportContent = '==================================================\n';
  reportContent += '        REPORT OF PRODUCTS SOLD           \n';
  reportContent += '==================================================\n\n';

  reportContent += formatMonthlyReportAsText(monthlyProductSales);
  reportContent += formatTotalReportAsText(totalProductSales);

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
  const sortedMonths = Array.from(monthlyProductSales.keys()).sort();

  const monthsData = sortedMonths.map(monthKey => {
    const [year, monthNumStr] = monthKey.split('-');
    const monthName = months[parseInt(monthNumStr, 10) - 1].toUpperCase();

    const productMap = monthlyProductSales.get(monthKey);
    const sortedProducts = Array.from(productMap.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name, quantity]) => ({
        name,
        quantity: quantity.toLocaleString()
      }));

    return {
      year,
      monthName,
      products: sortedProducts
    };
  });

  const totalProductsData = Array.from(totalProductSales.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([name, quantity]) => ({
      name,
      quantity: quantity.toLocaleString()
    }));

  // Render the template with data
  return template({
    months: monthsData,
    totalProducts: totalProductsData
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
  const sortedDays = Array.from(weeklySales.keys()).sort();

  const daysData = sortedDays.map(dayKey => {
    const [year, month, day] = dayKey.split('-');
    const date = new Date(year, month - 1, day);
    const dayName = days[date.getDay()];

    const dailySales = weeklySales.get(dayKey);
    const products = Array.from(dailySales.keys()).sort();

    // Check if there are sales for this day
    const hasSales = products.length > 0;

    let sales = [];
    let totalPrice = 0;
    let totalProfit = 0;

    if (hasSales) {
      sales = products.map(productName => {
        const sale = dailySales.get(productName);
        totalPrice += sale.price;
        totalProfit += sale.profit;
        return {
          product: productName,
          quantity: sale.quantity.toString(),
          price: `C$${sale.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          profit: `C$${sale.profit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
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
      totalProfit: `C$${totalProfit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    };
  });

  // Render the template with data
  return template({
    days: daysData
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
  const sortedDays = Array.from(weeklySales.keys()).sort();

  sortedDays.forEach((dayKey) => {
    const [year, month, day] = dayKey.split('-');
    const date = new Date(year, month - 1, day);
    const dayName = days[date.getDay()];
    reportContent += `--- ${dayName} ${day}/${month}/${year} ---\n`;

    const dailySales = weeklySales.get(dayKey);
    const products = Array.from(dailySales.keys()).sort();

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
 */
export const formatAnalysisReportAsText = (reportData) => {
  const { monthlyPrices, monthlyEarnings } = reportData;
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

/**
 * Formats analysis report data as HTML
 * @param {Object} reportData - Object containing monthlyPrices and monthlyEarnings
 * @returns {string} Formatted analysis report as HTML
 */
export const formatAnalysisReportAsHtml = (reportData) => {
  const { monthlyPrices, monthlyEarnings } = reportData;
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
  const templateSource = readTemplate('analysis_report');
  const template = Handlebars.compile(templateSource);

  // Prepare data for the template
  const sortedMonths = Array.from(monthlyPrices.keys()).sort();
  let totalPricesAllTime = 0;
  let totalEarningsAllTime = 0;

  const monthsData = sortedMonths.map(monthKey => {
    const [year, monthNumStr] = monthKey.split('-');
    const monthName = months[parseInt(monthNumStr, 10) - 1];
    const monthlyPrice = monthlyPrices.get(monthKey);
    const monthlyEarning = monthlyEarnings.get(monthKey);

    totalPricesAllTime += monthlyPrice;
    totalEarningsAllTime += monthlyEarning;

    return {
      year,
      monthName,
      monthlyPrice: `C$${monthlyPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      monthlyEarning: `C$${monthlyEarning.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    };
  });

  // Render the template with data
  return template({
    months: monthsData,
    totalPricesAllTime: `C$${totalPricesAllTime.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    totalEarningsAllTime: `C$${totalEarningsAllTime.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  });
};
