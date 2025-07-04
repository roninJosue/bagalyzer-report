import pandas as pd
from datetime import datetime
import os

def process_excel_to_csv():
    # Get today's date to find the correct file
    today = datetime.now()
    date_str = today.strftime("%d-%m-%Y")
    excel_filename = f"ventas_{date_str}.xlsx"
    csv_filename = "Negocio Bolsas.csv"

    # Check if today's Excel file exists
    if not os.path.exists(excel_filename):
        print(f"Error: File '{excel_filename}' not found. Please run the download script first.")
        return

    try:
        # First, let's see the available sheet names
        xls = pd.ExcelFile(excel_filename)
        print(f"Found sheet names: {xls.sheet_names}")

        # Read the specific sheet "Ventas" from the Excel file
        # We use header=None because the original script handles a headerless CSV
        df = pd.read_excel(excel_filename, sheet_name="Ventas", header=None)

        # Save the dataframe to a CSV file with UTF-8 encoding
        df.to_csv(csv_filename, index=False, header=False, encoding='utf-8-sig')

        print(f"Successfully converted the 'Ventas' sheet from '{excel_filename}' to '{csv_filename}'.")

    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    process_excel_to_csv()