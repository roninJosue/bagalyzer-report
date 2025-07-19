import fs from 'fs';

/**
 * Reads the content of a file synchronously.
 * @param {string} path - The path of the file to read
 * @returns {string} The content of the file
 * @throws {Error} If the file cannot be read
 */
export const readFile = (path) => {
  if (!path) {
    throw new Error('File path is required');
  }

  try {
    return fs.readFileSync(path, 'utf-8');
  } catch (error) {
    console.error(`Error reading file ${path}: ${error.message}`);
    throw new Error(`Failed to read file ${path}: ${error.message}`);
  }
};

/**
 * Writes content to a file synchronously.
 * @param {string} path - The path of the file to write
 * @param {string} content - The content to write to the file
 * @throws {Error} If the file cannot be written
 */
export const writeFile = (path, content) => {
  if (!path) {
    throw new Error('File path is required');
  }

  try {
    fs.writeFileSync(path, content);
    console.log(`File successfully saved at: ${path}`);
  } catch (error) {
    console.error(`Error writing to file ${path}: ${error.message}`);
    throw new Error(`Failed to write to file ${path}: ${error.message}`);
  }
};
