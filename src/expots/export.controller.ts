import { Controller, Post, Body, Res } from '@nestjs/common';
import type { Response } from 'express';
import type { ExportChartDto, ExportPdfDto } from './dto/export-chart.dto';
import { ExportService } from './export.service';

@Controller('export')
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  @Post('png')
  async exportPng(
    @Body() dto: ExportChartDto,
    @Res() res: Response,
  ) {
    const buffer = await this.exportService.generatePng(dto);
    res.set({ 'Content-Type': 'image/png' });
    res.send(buffer);
  }

  @Post('pdf')
  async exportPdf(
    @Body() dto: ExportPdfDto,
    @Res() res: Response,
  ) {
    const buffer = await this.exportService.generatePdf(dto);
    res.set({
      'Content-Type':        'application/pdf',
      'Content-Disposition': `attachment; filename="${dto.filename ?? 'dashboard'}.pdf"`,
    });
    res.send(buffer);
  }
}