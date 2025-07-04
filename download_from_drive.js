const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const KEYFILEPATH = path.join(__dirname, 'negociobolsas.json');
const SCOPES = ['https://www.googleapis.com/auth/drive.readonly'];
const FILE_ID = process.env.GOOGLE_DRIVE_FILE_ID;

if (!FILE_ID) {
    console.error('Error: GOOGLE_DRIVE_FILE_ID environment variable is not set.');
    process.exit(1);
}

async function downloadFile() {
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
    const filePath = path.join(__dirname, fileName);

    const dest = fs.createWriteStream(filePath);

    try {
        const res = await drive.files.export(
            { fileId: FILE_ID, mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
            { responseType: 'stream' }
        );

        res.data
            .on('end', () => {
                console.log(`File downloaded and saved to ${filePath}`);
            })
            .on('error', (err) => {
                console.error('Error downloading file.', err);
            })
            .pipe(dest);
    } catch (error) {
        console.error('Error during file download:', error);
    }
}

if (require.main === module) {
    downloadFile();
}
