# Sales Analysis Automation

This project automates the process of downloading sales data from Google Drive, converting it to a usable format, and generating various sales analysis reports and charts.

## Technologies Used

*   **Node.js:** Used for scripting various parts of the workflow.
    *   `googleapis`: To interact with the Google Drive API.
    *   `exceljs`: To process and convert `.xlsx` files to `.csv`.
    *   `csv-parser`: For parsing CSV data.
    *   `vega-lite`, `vega`: To generate SVG charts from data.
    *   `dotenv`: For loading environment variables from a `.env` file.

## Project Structure

```
./
├── .env.example
├── .gitignore
├── analysis.js
├── chart_generator.js
├── download_from_drive.js
├── lista.txt
├── package.json
├── process_excel.js
├── README.md
├── report_generator.js
├── weekly_report.js
└── ...
```

## Key Scripts and Their Functions

### `download_from_drive.js`

This Node.js script securely downloads the sales data from a specified Google Drive file. It uses the Google Drive API to export a Google Sheet as an `.xlsx` file.

**Key Features:**
*   **Secure Authentication:** Uses a service account key (`negociobolsas.json`) for authentication.
*   **Environment Variables:** The Google Drive file ID is loaded from a `.env` file.
*   **Dynamic Naming:** Saves the downloaded file with a name based on the current date (e.g., `ventas_DD-MM-YYYY.xlsx`).

### `process_excel.js`

This script processes the downloaded `.xlsx` file and converts the "Ventas" sheet into a `Negocio Bolsas.csv` file, preparing it for analysis.

### `analysis.js`

This script performs a comprehensive sales data analysis based on the `Negocio Bolsas.csv` file.

**Key Features:**
*   **Monthly Aggregation:** Calculates total prices and earnings per month.
*   **Dynamic Gain Calculation:** Determines the final gain for each transaction by looking up values in `lista.txt` if not present in the sales data.
*   **Report Generation:** Creates a detailed monthly summary and grand totals in `reporte_de_ventas.txt`.

### `report_generator.js`

This script generates a report (`reports_by_products.txt`) detailing the quantity of each product sold per month and a total summary.

### `weekly_report.js`

This script generates a weekly sales report (`reporte_semanal.txt`) that includes:
*   A day-by-day breakdown of sales for the current week.
*   A table for each day with product, quantity, price, and profit.
*   A total row for each daily table.

### `chart_generator.js`

This script generates SVG charts based on the weekly sales report.

**Key Features:**
*   **Data Visualization:** Creates bar charts showing total price and profit for each product sold.
*   **Dynamic Titles:** Each chart is titled with the corresponding date.
*   **Clear Labeling:** Adds total values on top of each bar for better readability.
*   **File Output:** Saves the charts as `.svg` files (e.g., `reporte_grafico_DD-MM-YYYY.svg`).

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

3.  **Google Drive API Setup:**
    *   Enable the Google Drive API in your Google Cloud Project.
    *   Create a Service Account and download its JSON key file. Save it as `negociobolsas.json` in the project root.
    *   Share your Google Sheet with the service account's email address.

4.  **Environment Variables:**
    *   Create a `.env` file in the project root (you can copy `.env.example`).
    *   Add your Google Drive file ID to it:
        ```
        GOOGLE_DRIVE_FILE_ID=YOUR_GOOGLE_DRIVE_FILE_ID_HERE
        ```

5.  **Run the Workflow:**
    You can run the scripts individually or use the npm scripts defined in `package.json`.

    *   **Download the latest sales data:**
        ```bash
        npm run start:download
        ```
    *   **Process the Excel file to CSV:**
        ```bash
        npm run start:process
        ```
    *   **Generate the monthly sales analysis report:**
        ```bash
        npm run start:analysis
        ```
    *   **Generate the product sales report:**
        ```bash
        npm run start:report
        ```
    *   **Generate the weekly sales report:**
        ```bash
        npm run start:weekly-report
        ```
    *   **Generate the weekly charts:**
        ```bash
        npm run start:chart
        ```