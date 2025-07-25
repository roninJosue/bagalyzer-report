import path from 'path';

// Project root directory
const __dirname = path.resolve();

// --- Data Files Paths ---
export const PATH_LIST: string = path.join(__dirname, 'data', 'lista.txt');
export const PATH_SALES_CSV: string = path.join(__dirname, 'data', 'Negocio Bolsas.csv');

// --- Output Files Paths ---
export const PATH_WEEKLY_REPORT: string = path.join(__dirname, 'output', 'weekly_report.txt');
export const PATH_ANALYSIS_REPORT: string = path.join(__dirname, 'output', 'sales_report.txt');
export const PATH_CHARTS: string = path.join(__dirname, 'output'); // Directory to save charts
export const PATH_CONSOLIDATED_REPORT: string = path.join(__dirname, 'output', 'consolidated_report.txt');

// --- Google Drive Configurations ---
export const PATH_DRIVE_KEYFILE: string = path.join(__dirname, 'negociobolsas.json');
export const SCOPES_DRIVE: string[] = ['https://www.googleapis.com/auth/drive.readonly'];
