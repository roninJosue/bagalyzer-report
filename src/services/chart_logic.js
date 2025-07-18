import { compile } from 'vega-lite';
import { parse, View, loader } from 'vega';

const getVegaLiteSpec = (data, title) => ({
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
          title: 'Total',
          axis: {
            format: ',.2f',
            formatType: 'number'
          }
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
        baseline: 'center',
        dy: -2,
        // angle: -90,
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
            value: { expr: "'C$' + format(datum.total, ',.2f')" }
          },
          value: ''
        }
      }
    }],
    transform: [
      {
        calculate: "'C$' + format(datum.total, ',.2f')",
        as: 'formatted_total'
      }
    ]
});

export const generateChartFile = async (data, outputPath, title) => {
  const vegaLiteSpec = getVegaLiteSpec(data, title);
  const vegaSpec = compile(vegaLiteSpec).spec;
  const view = new View(parse(vegaSpec), { renderer: 'none', loader: loader() });
  const svg = await view.toSVG();
  // La escritura del archivo se manejará fuera, así que solo devolvemos el SVG.
  return svg;
};
