

import fs from 'fs';
import csv from 'csv-parser';
import path from 'path';
import { pathToFileURL } from 'url';

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

const processWeeklySalesData = (data, gainsMap) => {
  const weeklySales = new Map();
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  data.forEach((row) => {
    try {
      if (row.length < 5) return;

      const productName = row[0].trim();
      const quantityStr = row[1].replace(/"/g, '').replace(/,/g, '').trim();
      const priceStr = row[2];
      const dateStr = row[3];
      const gananciaStr = row[4];

      const dateParts = dateStr.split('/');
      if (dateParts.length < 3) return;

      const month = parseInt(dateParts[0], 10) - 1;
      const day = parseInt(dateParts[1], 10);
      const year = parseInt(dateParts[2], 10);

      if (isNaN(month) || isNaN(day) || isNaN(year)) return;

      const saleDate = new Date(year, month, day);

      if (saleDate >= startOfWeek && saleDate <= endOfWeek) {
        const dayKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        if (!weeklySales.has(dayKey)) {
          weeklySales.set(dayKey, new Map());
        }

        const dailySales = weeklySales.get(dayKey);
        const cleanedPriceStr = priceStr.replace(/[^\d.]/g, '');
        const price = cleanedPriceStr ? parseFloat(cleanedPriceStr) : 0.0;
        const quantity = parseFloat(quantityStr);

        let finalGanancia = 0.0;
        const cleanedGananciaStr = gananciaStr.replace(/[^\d.]/g, '');

        if (cleanedGananciaStr) {
          finalGanancia = parseFloat(cleanedGananciaStr);
        } else if (price === 0) {
          finalGanancia = 0;
        } else if (gainsMap && gainsMap.has(productName)) {
          try {
            const quantityLookupKey = String(parseInt(quantity, 10));
            if (gainsMap.get(productName).has(quantityLookupKey)) {
              finalGanancia = gainsMap.get(productName).get(quantityLookupKey);
            }
          } catch (error) {
            // ignore value errors
          }
        }

        if (!dailySales.has(productName)) {
          dailySales.set(productName, { quantity: 0, price: 0, ganancia: 0 });
        }

        const productSales = dailySales.get(productName);
        productSales.quantity += quantity;
        productSales.price += price;
        productSales.ganancia += finalGanancia;
      }
    } catch (error) {
      // ignore value and index errors
    }
  });

  return weeklySales;
};

const generateWeeklyReport = (weeklySales) => {
  const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  let reportContent = 'Reporte de Ventas Semanal\n\n';
  const sortedDays = Array.from(weeklySales.keys()).sort();

  sortedDays.forEach((dayKey) => {
    const [year, month, day] = dayKey.split('-');
    const date = new Date(year, month - 1, day);
    const dayName = dias[date.getDay()];
    reportContent += `--- ${dayName} ${day}/${month}/${year} ---\n`;

    const dailySales = weeklySales.get(dayKey);
    const products = Array.from(dailySales.keys()).sort();

    if (products.length === 0) {
      reportContent += 'No hay ventas para este día.\n\n';
      return;
    }

    let totalPrice = 0;
    let totalGanancia = 0;

    const salesData = products.map(productName => {
        const sale = dailySales.get(productName);
        totalPrice += sale.price;
        totalGanancia += sale.ganancia;
        return {
            product: productName,
            quantity: sale.quantity.toString(),
            price: `C${sale.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            ganancia: `C${sale.ganancia.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        };
    });

    const headers = {
        product: 'Producto',
        quantity: 'Cantidad',
        price: 'Precio',
        ganancia: 'Ganancia'
    };

    const totalRow = {
        product: 'Total',
        quantity: '',
        price: `C${totalPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        ganancia: `C${totalGanancia.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    };

    const colWidths = {
        product: Math.max(...[headers.product, ...salesData.map(s => s.product), totalRow.product].map(s => s.length)),
        quantity: Math.max(...[headers.quantity, ...salesData.map(s => s.quantity)].map(s => s.length)),
        price: Math.max(...[headers.price, ...salesData.map(s => s.price), totalRow.price].map(s => s.length)),
        ganancia: Math.max(...[headers.ganancia, ...salesData.map(s => s.ganancia), totalRow.ganancia].map(s => s.length)),
    };

    const rowSeparator = `+-${'-'.repeat(colWidths.product)}-+-${'-'.repeat(colWidths.quantity)}-+-${'-'.repeat(colWidths.price)}-+-${'-'.repeat(colWidths.ganancia)}-+\n`;

    reportContent += rowSeparator;
    reportContent += `| ${headers.product.padEnd(colWidths.product)} | ${headers.quantity.padEnd(colWidths.quantity)} | ${headers.price.padEnd(colWidths.price)} | ${headers.ganancia.padEnd(colWidths.ganancia)} |\n`;
    reportContent += rowSeparator;

    salesData.forEach(sale => {
        reportContent += `| ${sale.product.padEnd(colWidths.product)} | ${sale.quantity.padEnd(colWidths.quantity)} | ${sale.price.padEnd(colWidths.price)} | ${sale.ganancia.padEnd(colWidths.ganancia)} |\n`;
    });

    reportContent += rowSeparator;
    reportContent += `| ${totalRow.product.padEnd(colWidths.product)} | ${totalRow.quantity.padEnd(colWidths.quantity)} | ${totalRow.price.padEnd(colWidths.price)} | ${totalRow.ganancia.padEnd(colWidths.ganancia)} |\n`;
    reportContent += rowSeparator + '\n';
  });

  return reportContent;
};

const generateWeeklySalesReport = async () => {
  const gainsListPath = 'C:\\Users\\Reynaldo\\test-gemini\\lista.txt';
  const salesCsvPath = path.join(process.cwd(), 'Negocio Bolsas.csv');
  const outputFile = path.join(process.cwd(), 'reporte_semanal.txt');

  try {
    const gainsData = parseGainsList(gainsListPath);
    if (gainsData === null) return;

    const data = await readSalesData(salesCsvPath);
    const weeklySales = processWeeklySalesData(data, gainsData);
    const reportContent = generateWeeklyReport(weeklySales);

    fs.writeFileSync(outputFile, reportContent, 'utf-8');
    console.log(`Report saved successfully to ${outputFile}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
  }
};

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  generateWeeklySalesReport();
}

