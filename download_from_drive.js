import { downloadDriveFile } from './src/services/drive_logic.js';
import { RUTA_KEYFILE_DRIVE, SCOPES_DRIVE } from './src/config.js';

/**
 * Script orquestador para iniciar la descarga de archivos desde Google Drive.
 */
const runDownload = async () => {
  console.log('Iniciando el proceso de descarga de archivos...');
  await downloadDriveFile(RUTA_KEYFILE_DRIVE, SCOPES_DRIVE);
  console.log('Proceso de descarga finalizado.');
};

runDownload();