import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const { GOOGLE_DRIVE_FILE_ID } = process.env;

/**
 * Downloads a file from Google Drive using the provided credentials
 * @param keyFilePath - Path to the Google API key file
 * @param scopes - OAuth scopes for Google Drive API
 */
export const downloadDriveFile = async (keyFilePath: string, scopes: string[]): Promise<void> => {
  if (!GOOGLE_DRIVE_FILE_ID) {
    console.error('Error: GOOGLE_DRIVE_FILE_ID environment variable is not set.');
    process.exit(1);
  }

  if (!fs.existsSync(keyFilePath)) {
    console.error(`Error: Key file not found at ${keyFilePath}`);
    process.exit(1);
  }

  const auth = new google.auth.GoogleAuth({
    keyFile: keyFilePath,
    scopes: scopes,
  });

  const drive = google.drive({ version: 'v3', auth });

  const today = new Date();
  const day = String(today.getDate()).padStart(2, '0');
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const year = today.getFullYear();
  const fileName = `ventas_${day}-${month}-${year}.xlsx`;
  const filePath = path.join(process.cwd(), 'data', fileName); // Guardar en la carpeta de datos

  const dest = fs.createWriteStream(filePath);

  try {
    console.log(`Iniciando descarga desde Google Drive...`);
    const res = await drive.files.export(
      {
        fileId: GOOGLE_DRIVE_FILE_ID,
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
      { responseType: 'stream' },
    );

    await new Promise<void>((resolve, reject) => {
      res.data
        .on('end', () => {
          console.log(`Archivo descargado y guardado en: ${filePath}`);
          resolve();
        })
        .on('error', (err: Error) => {
          console.error('Error durante la descarga del archivo.', err);
          reject(err);
        })
        .pipe(dest);
    });
  } catch (error) {
    console.error('Error al procesar la descarga del archivo:', error);
  }
};
