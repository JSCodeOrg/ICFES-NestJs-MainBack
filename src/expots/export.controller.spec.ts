import { Test, TestingModule } from '@nestjs/testing';
import { ExportController } from './export.controller';
import { ExportService } from './export.service';
import type { Response } from 'express';
import type { ExportChartDto, ExportPdfDto } from './dto/export-chart.dto';

const mockExportService = {
  generatePng: jest.fn(),
  generatePdf: jest.fn(),
};

function mockResponse(): jest.Mocked<Pick<Response, 'set' | 'send'>> {
  return {
    set: jest.fn(),
    send: jest.fn(),
  };
}

// ─── Fixtures ────────────────────────────────────────────────────────────────

const singleChartDto: ExportChartDto = {
  type: 'single',
  chartKind: 'bar',
  label: 'Ventas',
  data: [
    { key: 'Ene', value: 100 },
    { key: 'Feb', value: 200 },
  ],
};

const pdfDto: ExportPdfDto = {
  filename: 'reporte',
  sections: [
    {
      label: 'Sección 1',
      chart: singleChartDto,
    },
  ],
};

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('ExportController', () => {
  let controller: ExportController;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ExportController],
      providers: [
        { provide: ExportService, useValue: mockExportService },
      ],
    }).compile();

    controller = module.get<ExportController>(ExportController);
  });

  // ── Wiring ──────────────────────────────────────────────────────────────

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // ── POST /export/png ────────────────────────────────────────────────────

  describe('exportPng', () => {
    it('calls generatePng with the received DTO', async () => {
      const pngBuffer = Buffer.from('fake-png');
      mockExportService.generatePng.mockResolvedValue(pngBuffer);
      const res = mockResponse() as unknown as Response;

      await controller.exportPng(singleChartDto, res);

      expect(mockExportService.generatePng).toHaveBeenCalledTimes(1);
      expect(mockExportService.generatePng).toHaveBeenCalledWith(singleChartDto);
    });

    it('sets Content-Type to image/png', async () => {
      mockExportService.generatePng.mockResolvedValue(Buffer.from(''));
      const res = mockResponse() as unknown as Response;

      await controller.exportPng(singleChartDto, res);

      expect(res.set).toHaveBeenCalledWith({ 'Content-Type': 'image/png' });
    });

    it('sends the buffer returned by the service', async () => {
      const pngBuffer = Buffer.from('png-data');
      mockExportService.generatePng.mockResolvedValue(pngBuffer);
      const res = mockResponse() as unknown as Response;

      await controller.exportPng(singleChartDto, res);

      expect(res.send).toHaveBeenCalledWith(pngBuffer);
    });

    it('propagates errors thrown by the service', async () => {
      mockExportService.generatePng.mockRejectedValue(new Error('canvas error'));
      const res = mockResponse() as unknown as Response;

      await expect(controller.exportPng(singleChartDto, res)).rejects.toThrow('canvas error');
    });
  });

  // ── POST /export/pdf ────────────────────────────────────────────────────

  describe('exportPdf', () => {
    it('calls generatePdf with the received DTO', async () => {
      mockExportService.generatePdf.mockResolvedValue(Buffer.from(''));
      const res = mockResponse() as unknown as Response;

      await controller.exportPdf(pdfDto, res);

      expect(mockExportService.generatePdf).toHaveBeenCalledTimes(1);
      expect(mockExportService.generatePdf).toHaveBeenCalledWith(pdfDto);
    });

    it('sets Content-Type to application/pdf', async () => {
      mockExportService.generatePdf.mockResolvedValue(Buffer.from(''));
      const res = mockResponse() as unknown as Response;

      await controller.exportPdf(pdfDto, res);

      expect((res.set as jest.Mock).mock.calls[0][0]['Content-Type']).toBe('application/pdf');
    });

    it('uses dto.filename in Content-Disposition', async () => {
      mockExportService.generatePdf.mockResolvedValue(Buffer.from(''));
      const res = mockResponse() as unknown as Response;

      await controller.exportPdf(pdfDto, res);

      expect((res.set as jest.Mock).mock.calls[0][0]['Content-Disposition']).toContain('reporte.pdf');
    });

    it('falls back to "dashboard" when filename is not provided', async () => {
      const dtoWithoutName: ExportPdfDto = { sections: pdfDto.sections };
      mockExportService.generatePdf.mockResolvedValue(Buffer.from(''));
      const res = mockResponse() as unknown as Response;

      await controller.exportPdf(dtoWithoutName, res);

      expect((res.set as jest.Mock).mock.calls[0][0]['Content-Disposition']).toContain('dashboard.pdf');
    });

    it('sends the buffer returned by the service', async () => {
      const pdfBuffer = Buffer.from('pdf-data');
      mockExportService.generatePdf.mockResolvedValue(pdfBuffer);
      const res = mockResponse() as unknown as Response;

      await controller.exportPdf(pdfDto, res);

      expect(res.send).toHaveBeenCalledWith(pdfBuffer);
    });

    it('propagates errors thrown by the service', async () => {
      mockExportService.generatePdf.mockRejectedValue(new Error('pdf error'));
      const res = mockResponse() as unknown as Response;

      await expect(controller.exportPdf(pdfDto, res)).rejects.toThrow('pdf error');
    });
  });
});