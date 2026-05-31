import { Injectable } from '@nestjs/common';
import { createCanvas } from '@napi-rs/canvas';
import { Chart, registerables, ChartConfiguration, ChartDataset } from 'chart.js';
import PDFDocument from 'pdfkit';
import type { ExportChartDto, ExportPdfDto } from './dto/export-chart.dto';

Chart.register(...registerables);

const T = {
  bg:     '#171821',
  grid:   '#2a2b3d',
  text:   '#a0a0a0',
  colors: [
    '#2dd4bf', '#60a5fa', '#fbbf24',
    '#f87171', '#a78bfa', '#34d399', '#fb923c',
  ],
} as const;

function hex(c: string, alpha = 'cc') {
  return c + alpha;
}

function colorAt(i: number, override?: string) {
  return override ?? T.colors[i % T.colors.length];
}

function baseScales(opts: { horizontal?: boolean; dualY?: boolean } = {}) {
  const axis = (position?: 'left' | 'right', transparent = false) => ({
    position,
    ticks:    { color: T.text, font: { size: 11 } },
    grid:     { color: transparent ? 'transparent' : T.grid },
  });

  if (opts.horizontal) {
    return {
      x: axis(),
      y: { ...axis(), grid: { color: 'transparent' } },
    };
  }

  if (opts.dualY) {
    return {
      x:  axis(),
      y:  axis('left'),
      y1: axis('right', true),
    };
  }

  return { x: axis(), y: axis() };
}

function baseLegend(display: boolean) {
  return {
    display,
    labels: { color: T.text, font: { size: 11 }, boxWidth: 12 },
  };
}

function interpolateColor(value: number, min: number, max: number): string {
  const t   = max === min ? 0 : (value - min) / (max - min);
  const r   = Math.round(45  + t * (248 - 45));
  const g   = Math.round(212 + t * (113 - 212));
  const b   = Math.round(191 + t * (33  - 191));
  return `rgb(${r},${g},${b})`;
}

@Injectable()
export class ExportService {

