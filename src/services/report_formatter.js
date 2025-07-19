/**
 * Report formatter module
 * This module contains functions to format report data into different output formats (txt, html, etc.)
 */

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

  let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Products Sold Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    h1 { color: #333; text-align: center; }
    h2 { color: #0066cc; margin-top: 30px; }
    .month { margin-bottom: 30px; }
    .month-title { font-weight: bold; color: #0066cc; font-size: 1.2em; margin-bottom: 10px; }
    .product-list { margin-left: 20px; }
    .product-item { display: flex; justify-content: space-between; margin-bottom: 5px; }
    .product-name { flex-grow: 1; }
    .product-quantity { min-width: 100px; text-align: right; }
    .total-section { margin-top: 30px; border-top: 1px solid #ccc; padding-top: 20px; }
  </style>
</head>
<body>
  <h1>Report of Products Sold</h1>

  <div class="monthly-data">`;

  const sortedMonths = Array.from(monthlyProductSales.keys()).sort();

  sortedMonths.forEach((monthKey) => {
    const [year, monthNumStr] = monthKey.split('-');
    const monthName = months[parseInt(monthNumStr, 10) - 1];

    html += `
    <div class="month">
      <div class="month-title">${monthName.toUpperCase()} ${year}</div>
      <div class="product-list">`;

    const productMap = monthlyProductSales.get(monthKey);
    const sortedProducts = Array.from(productMap.entries()).sort((a, b) => b[1] - a[1]);

    sortedProducts.forEach(([productName, quantity]) => {
      html += `
        <div class="product-item">
          <span class="product-name">${productName}</span>
          <span class="product-quantity">${quantity.toLocaleString()}</span>
        </div>`;
    });

    html += `
      </div>
    </div>`;
  });

  html += `
  </div>

  <div class="total-section">
    <h2>Total Summary of Products Sold</h2>
    <div class="product-list">`;

  const sortedTotalProducts = Array.from(totalProductSales.entries()).sort((a, b) => b[1] - a[1]);

  sortedTotalProducts.forEach(([productName, quantity]) => {
    html += `
      <div class="product-item">
        <span class="product-name">${productName}</span>
        <span class="product-quantity">${quantity.toLocaleString()}</span>
      </div>`;
  });

  html += `
    </div>
  </div>
</body>
</html>`;

  return html;
};

/**
 * Formats weekly report data as HTML
 * @param {Map} weeklySales - Map of weekly sales data
 * @returns {string} Formatted weekly report as HTML
 */
export const formatWeeklyReportAsHtml = (weeklySales) => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Weekly Sales Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    h1 { color: #333; text-align: center; }
    .day { margin-bottom: 30px; }
    .day-title { font-weight: bold; color: #0066cc; font-size: 1.2em; margin-bottom: 10px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
    th { background-color: #f2f2f2; font-weight: bold; }
    tr:hover { background-color: #f5f5f5; }
    .total-row { font-weight: bold; background-color: #e6f2ff; }
    .no-sales { font-style: italic; color: #666; }
  </style>
</head>
<body>
  <h1>Weekly Sales Report</h1>`;

  const sortedDays = Array.from(weeklySales.keys()).sort();

  sortedDays.forEach((dayKey) => {
    const [year, month, day] = dayKey.split('-');
    const date = new Date(year, month - 1, day);
    const dayName = days[date.getDay()];

    html += `
  <div class="day">
    <div class="day-title">${dayName} ${day}/${month}/${year}</div>`;

    const dailySales = weeklySales.get(dayKey);
    const products = Array.from(dailySales.keys()).sort();

    if (products.length === 0) {
      html += `
    <p class="no-sales">No sales for this day.</p>`;
    } else {
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

      html += `
    <table>
      <thead>
        <tr>
          <th>Product</th>
          <th>Quantity</th>
          <th>Price</th>
          <th>Profit</th>
        </tr>
      </thead>
      <tbody>`;

      salesData.forEach((sale) => {
        html += `
        <tr>
          <td>${sale.product}</td>
          <td>${sale.quantity}</td>
          <td>${sale.price}</td>
          <td>${sale.profit}</td>
        </tr>`;
      });

      html += `
        <tr class="total-row">
          <td>Total</td>
          <td></td>
          <td>C$${totalPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
          <td>C$${totalProfit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
        </tr>
      </tbody>
    </table>`;
    }

    html += `
  </div>`;
  });

  html += `
</body>
</html>`;

  return html;
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

  let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sales Analysis Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    h1 { color: #333; }
    .month { margin-bottom: 15px; }
    .month-title { font-weight: bold; color: #0066cc; }
    .summary { margin-top: 30px; border-top: 1px solid #ccc; padding-top: 20px; }
    .total { font-weight: bold; }
  </style>
</head>
<body>
  <h1>Updated Monthly Summary (Total Price and Total Profit)</h1>
  <div class="monthly-data">`;

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

    html += `
    <div class="month">
      <div class="month-title">${year} - ${monthName}</div>
      <div>Sum of Prices: C$${monthlyPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
      <div>Sum of Profits: C$${monthlyEarning.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
    </div>`;
  });

  html += `
  </div>
  <div class="summary">
    <h2>Total Summary of All Months</h2>
    <div class="total">Total Sum of Prices: C$${totalPricesAllTime.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
    <div class="total">Total Sum of Profits: C$${totalEarningsAllTime.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
  </div>
</body>
</html>`;

  return html;
};
