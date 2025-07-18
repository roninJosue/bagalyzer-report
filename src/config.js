import path from 'path';

// Directorio raíz del proyecto
const __dirname = path.resolve();

// --- Rutas de Archivos de Datos ---
export const RUTA_LISTA = path.join(__dirname, 'data', 'lista.txt');
export const RUTA_VENTAS_CSV = path.join(__dirname, 'data', 'Negocio Bolsas.csv');

// --- Rutas de Archivos de Salida ---
export const RUTA_REPORTE_SEMANAL = path.join(__dirname, 'output', 'reporte_semanal.txt');
export const RUTA_REPORTE_ANALISIS = path.join(__dirname, 'output', 'reporte_de_ventas.txt');
export const RUTA_GRAFICOS = path.join(__dirname, 'output'); // Directorio para guardar gráficos
export const RUTA_REPORTE_CONSOLIDADO = path.join(__dirname, 'output', 'reporte_consolidado.txt');

// --- Configuraciones de Google Drive ---
export const RUTA_KEYFILE_DRIVE = path.join(__dirname, 'negociobolsas.json');
export const SCOPES_DRIVE = ['https://www.googleapis.com/auth/drive.readonly'];
