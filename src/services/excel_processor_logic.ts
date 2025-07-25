import ExcelJS from 'exceljs';
import fs from 'fs';

/**
 * Procesa un archivo Excel y escribe una de sus hojas en un archivo CSV.
 * Maneja específicamente el formato de fechas y asegura que los campos con caracteres especiales
 * estén correctamente entrecomillados.
 *
 * @param inputExcelPath - La ruta completa al archivo Excel de entrada.
 * @param outputCsvPath - La ruta completa donde se guardará el archivo CSV de salida.
 * @param sheetName - El nombre de la hoja de cálculo a procesar.
 */
export const processExcelToCsv = async (
  inputExcelPath: string,
  outputCsvPath: string,
  sheetName: string
): Promise<void> => {
  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(inputExcelPath);

    const worksheet = workbook.getWorksheet(sheetName);
    if (!worksheet) {
      throw new Error(
        `La hoja de cálculo '${sheetName}' no se encontró en el archivo ${inputExcelPath}`,
      );
    }

    const csvRows: string[] = [];
    worksheet.eachRow({ includeEmpty: true }, (row) => {
      const values: string[] = [];
      const dateColumnIndex = 4; // Column D

      for (let i = 1; i <= worksheet.columnCount; i++) {
        const cell = row.getCell(i);

        if (i === dateColumnIndex && cell.type === ExcelJS.ValueType.Date) {
          const d = new Date(cell.value as Date);
          const monthValue = String(d.getUTCMonth() + 1).padStart(2, '0');
          const dayValue = String(d.getUTCDate()).padStart(2, '0');
          const yearValue = d.getUTCFullYear();
          values.push(`${monthValue}/${dayValue}/${yearValue}`);
        } else {
          values.push(cell.text || '');
        }
      }
      csvRows.push(
        values
          .map((cellText) => {
            const cellStr = String(cellText);
            if (cellStr.includes(',') || cellStr.includes('"')) {
              return `"${cellStr.replace(/"/g, '""')}"`;
            }
            return cellStr;
          })
          .join(','),
      );
    });

    const csvContent = csvRows.join('\n');
    fs.writeFileSync(outputCsvPath, `\uFEFF${csvContent}`, { encoding: 'utf8' });

    console.log(
      `Convertido exitosamente la hoja '${sheetName}' de '${inputExcelPath}' a '${outputCsvPath}'.`,
    );
  } catch (error) {
    console.error(`Error al procesar el archivo Excel: ${(error as Error).message}`);
    throw error;
  }
};
