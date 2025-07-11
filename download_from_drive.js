import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { pathToFileURL } from 'url';

dotenv.config();

const KEYFILEPATH = path.join(process.cwd(), 'negociobolsas.json');
const SCOPES = ['https://www.googleapis.com/auth/drive.readonly'];
const { GOOGLE_DRIVE_FILE_ID } = process.env;

if (!GOOGLE_DRIVE_FILE_ID) {
  console.error('Error: GOOGLE_DRIVE_FILE_ID environment variable is not set.');
  process.exit(1);
}

const downloadFile = async () => {
  const auth = new google.auth.GoogleAuth({
    keyFile: KEYFILEPATH,
    scopes: SCOPES,
  });

  const drive = google.drive({ version: 'v3', auth });

  const today = new Date();
  const day = String(today.getDate()).padStart(2, '0');
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const year = today.getFullYear();
  const fileName = `ventas_${day}-${month}-${year}.xlsx`;
  const filePath = path.join(process.cwd(), fileName);

  const dest = fs.createWriteStream(filePath);

  try {
    const res = await drive.files.export(
      { fileId: GOOGLE_DRIVE_FILE_ID, mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
      { responseType: 'stream' }
    );

    await new Promise((resolve, reject) => {
      res.data
        .on('end', () => {
          console.log(`File downloaded and saved to ${filePath}`);
          resolve();
        })
        .on('error', (err) => {
          console.error('Error downloading file.', err);
          reject(err);
        })
        .pipe(dest);
    });
  } catch (error) {
    console.error('Error during file download:', error);
  }
};

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  downloadFile();
}