  private buildConfig(dto: ExportChartDto): ChartConfiguration {
    switch (dto.type) {

      case 'single': {
        const c          = colorAt(0, dto.color);
        const horizontal = dto.chartKind === 'horizontalBar';
        const isLine     = dto.chartKind === 'line';

        return {
          type: horizontal ? 'bar' : dto.chartKind,
          data: {
            labels: dto.data.map(d => d.key),
            datasets: [{
              label:           dto.label,
              data:            dto.data.map(d => d.value),
              backgroundColor: isLine ? hex(c, '33') : hex(c),
              borderColor:     c,
              borderWidth:     1.5,
              borderRadius:    isLine ? undefined : 4,
              ...(isLine && {
                fill:        false,
                tension:     0.3,
                pointRadius: 3,
              }),
            }],
          },
          options: {
            indexAxis:  horizontal ? 'y' : 'x',
            responsive: false,
            plugins: { legend: baseLegend(false) },
            scales: baseScales({ horizontal }),
          },
        } as ChartConfiguration;
      }

      case 'multi': {
        const isLine = dto.chartKind === 'line';

        return {
          type: dto.chartKind,
          data: {
            labels: dto.series[0]?.data.map(d => d.key) ?? [],
            datasets: dto.series.map((s, i): ChartDataset => {
              const c = colorAt(i, s.color);
              return {
                label:           s.label,
                data:            s.data.map(d => d.value),
                borderColor:     c,
                backgroundColor: isLine ? hex(c, '33') : hex(c),
                borderWidth:     2,
                borderRadius:    isLine ? undefined : 4,
                ...(isLine && {
                  fill:        false,
                  tension:     0.3,
                  pointRadius: 3,
                }),
              };
            }),
          },
          options: {
            responsive: false,
            plugins: { legend: baseLegend(true) },
            scales: baseScales(),
          },
        } as ChartConfiguration;
      }

      case 'grouped': {
        return {
          type: 'bar',
          data: {
            labels: dto.data.map(d => d.key),
            datasets: dto.seriesLabels.map((lbl, i): ChartDataset => {
              const c = colorAt(i, dto.colors[i]);
              return {
                label:           lbl,
                data:            dto.data.map(d => d.values[i] ?? 0),
                backgroundColor: hex(c),
                borderColor:     c,
                borderWidth:     1.5,
                borderRadius:    4,
              };
            }),
          },
          options: {
            responsive: false,
            plugins: { legend: baseLegend(true) },
            scales: baseScales(),
          },
        } as ChartConfiguration;
      }

      case 'comparison': {
        const colors = dto.data.map((_, i) => colorAt(i, dto.colors?.[i]));
        return {
          type: 'bar',
          data: {
            labels: dto.data.map(d => d.label),
            datasets: [{
              label:           dto.label,
              data:            dto.data.map(d => d.value),
              backgroundColor: colors.map(c => hex(c)),
              borderColor:     colors,
              borderWidth:     1.5,
              borderRadius:    4,
            }],
          },
          options: {
            responsive: false,
            plugins: { legend: baseLegend(false) },
            scales: baseScales(),
          },
        } as ChartConfiguration;
      }

      case 'mixed': {
        const barC  = colorAt(0, dto.barColor);
        const lineC = colorAt(1, dto.lineColor);

        return {
          type: 'bar',
          data: {
            labels: dto.data.map(d => d.key),
            datasets: [
              {
                type:            'bar' as const,
                label:           'Cantidad',
                data:            dto.data.map(d => d.count),
                backgroundColor: hex(barC),
                borderColor:     barC,
                borderWidth:     1.5,
                borderRadius:    4,
                yAxisID:         'y',
              },
              {
                type:            'line' as const,
                label:           'Promedio',
                data:            dto.data.map(d => d.promedio),
                borderColor:     lineC,
                backgroundColor: hex(lineC, '33'),
                borderWidth:     2,
                pointRadius:     3,
                tension:         0.3,
                fill:            false,
                yAxisID:         'y1',
              },
            ],
          },
          options: {
            responsive: false,
            plugins: { legend: baseLegend(true) },
            scales: baseScales({ dualY: true }),
          },
        } as ChartConfiguration;
      }

      case 'histogram': {
        const c = colorAt(2, dto.color);
        return {
          type: 'bar',
          data: {
            labels: dto.data.map(d => d.key),
            datasets: [{
              label:              dto.label,
              data:               dto.data.map(d => d.value),
              backgroundColor:    hex(c),
              borderColor:        c,
              borderWidth:        1,
              borderRadius:       2,
              categoryPercentage: 1.0,
              barPercentage:      1.0,
            }],
          },
          options: {
            responsive: false,
            plugins: { legend: baseLegend(false) },
            scales: baseScales(),
          },
        } as ChartConfiguration;
      }

      case 'stacked': {
        return {
          type: 'bar',
          data: {
            labels: dto.data.map(d => d.key),
            datasets: dto.seriesLabels.map((lbl, i): ChartDataset => {
              const c = colorAt(i, dto.colors[i]);
              return {
                label:           lbl,
                data:            dto.data.map(d => d.values[i] ?? 0),
                backgroundColor: hex(c),
                borderColor:     c,
                borderWidth:     1,
                stack:           'stack',
              };
            }),
          },
          options: {
            responsive: false,
            plugins: { legend: baseLegend(true) },
            scales: {
              x: { stacked: true, ticks: { color: T.text }, grid: { color: T.grid } },
              y: { stacked: true, ticks: { color: T.text }, grid: { color: T.grid } },
            },
          },
        } as ChartConfiguration;
      }

      case 'heatmap': {
        const anos   = [...new Set(dto.data.map(d => d.ano))].sort();
        const rangos = [...new Set(dto.data.map(d => d.rango))];
        const counts = dto.data.map(d => d.count);
        const minC   = Math.min(...counts);
        const maxC   = Math.max(...counts);

        return {
          type: 'bar',
          data: {
            labels: anos.map(String),
            datasets: rangos.map((rango): ChartDataset => ({
              label: rango,
              data:  anos.map(ano => {
                const cell = dto.data.find(d => d.ano === ano && d.rango === rango);
                return cell?.count ?? 0;
              }),
              backgroundColor: anos.map(ano => {
                const cell = dto.data.find(d => d.ano === ano && d.rango === rango);
                return interpolateColor(cell?.count ?? 0, minC, maxC);
              }),
              borderWidth:        0,
              borderRadius:       2,
              categoryPercentage: 0.95,
              barPercentage:      0.95,
            })),
          },
          options: {
            responsive: false,
            plugins: {
              legend: baseLegend(true),
              tooltip: {
                callbacks: {
                  label: (ctx) => {
                    const value = ctx.parsed?.y;
                    return `${ctx.dataset.label}: ${
                      typeof value === 'number'
                        ? value.toLocaleString('es-CO')
                        : '0'
                    }`;
                  },
                },
              },
            },
            scales: {
              x: { stacked: true, ticks: { color: T.text }, grid: { color: T.grid } },
              y: { stacked: true, ticks: { color: T.text }, grid: { color: T.grid } },
            },
          },
        } as ChartConfiguration;
      }
    }
  }

