const Excel = require('exceljs');
const fs = require('fs');
const path = require('path');

async function processExcelToCsv() {
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = today.getFullYear();
    const dateStr = `${day}-${month}-${year}`;
    const excelFilename = `ventas_${dateStr}.xlsx`;
    const csvFilename = "Negocio Bolsas.csv";

    if (!fs.existsSync(excelFilename)) {
        console.error(`Error: File '${excelFilename}' not found. Please run the download script first.`);
        return;
    }

    try {
        const workbook = new Excel.Workbook();
        await workbook.xlsx.readFile(excelFilename);

        const worksheet = workbook.getWorksheet('Ventas');
        if (!worksheet) {
            console.error(`Error: Sheet 'Ventas' not found in '${excelFilename}'.`);
            return;
        }

        let csvContent = '';
        worksheet.eachRow({ includeEmpty: true }, (row) => {
            const values = [];
            const dateColumnIndex = 4; // Column D

            for (let i = 1; i <= worksheet.columnCount; i++) {
                const cell = row.getCell(i);

                if (i === dateColumnIndex && cell.type === Excel.ValueType.Date) {
                    const d = new Date(cell.value);
                    const month = String(d.getUTCMonth() + 1).padStart(2, '0');
                    const day = String(d.getUTCDate()).padStart(2, '0');
                    const year = d.getUTCFullYear();
                    values.push(`${month}/${day}/${year}`);
                } else {
                    values.push(cell.text || '');
                }
            }

            csvContent += values.map(cellText => {
                const cellStr = String(cellText);
                if (cellStr.includes(',') || cellStr.includes('"')) {
                    return `"${cellStr.replace(/"/g, '""')}"`;
                }
                return cellStr;
            }).join(',') + '\n';
        });

        fs.writeFileSync(csvFilename, '\uFEFF' + csvContent, { encoding: 'utf8' });

        console.log(`Successfully converted the 'Ventas' sheet from '${excelFilename}' to '${csvFilename}'.`);

    } catch (error) {
        console.error(`An error occurred: ${error}`);
    }
}

if (require.main === module) {
    processExcelToCsv();
}