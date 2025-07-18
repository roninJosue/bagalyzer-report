import fs from 'fs';

/**
 * Lee el contenido de un archivo de forma síncrona.
 * @param {string} ruta La ruta del archivo a leer.
 * @returns {string} El contenido del archivo.
 */
export const leerArchivo = (ruta) => {
  try {
    return fs.readFileSync(ruta, 'utf-8');
  } catch (error) {
    console.error(`Error al leer el archivo ${ruta}:`, error);
    throw error; // O manejar el error como se prefiera
  }
};

/**
 * Escribe contenido en un archivo de forma síncrona.
 * @param {string} ruta La ruta del archivo a escribir.
 * @param {string} contenido El contenido a escribir en el archivo.
 */
export const escribirArchivo = (ruta, contenido) => {
  try {
    fs.writeFileSync(ruta, contenido);
    console.log(`Archivo guardado exitosamente en: ${ruta}`);
  } catch (error) {
    console.error(`Error al escribir en el archivo ${ruta}:`, error);
    throw error; // O manejar el error como se prefiera
  }
};
