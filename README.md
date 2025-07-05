# Sales Analysis Automation

This project automates the process of downloading sales data from Google Drive, converting it to a usable format, and generating a monthly sales analysis report.

## Technologies Used

*   **Node.js:** Used for downloading files from Google Drive.
    *   `googleapis`: Google API client library for Node.js.
    *   `csv-parser`: For parsing CSV data (though not directly used in the final download script, it was part of the initial Node.js analysis script).
    *   `dotenv`: For loading environment variables from a `.env` file.
*   **Python:** Used for processing Excel files and performing data analysis.
    *   `pandas`: A powerful data manipulation and analysis library, used for reading Excel files and writing CSVs.
    *   `openpyxl`: A library to read/write Excel 2010 xlsx/xlsm files (used by pandas).

## Project Structure

```
./
├── analysis.py
├── download_from_drive.js
├── process_excel.py
├── lista.txt
├── .gitignore
├── package.json
├── package-lock.json
└── README.md
```

## Key Scripts and Their Functions

### `download_from_drive.js`

This Node.js script is responsible for securely downloading the sales data from a specified Google Drive file. It uses the Google Drive API to export a Google Sheet as an XLSX file.

**Key Features:**
*   **Secure Authentication:** Uses a service account key (stored locally and ignored by Git) for authentication.
*   **Environment Variables:** The Google Drive file ID is loaded from an environment variable (`GOOGLE_DRIVE_FILE_ID`), ensuring sensitive information is not hardcoded or committed to version control.
*   **Dynamic Naming:** Saves the downloaded XLSX file with a dynamic name based on the current date (e.g., `ventas_DD-MM-YYYY.xlsx`).

### `process_excel.js` and `process_excel.py`

These scripts process the downloaded XLSX file and prepare it for analysis.

**Key Features:**
*   **Excel to CSV Conversion:** Reads the dynamically named XLSX file.
*   **Sheet Selection:** Specifically reads the sheet named "Ventas" from the Excel workbook.
*   **Encoding Handling:** Converts the data to a CSV file (`Negocio Bolsas.csv`) using `UTF-8-SIG` encoding to correctly handle special characters (like 'ñ') and ensure compatibility with the analysis script.
*   **Header Management:** Ensures the output CSV is formatted correctly for the analysis script.

### `analysis.js` and `analysis.py`

These scripts perform the core sales data analysis.

**Key Features:**
*   **CSV Data Ingestion:** Reads the `Negocio Bolsas.csv` file, handling `UTF-8-SIG` encoding and skipping the header row.
*   **Monthly Sales Aggregation:** Calculates total prices and earnings per month.
*   **Dynamic Gain Calculation:** Determines the final gain for each transaction:
    *   Prioritizes the 'Ganancia' value directly from the CSV if present.
    *   If the 'Ganancia' cell in the CSV is empty, it looks up the gain based on product and quantity in `lista.txt`.
    *   **Important Validation:** If the price is `C$0` (or empty) and the 'Ganancia' cell is also empty, the gain is explicitly set to `0` and no lookup is performed, preventing incorrect profit assignments for complimentary items or data entry errors.
*   **Report Generation:** Generates a detailed monthly summary and grand totals.
*   **File Output:** Saves the complete analysis report to `reporte_de_ventas.txt`.

## Setup and Usage

1.  **Clone the repository:**
    ```bash
    git clone <your-repo-url>
    cd <your-repo-name>
    ```

2.  **Install Node.js dependencies:**
    ```bash
    npm install
    ```

3.  **Install Python dependencies:**
    ```bash
    pip install -r requirements.txt # (You might need to create this file first: pip freeze > requirements.txt)
    ```
    *Self-correction: I should add a `requirements.txt` to the project for Python dependencies.* 

4.  **Google Drive API Setup (One-time):**
    *   Enable the Google Drive API in your Google Cloud Project.
    *   Create a Service Account and download its JSON key file. Save it as `negociobolsas.json` in the project root.
    *   Share your Google Sheet with the service account's email address (found in `negociobolsas.json`), granting at least "Viewer" access.

5.  **Environment Variables:**
    *   Create a `.env` file in the project root.
    *   Add your Google Drive file ID to it:
        ```
        GOOGLE_DRIVE_FILE_ID=YOUR_GOOGLE_DRIVE_FILE_ID_HERE
        ```
    *   **Ensure `.env` and `negociobolsas.json` are listed in `.gitignore` and are NOT committed to your repository.**

6.  **Run the Workflow:**
    *   **Download the latest sales data:**
        ```bash
        node download_from_drive.js
        ```
    *   **Process the Excel file to CSV:**
        ```bash
        python process_excel.py
        ```
    *   **Generate the sales analysis report:**
        ```bash
        python analysis.py
        ```

After running `python analysis.py`, the detailed sales report will be saved in `reporte_de_ventas.txt`.
