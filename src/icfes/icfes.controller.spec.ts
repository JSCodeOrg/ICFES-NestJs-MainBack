import { Test, TestingModule } from '@nestjs/testing';
import { IcfesController } from './icfes.controller';
import { IcfesService } from './icfes.service';

describe('IcfesController', () => {
  let controller: IcfesController;

  const mockIcfesService = {
    distribucionGenero: jest.fn(),
    promedioAnual: jest.fn(),
    promedioNacional: jest.fn(),
    totalRegistros: jest.fn(),
    comparacionColegios: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [IcfesController],
      providers: [
        {
          provide: IcfesService,
          useValue: mockIcfesService,
        },
      ],
    }).compile();

    controller = module.get<IcfesController>(IcfesController);
  });

  it('Debería existir icfes controller', () => {
    expect(controller).toBeDefined();
  });

  describe('distribucionGenero', () => {
    it('Debería llamar al servicio de distribucion de genero', async () => {
      const mockResponse = [
        {
          genero: 'F',
          cantidad: 1833550,
          porcentaje: 54.43,
        },
        {
          genero: 'M',
          cantidad: 1534839,
          porcentaje: 45.56,
        },
      ];

      mockIcfesService.distribucionGenero.mockResolvedValue(mockResponse);

      const result = await controller.distribucionGenero();

      expect(result).toEqual(mockResponse);

      expect(mockIcfesService.distribucionGenero).toHaveBeenCalled();
    });
  });

  describe('promedioAnual', () => {
    it('debería llamar al controlador de promedio anual', async () => {
      const dto = { ano: 2018 };
      const mockResponse = [{ promedio: 250.283083 }];

      mockIcfesService.promedioAnual.mockResolvedValue(mockResponse);

      const result = await controller.promedioAnual(dto);

      expect(result).toEqual(mockResponse);
      expect(mockIcfesService.promedioAnual).toHaveBeenCalledWith(dto);
    });
  });
  describe('promedioNacional', () => {
    it('debería retornar el promedio nacional', async () => {
      const mockResponse = [{ promedio: 255.5 }];

      mockIcfesService.promedioNacional.mockResolvedValue(mockResponse);

      const result = await controller.promedioNacional();

      expect(result).toEqual(mockResponse);
      expect(mockIcfesService.promedioNacional).toHaveBeenCalled();
    });
  });
  describe('totalRegistros', () => {
    it('debería retornar el total de registros', async () => {
      const mockResponse = [{ total: 3000000 }];

      mockIcfesService.totalRegistros.mockResolvedValue(mockResponse);

      const result = await controller.totalRegistros();

      expect(result).toEqual(mockResponse);
      expect(mockIcfesService.totalRegistros).toHaveBeenCalled();
    });
  });
  describe('comparacionColegios', () => {
    it('debería retornar la comparación entre colegios', async () => {
      const mockResponse = [
        {
          tipo_colegio: 'OFICIAL',
          promedio: 250,
          total: 1000,
        },
        {
          tipo_colegio: 'NO OFICIAL',
          promedio: 270,
          total: 500,
        },
      ];

      mockIcfesService.comparacionColegios.mockResolvedValue(mockResponse);

      const result = await controller.comparacionColegios();

      expect(result).toEqual(mockResponse);
      expect(mockIcfesService.comparacionColegios).toHaveBeenCalled();
    });
  });
});