  async generatePng(
    dto: ExportChartDto,
    width  = 960,
    height = 500,
  ): Promise<Buffer> {
    try {
      const HEADER_H = 64;
      const canvas   = createCanvas(width, height + HEADER_H);
      const ctx      = canvas.getContext('2d');

      ctx.fillStyle = T.bg;
      ctx.fillRect(0, 0, width, height + HEADER_H);

      ctx.fillStyle    = '#ffffff';
      ctx.font         = 'bold 22px sans-serif';
      ctx.textBaseline = 'middle';
      ctx.fillText(dto.label, 24, HEADER_H / 2);

      ctx.strokeStyle = '#2a2b3d';
      ctx.lineWidth   = 1;
      ctx.beginPath();
      ctx.moveTo(24, HEADER_H - 1);
      ctx.lineTo(width - 24, HEADER_H - 1);
      ctx.stroke();

      const chartCanvas = createCanvas(width, height);
      const chartCtx    = chartCanvas.getContext('2d');

      chartCtx.fillStyle = T.bg;
      chartCtx.fillRect(0, 0, width, height);

      const config     = this.buildConfig(dto);
      config.options   = config.options ?? {};
      config.options.animation = false as any;

      new Chart(chartCtx as any, config);

      ctx.drawImage(chartCanvas as any, 0, HEADER_H);

      return canvas.toBuffer('image/png');
    } catch (error) {
      console.error('[ExportService] generatePng error:', error);
      throw error;
    }
  }


  async generatePdf(dto: ExportPdfDto): Promise<Buffer> {
    const pngs = await Promise.all(
      dto.sections.map(async (s) => ({
        label: s.label,
        png: await this.generatePng(s.chart, 1100, 500),
      })),
    );

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ autoFirstPage: false, margin: 0 });
      const chunks: Buffer[] = [];

      doc.on('data', (c) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      pngs.forEach(({ label, png }) => {
        doc.addPage({ layout: 'landscape', size: 'A4' });
        const W = doc.page.width;
        const H = doc.page.height;
        const PAD = 30;

        doc
          .fontSize(9)
          .fillColor('#a0a0b0')
          .text(label, PAD, 14, { lineBreak: false });

        doc.image(png, PAD, 28, {
          width: W - PAD * 2,
          height: H - 28 - PAD,
          align: 'center',
          valign: 'center',
        });
      });

      doc.end();
    });
  }
}