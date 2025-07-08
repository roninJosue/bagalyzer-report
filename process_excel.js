import Excel from 'exceljs';
import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';

const processExcelToCsv = async () => {
  const today = new Date();
  const day = String(today.getDate()).padStart(2, '0');
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const year = today.getFullYear();
  const dateStr = `${day}-${month}-${year}`;
  const excelFilename = `ventas_${dateStr}.xlsx`;
  const csvFilename = 'Negocio Bolsas.csv';

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

    const csvRows = [];
    worksheet.eachRow({ includeEmpty: true }, (row) => {
      const values = [];
      const dateColumnIndex = 4; // Column D

      for (let i = 1; i <= worksheet.columnCount; i++) {
        const cell = row.getCell(i);

        if (i === dateColumnIndex && cell.type === Excel.ValueType.Date) {
          const d = new Date(cell.value);
          const monthValue = String(d.getUTCMonth() + 1).padStart(2, '0');
          const dayValue = String(d.getUTCDate()).padStart(2, '0');
          const yearValue = d.getUTCFullYear();
          values.push(`${monthValue}/${dayValue}/${yearValue}`);
        } else {
          values.push(cell.text || '');
        }
      }
      csvRows.push(values.map(cellText => {
        const cellStr = String(cellText);
        if (cellStr.includes(',') || cellStr.includes('"')) {
          return `"${cellStr.replace(/"/g, '""')}"`;
        }
        return cellStr;
      }).join(','));
    });

    const csvContent = csvRows.join('\n');
    fs.writeFileSync(csvFilename, `\uFEFF${csvContent}`, { encoding: 'utf8' });

    console.log(`Successfully converted the 'Ventas' sheet from '${excelFilename}' to '${csvFilename}'.`);
  } catch (error) {
    console.error(`An error occurred: ${error}`);
  }
};

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  processExcelToCsv();
}