import fs from 'fs';
import path from 'path';
import { compile } from 'vega-lite';
import { parse, View, loader } from 'vega';

const generateChart = async (data, outputPath, title) => {
  const vegaLiteSpec = {
    '$schema': 'https://vega.github.io/schema/vega-lite/v5.json',
    title: title,
    data: { values: data },
    layer: [{
      mark: 'bar',
      encoding: {
        x: {
          field: 'product',
          type: 'nominal',
          title: 'Producto',
          axis: { labelAngle: -45 }
        },
        y: {
          field: 'total',
          type: 'quantitative',
          title: 'Total'
        },
        xOffset: { field: 'type' },
        color: {
          field: 'type',
          type: 'nominal',
          title: 'Tipo'
        }
      }
    }, {
      mark: {
        type: 'text',
        align: 'center',
        baseline: 'bottom',
        dy: -5,
        color: 'black'
      },
      encoding: {
        x: {
          field: 'product',
          type: 'nominal'
        },
        y: {
          field: 'total',
          type: 'quantitative'
        },
        xOffset: { field: 'type' },
        text: {
          condition: {
            test: 'datum.total > 1',
            field: 'total',
            type: 'quantitative',
            format: ',.2f'
          },
          value: ''
        }
      }
    }]
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
          const quantityStr = parts[2].trim();
          const priceStr = parts[3].replace(/[^\d.]/g, '');
          const gananciaStr = parts[4].replace(/[^\d.]/g, '');
          salesData.push({
            product,
            quantity: parseInt(quantityStr, 10),
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
      const productLabel = `${sale.product}
(${sale.quantity})`;
      chartData.push({ product: productLabel, total: sale.price, type: 'Precio' });
      chartData.push({ product: productLabel, total: sale.ganancia, type: 'Ganancia' });
    });
    const dateForFilename = day.date.replace(/\//g, '-');
    const outputPath = path.join(process.cwd(), `reporte_grafico_${dateForFilename}.svg`);
    await generateChart(chartData, outputPath, day.date);
    console.log(`Gráfico guardado en: ${outputPath}`);
  }
};

generateChartsFromReport();