import csv from 'csv-parser';
import fs from 'fs';
import path from 'path';

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

const processSalesData = (data) => {
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

const generateTotalReport = (totalProductSales) => {
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

export const generateProductReportContent = async (salesFile) => {
  const data = await readSalesData(salesFile);
  const { monthlyProductSales, totalProductSales } = processSalesData(data);

  let reportContent = '==================================================\n';
  reportContent += '        REPORT OF PRODUCTS SOLD           \n';
  reportContent += '==================================================\n\n';

  reportContent += generateMonthlyReport(monthlyProductSales);
  reportContent += generateTotalReport(totalProductSales);

  return reportContent;
};

export const generateWeeklySalesReportContent = async (salesFile, gainsListPath) => {
  try {
    const gainsData = parseGainsList(gainsListPath);
    if (gainsData === null) return null;

    const data = await readSalesData(salesFile);
    const weeklySales = processWeeklySalesData(data, gainsData);
    const reportContent = generateWeeklyReport(weeklySales);

    return reportContent;
  } catch (error) {
    console.error(`Error: ${error.message}`);
    return null;
  }
};
