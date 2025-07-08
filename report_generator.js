import fs from 'fs';
import csv from 'csv-parser';
import path from 'path';
import { pathToFileURL } from 'url';

const readSalesData = (salesFile) => new Promise((resolve, reject) => {
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

  data.forEach((row) => {
    try {
      if (row.length < 4) return;

      const productName = row[0].trim();
      const quantityStr = row[1].replace(/"/g, '').replace(/,/g, '').trim();
      const dateStr = row[3];

      const quantity = parseFloat(quantityStr);
      if (isNaN(quantity)) return;

      const dateParts = dateStr.split('/');
      if (dateParts.length < 3) return;

      const month = parseInt(dateParts[0], 10);
      const year = parseInt(dateParts[2], 10);
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
  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  let reportContent = '';
  const sortedMonths = Array.from(monthlyProductSales.keys()).sort();

  sortedMonths.forEach((monthKey) => {
    const [year, monthNumStr] = monthKey.split('-');
    const monthName = meses[parseInt(monthNumStr, 10) - 1];
    reportContent += `--- ${monthName.toUpperCase()} ${year} ---\n`;

    const productMap = monthlyProductSales.get(monthKey);
    const sortedProducts = Array.from(productMap.entries()).sort((a, b) => b[1] - a[1]);

    const maxProductNameLength = Math.max(...sortedProducts.map(([productName]) => productName.length));

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
  reportContent += '        RESUMEN TOTAL DE PRODUCTOS VENDIDOS       \n';
  reportContent += '==================================================\n\n';

  const sortedTotalProducts = Array.from(totalProductSales.entries()).sort((a, b) => b[1] - a[1]);

  const maxTotalProductNameLength = Math.max(...sortedTotalProducts.map(([productName]) => productName.length));

  sortedTotalProducts.forEach(([productName, quantity]) => {
    const paddedProductName = productName.padEnd(maxTotalProductNameLength, ' ');
    reportContent += `  ${paddedProductName}: ${quantity.toLocaleString()}\n`;
  });
  reportContent += '\n==================================================\n';

  return reportContent;
};

const generateProductReport = async () => {
  const salesFile = path.join(process.cwd(), 'Negocio Bolsas.csv');
  const outputFile = path.join(process.cwd(), 'reports_by_products.txt');

  try {
    const data = await readSalesData(salesFile);
    const { monthlyProductSales, totalProductSales } = processSalesData(data);

    let reportContent = '==================================================\n';
    reportContent += '        REPORTE DE PRODUCTOS VENDIDOS           \n';
    reportContent += '==================================================\n\n';

    reportContent += generateMonthlyReport(monthlyProductSales);
    reportContent += generateTotalReport(totalProductSales);

    fs.writeFileSync(outputFile, reportContent, 'utf-8');
    console.log(`Report saved successfully to ${outputFile}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
  }
};

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  generateProductReport();
}
