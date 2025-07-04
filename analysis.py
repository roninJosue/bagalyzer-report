import csv
import re
from collections import defaultdict

def parse_gains_list(file_path):
    gains_map = defaultdict(dict)
    try:
        with open(file_path, 'r', encoding='utf-8', errors='replace') as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue

                parts = re.split(r'\s{2,}', line, 1)
                product_name = parts[0].strip()

                if len(parts) > 1 and parts[1].strip():
                    rules_part = parts[1].strip()
                    rules = rules_part.split(',')
                    for rule in rules:
                        if ':' in rule:
                            try:
                                quantity, gain = rule.split(':')
                                gains_map[product_name][quantity.strip()] = float(gain.strip())
                            except ValueError:
                                continue
    except FileNotFoundError:
        print(f"Error: Gains list file not found at {file_path}")
        return None
    return gains_map

def analyze_sales(sales_file, gains_map):
    monthly_prices = defaultdict(float)
    monthly_earnings = defaultdict(float)
    meses = [
        "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ]

    try:
        with open(sales_file, 'r', encoding='utf-8-sig', errors='replace') as f:
            reader = csv.reader(f)
            header = next(reader)  # Skip header row
            data = list(reader)
    except FileNotFoundError:
        print(f"Error: Sales file not found at {sales_file}")
        return

    for row in data:
        try:
            if len(row) < 5:
                continue

            product_name = row[0].strip()
            quantity_str = row[1].replace('"','').replace(',','').strip()
            price_str = row[2]
            date_str = row[3]
            ganancia_str = row[4]

            cleaned_price_str = re.sub(r'[^\d.]', '', price_str)
            price = float(cleaned_price_str) if cleaned_price_str else 0.0

            # Handle YYYY-MM-DD format
            date_parts = date_str.split('-')
            if len(date_parts) < 3:
                continue
            year = int(date_parts[0])
            month = int(date_parts[1])
            month_key = f"{year}-{month:02d}"

            final_ganancia = 0.0
            cleaned_ganancia_str = re.sub(r'[^\d.]', '', ganancia_str)

            # If the gain cell is not empty, use its value. Otherwise, look it up.
            if cleaned_ganancia_str:
                final_ganancia = float(cleaned_ganancia_str)
            # New validation: If price is 0 and gain is empty, do not look up gain.
            elif price == 0:
                final_ganancia = 0
            elif gains_map and product_name in gains_map:
                try:
                    quantity_lookup_key = str(int(float(quantity_str)))
                    if quantity_lookup_key in gains_map[product_name]:
                        final_ganancia = gains_map[product_name][quantity_lookup_key]
                except ValueError:
                    pass  # Handle cases where quantity is not a valid number

            monthly_prices[month_key] += price
            monthly_earnings[month_key] += final_ganancia

        except (ValueError, IndexError):
            continue

    # --- Prepare Report Content ---
    report_content = "Resumen Mensual Actualizado (Precio Total y Ganancia Total)\n\n"
    sorted_months = sorted(monthly_prices.keys())
    total_prices_all_time = 0
    total_earnings_all_time = 0

    for month_key in sorted_months:
        year, month_num_str = month_key.split('-')
        month_name = meses[int(month_num_str) - 1]
        monthly_price = monthly_prices[month_key]
        monthly_earning = monthly_earnings[month_key]
        total_prices_all_time += monthly_price
        total_earnings_all_time += monthly_earning
        
        report_content += f"*   **{year} - {month_name}:**\n"
        report_content += f"    *   Suma de Precios: C${monthly_price:,.2f}\n"
        report_content += f"    *   Suma de Ganancias: C${monthly_earning:,.2f}\n\n"

    # --- Prepare Grand Totals ---
    report_content += "--------------------------------------------------\n"
    report_content += "Resumen Total de Todos los Meses\n\n"
    report_content += f"*   **Suma Total de Precios:** C${total_prices_all_time:,.2f}\n"
    report_content += f"*   **Suma Total de Ganancias:** C${total_earnings_all_time:,.2f}\n"
    report_content += "--------------------------------------------------\n"

    # --- Write to File ---
    try:
        with open('reporte_de_ventas.txt', 'w', encoding='utf-8') as f:
            f.write(report_content)
        print("Report saved successfully to reporte_de_ventas.txt")
    except IOError as e:
        print(f"Error writing report to file: {e}")

if __name__ == "__main__":
    gains_list_path = r'C:\Users\Reynaldo\test-gemini\lista.txt'
    sales_csv_path = r'C:\Users\Reynaldo\test-gemini\Negocio Bolsas.csv'
    
    gains_data = parse_gains_list(gains_list_path)
    if gains_data is not None:
        analyze_sales(sales_csv_path, gains_data)