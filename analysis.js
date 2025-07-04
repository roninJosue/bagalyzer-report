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

            if (parts.length > 1 && parts[1].trim()) {
                const rulesPart = parts[1].trim();
                const rules = rulesPart.split(',');

                if (!gainsMap.has(productName)) {
                    gainsMap.set(productName, new Map());
                }

                for (const rule of rules) {
                    if (rule.includes(':')) {
                        try {
                            const [quantity, gain] = rule.split(':');
                            gainsMap.get(productName).set(quantity.trim(), parseFloat(gain.trim()));
                        } catch (error) {
                            // Continue on value error
                        }
                    }
                }
            }
        }
    } catch (error) {
        if (error.code === 'ENOENT') {
            console.error(`Error: Gains list file not found at ${filePath}`);
            return null;
        }
        throw error;
    }
    return gainsMap;
}

function analyzeSales(salesFile, gainsMap) {
    const monthlyPrices = new Map();
    const monthlyEarnings = new Map();
    const meses = [
        "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];

    const data = [];
    fs.createReadStream(salesFile)
        .pipe(csv({ headers: false }))
        .on('data', (row) => {
            data.push(Object.values(row));
        })
        .on('end', () => {
            for (const row of data) {
                try {
                    if (row.length < 5) {
                        continue;
                    }

                    const productName = row[0].trim();
                    const quantityStr = row[1].replace(/"/g, '').replace(/,/g, '').trim();
                    const priceStr = row[2];
                    const dateStr = row[3];
                    const ganancia_str = row[4];

                    const cleanedPriceStr = priceStr.replace(/[^\d.]/g, '');
                    const price = cleanedPriceStr ? parseFloat(cleanedPriceStr) : 0.0;

                    const dateParts = dateStr.split('/');
                    if (dateParts.length < 3) {
                        continue;
                    }
                    const month = parseInt(dateParts[1], 10);
                    const year = parseInt(dateParts[2], 10);
                    const monthKey = `${year}-${String(month).padStart(2, '0')}`;

                    let finalGanancia = 0.0;
                    const cleanedGananciaStr = ganancia_str.replace(/[^\d.]/g, '');
                    const gananciaFromFile = cleanedGananciaStr ? parseFloat(cleanedGananciaStr) : 0.0;

                    if (gananciaFromFile > 0) {
                        finalGanancia = gananciaFromFile;
                    } else if (gainsMap && gainsMap.has(productName)) {
                        const productGains = gainsMap.get(productName);
                        if (productGains.has(quantityStr)) {
                            finalGanancia = productGains.get(quantityStr);
                        }
                    }

                    monthlyPrices.set(monthKey, (monthlyPrices.get(monthKey) || 0) + price);
                    monthlyEarnings.set(monthKey, (monthlyEarnings.get(monthKey) || 0) + finalGanancia);

                } catch (error) {
                    // Continue on value or index error
                }
            }

            // --- Prepare Report Content ---
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
                reportContent += `    *   Suma de Precios: C${monthlyPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n`;
                reportContent += `    *   Suma de Ganancias: C${monthlyEarning.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n\n`;
            }

            // --- Prepare Grand Totals ---
            reportContent += "--------------------------------------------------\n";
            reportContent += "Resumen Total de Todos los Meses\n\n";
            reportContent += `*   **Suma Total de Precios:** C${totalPricesAllTime.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n`;
            reportContent += `*   **Suma Total de Ganancias:** C${totalEarningsAllTime.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n`;
            reportContent += "--------------------------------------------------\n";

            // --- Write to File ---
            const today = new Date();
            const day = String(today.getDate()).padStart(2, '0');
            const month = String(today.getMonth() + 1).padStart(2, '0');
            const year = today.getFullYear();
            const fileName = `ventas_${day}-${month}-${year}.txt`;
            const filePath = path.join(__dirname, fileName);

            fs.writeFile(filePath, reportContent, (err) => {
                if (err) {
                    console.error("Error writing to file:", err);
                } else {
                    console.log(`Report saved to ${filePath}`);
                }
            });
        })
        .on('error', (error) => {
            if (error.code === 'ENOENT') {
                console.error(`Error: Sales file not found at ${salesFile}`);
            } else {
                throw error;
            }
        });
}

if (require.main === module) {
    const gainsListPath = 'C:\\Users\\Reynaldo\\test-gemini\\lista.txt';
    const salesCsvPath = 'C:\\Users\\Reynaldo\\test-gemini\\Negocio Bolsas.csv';

    const gainsData = parseGainsList(gainsListPath);
    if (gainsData !== null) {
        analyzeSales(salesCsvPath, gainsData);
    }
}
