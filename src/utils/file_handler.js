import fs from 'fs';

/**
 * Reads the content of a file synchronously.
 * @param {string} path The path of the file to read.
 * @returns {string} The content of the file.
 */
export const readFile = (path) => {
  try {
    return fs.readFileSync(path, 'utf-8');
  } catch (error) {
    console.error(`Error reading file ${path}:`, error);
    throw error; // Or handle the error as preferred
  }
};

/**
 * Writes content to a file synchronously.
 * @param {string} path The path of the file to write.
 * @param {string} content The content to write to the file.
 */
export const writeFile = (path, content) => {
  try {
    fs.writeFileSync(path, content);
    console.log(`File successfully saved at: ${path}`);
  } catch (error) {
    console.error(`Error writing to file ${path}:`, error);
    throw error; // Or handle the error as preferred
  }
};
