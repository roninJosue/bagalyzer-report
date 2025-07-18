import { leerArchivo } from '../utils/file_handler.js';
import csv from 'csv-parser';
import fs from 'fs';

// Helper function to get a safe, trimmed string value
const getSafeValue = (value) => {
  return (value !== undefined && value !== null) ? String(value).trim() : '';
};

const parseGainsList = (filePath) => {
  const gainsMap = new Map();
  try {
    const fileContent = leerArchivo(filePath);
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

const processSalesData = (data, gainsMap) => {
  const monthlyPrices = new Map();
  const monthlyEarnings = new Map();

  data.forEach((row, index) => {
    // Asegurarse de que row sea un array y tenga suficientes elementos
    if (!Array.isArray(row) || row.length < 5) {
      console.warn(`Advertencia: Omitiendo la fila #${index + 1} del CSV por formato inesperado o datos insuficientes.`);
      return;
    }

    try {
      // Usar valores por defecto para evitar errores en datos nulos o indefinidos
      const productName = getSafeValue(row[0]);
      const quantityStr = getSafeValue(row[1]).replace(/"/g, '').replace(/,/g, '');
      const priceStr = getSafeValue(row[2]) || '0';
      const dateStr = getSafeValue(row[3]);
      const gananciaStr = getSafeValue(row[4]) || '0';

      // Si faltan datos esenciales como el nombre o la fecha, omitir la fila
      if (!productName || !dateStr) {
        console.warn(`Advertencia: Omitiendo la fila #${index + 1} del CSV por falta de datos (producto o fecha).`);
        return;
      }

      const cleanedPriceStr = priceStr.replace(/[^\d.]/g, '');
      const price = cleanedPriceStr ? parseFloat(cleanedPriceStr) : 0.0;

      const dateParts = dateStr.split('/');
      if (dateParts.length < 3) {
        console.warn(`Advertencia: Omitiendo la fila #${index + 1} del CSV por formato de fecha inválido.`);
        return;
      }

      const month = parseInt(dateParts[0], 10);
      const day = parseInt(dateParts[1], 10);
      const year = parseInt(dateParts[2], 10);

      if (isNaN(month) || isNaN(day) || isNaN(year)) {
        console.warn(`Advertencia: Omitiendo la fila #${index + 1} del CSV por componentes de fecha inválidos.`);
        return;
      }

      const monthKey = `${year}-${String(month).padStart(2, '0')}`;

      let finalGanancia = 0.0;
      const cleanedGananciaStr = gananciaStr.replace(/[^\d.]/g, '');

      if (cleanedGananciaStr !== "0") {
        finalGanancia = parseFloat(cleanedGananciaStr);
      } else if (price === 0) {
        finalGanancia = 0;
      } else if (gainsMap && gainsMap.has(productName)) {
        const quantity = parseFloat(quantityStr);
        // Solo buscar si la cantidad es un número válido
        if (!isNaN(quantity)) {
          try {
            const quantityLookupKey = String(parseInt(quantity, 10));
            if (gainsMap.get(productName).has(quantityLookupKey)) {
              finalGanancia = gainsMap.get(productName).get(quantityLookupKey);
            }
          } catch (error) {
            // ignorar errores de lookup
          }
        }
      }

      monthlyPrices.set(monthKey, (monthlyPrices.get(monthKey) || 0) + price);
      monthlyEarnings.set(monthKey, (monthlyEarnings.get(monthKey) || 0) + finalGanancia);
    } catch (error) {
      console.warn(`Advertencia: Se omitió la fila #${index + 1} en el CSV debido a un error inesperado: ${error.message}`);
    }
  });

  return { monthlyPrices, monthlyEarnings };
};

const generateReport = (monthlyPrices, monthlyEarnings) => {
  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  let reportContent = 'Resumen Mensual Actualizado (Precio Total y Ganancia Total)\n\n';
  const sortedMonths = Array.from(monthlyPrices.keys()).sort();
  let totalPricesAllTime = 0;
  let totalEarningsAllTime = 0;

  sortedMonths.forEach((monthKey) => {
    const [year, monthNumStr] = monthKey.split('-');
    const monthName = meses[parseInt(monthNumStr, 10) - 1];
    const monthlyPrice = monthlyPrices.get(monthKey);
    const monthlyEarning = monthlyEarnings.get(monthKey);
    totalPricesAllTime += monthlyPrice;
    totalEarningsAllTime += monthlyEarning;

    reportContent += `*   **${year} - ${monthName}:**\n`;
    reportContent += `    *   Suma de Precios: C$${monthlyPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n`;
    reportContent += `    *   Suma de Ganancias: C$${monthlyEarning.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n\n`;
  });

  reportContent += '--------------------------------------------------\n';
  reportContent += 'Resumen Total de Todos los Meses\n\n';
  reportContent += `*   **Suma Total de Precios:** C$${totalPricesAllTime.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n`;
  reportContent += `*   **Suma Total de Ganancias:** C$${totalEarningsAllTime.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n`;
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
export {
  parseGainsList,
  readSalesData,
  processSalesData,
  generateReport,
  generateAnalysisReport
};
