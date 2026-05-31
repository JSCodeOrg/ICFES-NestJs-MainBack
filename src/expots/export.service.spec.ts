import { Test, TestingModule } from '@nestjs/testing';
import { ExportService } from './export.service';

// ─── Module mocks (must be before imports that pull them) ────────────────────

jest.mock('@napi-rs/canvas', () => {
  const mockCtx = {
    fillStyle:    '',
    font:         '',
    textBaseline: '',
    strokeStyle:  '',
    lineWidth:    0,
    fillRect:     jest.fn(),
    fillText:     jest.fn(),
    beginPath:    jest.fn(),
    moveTo:       jest.fn(),
    lineTo:       jest.fn(),
    stroke:       jest.fn(),
    drawImage:    jest.fn(),
  };

  const mockCanvas = {
    getContext:  jest.fn(() => mockCtx),
    toBuffer:    jest.fn(async () => Buffer.from('png')),
  };

  return { createCanvas: jest.fn(() => mockCanvas) };
});

jest.mock('chart.js', () => {
  const Chart: any = jest.fn();
  Chart.register    = jest.fn();
  return { Chart, registerables: [] };
});

jest.mock('pdfkit', () => {
  const { EventEmitter } = require('events');

  return jest.fn().mockImplementation(() => {
    const emitter = new EventEmitter();
    const doc: any = Object.assign(emitter, {
      page:     { width: 841, height: 595 },
      fontSize: jest.fn().mockReturnThis(),
      fillColor: jest.fn().mockReturnThis(),
      text:     jest.fn().mockReturnThis(),
      image:    jest.fn().mockReturnThis(),
      addPage:  jest.fn().mockReturnThis(),
      end:      jest.fn().mockImplementation(function (this: any) {
        this.emit('data', Buffer.from('chunk'));
        this.emit('end');
      }),
    });
    return doc;
  });
});

// ─── Fixtures ────────────────────────────────────────────────────────────────

import type { ExportChartDto, ExportPdfDto } from './dto/export-chart.dto';

const singleBarDto: ExportChartDto = {
  type: 'single',
  chartKind: 'bar',
  label: 'Ventas',
  data: [{ key: 'Ene', value: 100 }, { key: 'Feb', value: 200 }],
};

const singleLineDto: ExportChartDto = {
  type: 'single',
  chartKind: 'line',
  label: 'Tendencia',
  data: [{ key: 'Ene', value: 50 }, { key: 'Feb', value: 80 }],
};

const singleHorizontalDto: ExportChartDto = {
  type: 'single',
  chartKind: 'horizontalBar',
  label: 'Horizontal',
  data: [{ key: 'A', value: 10 }],
};

const multiLineDto: ExportChartDto = {
  type: 'multi',
  chartKind: 'line',
  label: 'Multi línea',
  series: [
    { label: 'S1', data: [{ key: 'Ene', value: 10 }] },
    { label: 'S2', data: [{ key: 'Ene', value: 20 }] },
  ],
};

const multiBarDto: ExportChartDto = {
  type: 'multi',
  chartKind: 'bar',
  label: 'Multi bar',
  series: [
    { label: 'S1', data: [{ key: 'Ene', value: 10 }] },
  ],
};

const groupedDto: ExportChartDto = {
  type: 'grouped',
  label: 'Agrupado',
  data: [{ key: 'Ene', values: [10, 20] }],
  seriesLabels: ['Grupo A', 'Grupo B'],
  colors: ['#ff0000', '#00ff00'],
};

const comparisonDto: ExportChartDto = {
  type: 'comparison',
  label: 'Comparación',
  data: [{ label: 'X', value: 5 }, { label: 'Y', value: 15 }],
};

const mixedDto: ExportChartDto = {
  type: 'mixed',
  label: 'Mixto',
  data: [{ key: 'Ene', count: 30, promedio: 4.5 }],
};

const histogramDto: ExportChartDto = {
  type: 'histogram',
  label: 'Histograma',
  data: [{ key: '0-10', value: 5 }, { key: '10-20', value: 12 }],
};

const stackedDto: ExportChartDto = {
  type: 'stacked',
  label: 'Apilado',
  data: [{ key: 'Ene', values: [10, 20] }],
  seriesLabels: ['P1', 'P2'],
  colors: ['#aabbcc', '#ddeeff'],
};

const heatmapDto: ExportChartDto = {
  type: 'heatmap',
  label: 'Heatmap',
  data: [
    { ano: 2022, rango: '0-10', count: 5 },
    { ano: 2022, rango: '10-20', count: 15 },
    { ano: 2023, rango: '0-10', count: 8 },
    { ano: 2023, rango: '10-20', count: 0 },
  ],
};

