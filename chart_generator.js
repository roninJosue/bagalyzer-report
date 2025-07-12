import fs from 'fs';
import path from 'path';
import { compile } from 'vega-lite';
import { parse, View, loader } from 'vega';

const generateChart = async (data, outputPath) => {
  const vegaLiteSpec = {
    $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
    data: { values: data },
    mark: 'bar',
    encoding: {
      x: {
        field: 'product',
        type: 'nominal',
        title: 'Producto'
      },
      y: { 
        field: 'total', 
        type: 'quantitative', 
        title: 'Total'
      },
      color: { 
        field: 'type', 
        type: 'nominal', 
        title: 'Tipo'
      }
    }
  };
  const vegaSpec = compile(vegaLiteSpec).spec;
  const view = new View(parse(vegaSpec), { renderer: 'none', loader: loader() });
  const svg = await view.toSVG();
  fs.writeFileSync(outputPath, svg);
};

const parseReportData = (reportContent) => {
  const dailyData = [];
  const daySections = reportContent.split(/--- (.*?) ---\n/);
  for (let i = 1; i < daySections.length; i += 2) {
    const date = daySections[i];
    const table = daySections[i + 1];
    const lines = table.trim().split('\n');
    const salesData = [];
    lines.forEach(line => {
      if (line.startsWith('| ') && !line.includes('Producto') && !line.includes('Total'))
        {
          const parts = line.split('|').map(s => s.trim());
          const product = parts[1];
          const priceStr = parts[3].replace(/[^\d.]/g, '');
          const gananciaStr = parts[4].replace(/[^\d.]/g, '');
          salesData.push({
            product,
            price: parseFloat(priceStr),
            ganancia: parseFloat(gananciaStr)
          });
        }
      });
      if (salesData.length > 0) {
        dailyData.push({ date, salesData });
      }
    }
    return dailyData;
  };
  
const generateChartsFromReport = async () => {
  const reportPath = path.join(process.cwd(), 'reporte_semanal.txt');
  if (!fs.existsSync(reportPath)) {
    console.error('Error: El archivo reporte_semanal.txt no existe. Ejecuta el reporte semanal primero.');
    return;
  }
  const reportContent = fs.readFileSync(reportPath, 'utf-8');
  const dailyData = parseReportData(reportContent);
  for (const day of dailyData) {
    const chartData = [];
    day.salesData.forEach(sale => {
      chartData.push({ product: sale.product, total: sale.price, type: 'Precio' });
      chartData.push({ product: sale.product, total: sale.ganancia, type: 'Ganancia' });
    });
    const dateForFilename = day.date.replace(/\//g, '-');
    const outputPath = path.join(process.cwd(), `reporte_grafico_${dateForFilename}.svg`);
    await generateChart(chartData, outputPath);
    console.log(`Gráfico guardado en: ${outputPath}`);
  }
};

generateChartsFromReport();