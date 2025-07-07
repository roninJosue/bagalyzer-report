const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');

async function generateProductReport() {
    const salesFile = path.join(__dirname, 'Negocio Bolsas.csv');
    const outputFile = path.join(__dirname, 'reports_by_products.txt');
    const monthlyProductSales = new Map();
    const totalProductSales = new Map();
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
            if (row.length < 4) continue;

            const productName = row[0].trim();
            const quantityStr = row[1].replace(/\"/g, '').replace(/,/g, '').trim();
            const dateStr = row[3];

            const quantity = parseFloat(quantityStr);
            if (isNaN(quantity)) continue;

            const dateParts = dateStr.split('/');
            if (dateParts.length < 3) continue;

            const month = parseInt(dateParts[0], 10);
            const year = parseInt(dateParts[2], 10);
            if (isNaN(month) || isNaN(year)) continue;

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
    }

    let reportContent = "==================================================\n";
    reportContent += "        REPORTE DE PRODUCTOS VENDIDOS           \n";
    reportContent += "==================================================\n\n";

    const sortedMonths = Array.from(monthlyProductSales.keys()).sort();

    for (const monthKey of sortedMonths) {
        const [year, monthNumStr] = monthKey.split('-');
        const monthName = meses[parseInt(monthNumStr, 10) - 1];
        reportContent += `--- ${monthName.toUpperCase()} ${year} ---\n`;

        const productMap = monthlyProductSales.get(monthKey);
        const sortedProducts = Array.from(productMap.entries()).sort((a, b) => b[1] - a[1]);

        // Calculate max product name length for alignment
        let maxProductNameLength = 0;
        for (const [productName, ] of sortedProducts) {
            if (productName.length > maxProductNameLength) {
                maxProductNameLength = productName.length;
            }
        }

        for (const [productName, quantity] of sortedProducts) {
            const paddedProductName = productName.padEnd(maxProductNameLength, ' ');
            reportContent += `  ${paddedProductName}: ${quantity.toLocaleString()}\n`;
        }
        reportContent += '\n';
    }

    reportContent += "==================================================\n";
    reportContent += "        RESUMEN TOTAL DE PRODUCTOS VENDIDOS       \n";
    reportContent += "==================================================\n\n";

    const sortedTotalProducts = Array.from(totalProductSales.entries()).sort((a, b) => b[1] - a[1]);

    // Calculate max product name length for alignment in total summary
    let maxTotalProductNameLength = 0;
    for (const [productName, ] of sortedTotalProducts) {
        if (productName.length > maxTotalProductNameLength) {
            maxTotalProductNameLength = productName.length;
        }
    }

    for (const [productName, quantity] of sortedTotalProducts) {
        const paddedProductName = productName.padEnd(maxTotalProductNameLength, ' ');
        reportContent += `  ${paddedProductName}: ${quantity.toLocaleString()}\n`;
    }
    reportContent += "\n==================================================\n";

    try {
        fs.writeFileSync(outputFile, reportContent, 'utf-8');
        console.log(`Report saved successfully to ${outputFile}`);
    } catch (error) {
        console.error(`Error writing report to file: ${error}`);
    }
}

if (require.main === module) {
    generateProductReport();
}