const pdfDto: ExportPdfDto = {
  filename: 'informe',
  sections: [
    { label: 'Chart 1', chart: singleBarDto },
    { label: 'Chart 2', chart: multiLineDto },
  ],
};

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('ExportService', () => {
  let service: ExportService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [ExportService],
    }).compile();

    service = module.get<ExportService>(ExportService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ── generatePng ──────────────────────────────────────────────────────────

  describe('generatePng', () => {
    it('returns a Buffer', async () => {
      const result = await service.generatePng(singleBarDto);
      expect(Buffer.isBuffer(result)).toBe(true);
    });

    it('uses default dimensions (960 × 500)', async () => {
      const { createCanvas } = require('@napi-rs/canvas');
      await service.generatePng(singleBarDto);
      // first call creates the composite canvas: width=960, height=500+64
      expect(createCanvas).toHaveBeenCalledWith(960, 564);
    });

    it('respects custom dimensions', async () => {
      const { createCanvas } = require('@napi-rs/canvas');
      await service.generatePng(singleBarDto, 800, 400);
      expect(createCanvas).toHaveBeenCalledWith(800, 464);
    });

    it('draws the chart label on the canvas', async () => {
      const { createCanvas } = require('@napi-rs/canvas');
      const mockCtx = createCanvas().getContext();
      await service.generatePng(singleBarDto);
      expect(mockCtx.fillText).toHaveBeenCalledWith('Ventas', expect.any(Number), expect.any(Number));
    });

    // ── chart type coverage ─────────────────────────────────────────────

    const fixtures: [string, ExportChartDto][] = [
      ['single bar',        singleBarDto],
      ['single line',       singleLineDto],
      ['single horizontal', singleHorizontalDto],
      ['multi line',        multiLineDto],
      ['multi bar',         multiBarDto],
      ['grouped',           groupedDto],
      ['comparison',        comparisonDto],
      ['mixed',             mixedDto],
      ['histogram',         histogramDto],
      ['stacked',           stackedDto],
      ['heatmap',           heatmapDto],
    ];

    test.each(fixtures)('generates PNG for chart type: %s', async (_name, dto) => {
      await expect(service.generatePng(dto)).resolves.toBeDefined();
    });

    it('throws and rethrows errors from canvas', async () => {
      const { createCanvas } = require('@napi-rs/canvas');
      createCanvas.mockImplementationOnce(() => {
        throw new Error('canvas failure');
      });
      await expect(service.generatePng(singleBarDto)).rejects.toThrow('canvas failure');
    });
  });

  // ── buildConfig (via generatePng integration) ────────────────────────────

  describe('buildConfig – chart type shapes', () => {
    it('single bar: type is "bar" and indexAxis is "x"', async () => {
      const { Chart } = require('chart.js');
      await service.generatePng(singleBarDto);
      const config = Chart.mock.calls[0][1] as any;
      expect(config.type).toBe('bar');
      expect(config.options?.indexAxis).not.toBe('y');
    });

    it('single horizontalBar: indexAxis is "y"', async () => {
      const { Chart } = require('chart.js');
      await service.generatePng(singleHorizontalDto);
      const config = Chart.mock.calls[0][1] as any;
      expect(config.options?.indexAxis).toBe('y');
    });

    it('single line: type is "line"', async () => {
      const { Chart } = require('chart.js');
      await service.generatePng(singleLineDto);
      const config = Chart.mock.calls[0][1] as any;
      expect(config.type).toBe('line');
    });

    it('multi: dataset count matches series length', async () => {
      const { Chart } = require('chart.js');
      await service.generatePng(multiLineDto);
      const config = Chart.mock.calls[0][1] as any;
      expect(config.data.datasets).toHaveLength(2);
    });

    it('grouped: dataset count matches seriesLabels length', async () => {
      const { Chart } = require('chart.js');
      await service.generatePng(groupedDto);
      const config = Chart.mock.calls[0][1] as any;
      expect(config.data.datasets).toHaveLength(2);
    });

    it('comparison: single dataset with per-bar colors', async () => {
      const { Chart } = require('chart.js');
      await service.generatePng(comparisonDto);
      const config = Chart.mock.calls[0][1] as any;
      expect(config.data.datasets).toHaveLength(1);
      expect(config.data.datasets[0].backgroundColor).toHaveLength(2);
    });

    it('mixed: two datasets (bar + line) with different yAxisID', async () => {
      const { Chart } = require('chart.js');
      await service.generatePng(mixedDto);
      const config = Chart.mock.calls[0][1] as any;
      expect(config.data.datasets).toHaveLength(2);
      expect(config.data.datasets[0].yAxisID).toBe('y');
      expect(config.data.datasets[1].yAxisID).toBe('y1');
    });

    it('mixed: dual-Y scales contain y and y1', async () => {
      const { Chart } = require('chart.js');
      await service.generatePng(mixedDto);
      const config = Chart.mock.calls[0][1] as any;
      expect(config.options.scales).toHaveProperty('y');
      expect(config.options.scales).toHaveProperty('y1');
    });

    it('histogram: categoryPercentage and barPercentage are 1.0', async () => {
      const { Chart } = require('chart.js');
      await service.generatePng(histogramDto);
      const config  = Chart.mock.calls[0][1] as any;
      const dataset = config.data.datasets[0];
      expect(dataset.categoryPercentage).toBe(1.0);
      expect(dataset.barPercentage).toBe(1.0);
    });

    it('stacked: datasets include stack="stack"', async () => {
      const { Chart } = require('chart.js');
      await service.generatePng(stackedDto);
      const config = Chart.mock.calls[0][1] as any;
      config.data.datasets.forEach((ds: any) => {
        expect(ds.stack).toBe('stack');
      });
    });

    it('heatmap: datasets count matches unique rangos', async () => {
      const { Chart } = require('chart.js');
      await service.generatePng(heatmapDto);
      const config  = Chart.mock.calls[0][1] as any;
      // 2 unique rangos: "0-10" and "10-20"
      expect(config.data.datasets).toHaveLength(2);
    });

    it('heatmap: x-axis labels are the unique sorted anos', async () => {
      const { Chart } = require('chart.js');
      await service.generatePng(heatmapDto);
      const config = Chart.mock.calls[0][1] as any;
      expect(config.data.labels).toEqual(['2022', '2023']);
    });

    it('heatmap: backgroundColor uses interpolated rgb colors', async () => {
      const { Chart } = require('chart.js');
      await service.generatePng(heatmapDto);
      const config = Chart.mock.calls[0][1] as any;
      const bg     = config.data.datasets[0].backgroundColor as string[];
      bg.forEach(color => expect(color).toMatch(/^rgb\(\d+,\d+,\d+\)$/));
    });
  });

  // ── generatePdf ──────────────────────────────────────────────────────────

  describe('generatePdf', () => {
    it('returns a Buffer', async () => {
      const result = await service.generatePdf(pdfDto);
      expect(Buffer.isBuffer(result)).toBe(true);
    });

    it('adds one page per section', async () => {
      const PDFDocument = require('pdfkit');
      await service.generatePdf(pdfDto);
      const docInstance = PDFDocument.mock.results[0].value;
      expect(docInstance.addPage).toHaveBeenCalledTimes(pdfDto.sections.length);
    });

    it('uses landscape A4 layout for each page', async () => {
      const PDFDocument = require('pdfkit');
      await service.generatePdf(pdfDto);
      const docInstance = PDFDocument.mock.results[0].value;
      docInstance.addPage.mock.calls.forEach((call: any[]) => {
        expect(call[0]).toMatchObject({ layout: 'landscape', size: 'A4' });
      });
    });

    it('embeds an image for each section', async () => {
      const PDFDocument = require('pdfkit');
      await service.generatePdf(pdfDto);
      const docInstance = PDFDocument.mock.results[0].value;
      expect(docInstance.image).toHaveBeenCalledTimes(pdfDto.sections.length);
    });

    it('renders the section label as text', async () => {
      const PDFDocument = require('pdfkit');
      await service.generatePdf(pdfDto);
      const docInstance = PDFDocument.mock.results[0].value;
      expect(docInstance.text).toHaveBeenCalledWith('Chart 1', expect.any(Number), expect.any(Number), expect.any(Object));
      expect(docInstance.text).toHaveBeenCalledWith('Chart 2', expect.any(Number), expect.any(Number), expect.any(Object));
    });

    it('calls doc.end() to finalise the document', async () => {
      const PDFDocument = require('pdfkit');
      await service.generatePdf(pdfDto);
      const docInstance = PDFDocument.mock.results[0].value;
      expect(docInstance.end).toHaveBeenCalledTimes(1);
    });

    it('generates PNGs with width=1100 for each section', async () => {
      const { createCanvas } = require('@napi-rs/canvas');
      await service.generatePdf(pdfDto);
      // first canvas call for section 1: width=1100, height=500+64
      expect(createCanvas).toHaveBeenCalledWith(1100, 564);
    });
  });
});