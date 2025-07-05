const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');

function parseGainsList(filePath) {
    const gainsMap = new Map();
    try {
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const lines = fileContent.split('\n');

        for (const line of lines) {
            const trimmedLine = line.trim();
            if (!trimmedLine) {
                continue;
            }

            const parts = trimmedLine.split(/\s{2,}/, 2);
            const productName = parts[0].trim();
            gainsMap.set(productName, new Map());

            if (parts.length > 1 && parts[1].trim()) {
                const rulesPart = parts[1].trim();
                const rules = rulesPart.split(',');
                for (const rule of rules) {
                    if (rule.includes(':')) {
                        try {
                            const [quantity, gain] = rule.split(':');
                            gainsMap.get(productName).set(quantity.trim(), parseFloat(gain.trim()));
                        } catch (error) {
                            // ignore value errors
                        }
                    }
                }
            }
        }
    } catch (error) {
        console.error(`Error: Gains list file not found at ${filePath}`);
        return null;
    }
    return gainsMap;
}

async function analyzeSales(salesFile, gainsMap) {
    const monthlyPrices = new Map();
    const monthlyEarnings = new Map();
    const meses = [
        "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];

    if (!fs.existsSync(salesFile)) {
        console.error(`Error: Sales file not found at ${salesFile}`);
        return;
    }

    const data = [];
    await new Promise((resolve, reject) => {
        fs.createReadStream(salesFile)
            .pipe(csv({ header: false }))
            .on('data', (row) => data.push(Object.values(row)))
            .on('end', resolve)
            .on('error', reject);
    });

    for (const row of data) {
        try {
            if (row.length < 5) {
                continue;
            }

            const productName = row[0].trim();
            const quantityStr = row[1].replace(/\"/g, '').replace(/,/g, '').trim();
            const priceStr = row[2];
            const dateStr = row[3];
            const gananciaStr = row[4];

            const cleanedPriceStr = priceStr.replace(/[^\d.]/g, '');
            const price = cleanedPriceStr ? parseFloat(cleanedPriceStr) : 0.0;

            const dateParts = dateStr.split('/');
            if (dateParts.length < 3) {
                continue;
            }
            const month = parseInt(dateParts[0], 10);
            const day = parseInt(dateParts[1], 10);
            const year = parseInt(dateParts[2], 10);

            if (isNaN(month) || isNaN(day) || isNaN(year)) {
                continue;
            }

            const monthKey = `${year}-${String(month).padStart(2, '0')}`;

            let finalGanancia = 0.0;
            const cleanedGananciaStr = gananciaStr.replace(/[^\d.]/g, '');

            if (cleanedGananciaStr) {
                finalGanancia = parseFloat(cleanedGananciaStr);
            } else if (price === 0) {
                finalGanancia = 0;
            } else if (gainsMap && gainsMap.has(productName)) {
                try {
                    const quantityLookupKey = String(parseInt(parseFloat(quantityStr), 10));
                    if (gainsMap.get(productName).has(quantityLookupKey)) {
                        finalGanancia = gainsMap.get(productName).get(quantityLookupKey);
                    }
                } catch (error) {
                    // ignore value errors
                }
            }

            monthlyPrices.set(monthKey, (monthlyPrices.get(monthKey) || 0) + price);
            monthlyEarnings.set(monthKey, (monthlyEarnings.get(monthKey) || 0) + finalGanancia);

        } catch (error) {
            // ignore value and index errors
        }
    }

    let reportContent = "Resumen Mensual Actualizado (Precio Total y Ganancia Total)\n\n";
    const sortedMonths = Array.from(monthlyPrices.keys()).sort();
    let totalPricesAllTime = 0;
    let totalEarningsAllTime = 0;

    for (const monthKey of sortedMonths) {
        const [year, monthNumStr] = monthKey.split('-');
        const monthName = meses[parseInt(monthNumStr, 10) - 1];
        const monthlyPrice = monthlyPrices.get(monthKey);
        const monthlyEarning = monthlyEarnings.get(monthKey);
        totalPricesAllTime += monthlyPrice;
        totalEarningsAllTime += monthlyEarning;

        reportContent += `*   **${year} - ${monthName}:**\n`;
        reportContent += `    *   Suma de Precios: C$${monthlyPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n`;
        reportContent += `    *   Suma de Ganancias: C$${monthlyEarning.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n\n`;
    }

    reportContent += "--------------------------------------------------\n";
    reportContent += "Resumen Total de Todos los Meses\n\n";
    reportContent += `*   **Suma Total de Precios:** C$${totalPricesAllTime.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n`;
    reportContent += `*   **Suma Total de Ganancias:** C$${totalEarningsAllTime.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n`;
    reportContent += "--------------------------------------------------\n";

    try {
        fs.writeFileSync('reporte_de_ventas.txt', reportContent, 'utf-8');
        console.log("Report saved successfully to reporte_de_ventas.txt");
    } catch (error) {
        console.error(`Error writing report to file: ${error}`);
    }
}

if (require.main === module) {
    const gainsListPath = 'C:\\Users\\Reynaldo\\test-gemini\\lista.txt';
    const salesCsvPath = 'C:\\Users\\Reynaldo\\test-gemini\\Negocio Bolsas.csv';

    const gainsData = parseGainsList(gainsListPath);
    if (gainsData !== null) {
        analyzeSales(salesCsvPath, gainsData);
    }
}