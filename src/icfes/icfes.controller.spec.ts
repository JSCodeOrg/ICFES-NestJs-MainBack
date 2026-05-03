import { Test, TestingModule } from '@nestjs/testing';
import { IcfesController } from './icfes.controller';
import { IcfesService } from './icfes.service';
import { CacheService } from '../cache/cache.service';

describe('IcfesController', () => {
  let controller: IcfesController;

  const mockCacheService = {
    remember: jest.fn()
  }

  const mockIcfesService = {
    distribucionGeneroPorAnio: jest.fn(),
    promedioAnual: jest.fn(),
    promedioNacional: jest.fn(),
    totalRegistros: jest.fn(),
    comparacionColegios: jest.fn(),
    promedioDepartamentos: jest.fn(),
    promedioZonal: jest.fn(),
    topMunicipios: jest.fn(),
    promedioPorEdad: jest.fn(),
    topDepartamentos: jest.fn(),
    promedioPorAno: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [IcfesController],
      providers: [
        {
          provide: IcfesService,
          useValue: mockIcfesService,
        },
        {
          provide: CacheService,
          useValue: mockCacheService
        }
      ],
    }).compile();

    controller = module.get<IcfesController>(IcfesController);
  });

  it('Debería existir icfes controller', () => {
    expect(controller).toBeDefined();
  });

  describe('distribucionGeneroPorAnio', () => {
    it('Debería llamar al servicio de distribución por año', async () => {
      const mockResponse = [
        { key: '2018', values: [60, 40] },
        { key: '2019', values: [55, 45] },
      ];

      mockCacheService.remember.mockResolvedValue(mockResponse);

      const result = await controller.distribucionGenero();

      expect(result).toEqual(mockResponse);
      expect(mockCacheService.remember).toHaveBeenCalledWith(
        'distribucion_genero',
        {},
        expect.any(Function)
      );
    });

    it('debería ejecutar la función del servicio al no haber cache', async () => {
      const mockResponse = [{ key: '2018', values: [60, 40] }];

      mockCacheService.remember.mockImplementation(async (_tipo, _params, fn) => fn());
      mockIcfesService.distribucionGeneroPorAnio.mockResolvedValue(mockResponse);

      const result = await controller.distribucionGenero();

      expect(result).toEqual(mockResponse);
      expect(mockIcfesService.distribucionGeneroPorAnio).toHaveBeenCalled();
    });
  });

  describe('promedioAnual', () => {
    it('debería llamar al controlador de promedio anual', async () => {
      const dto = { ano: 2018 };
      const mockResponse = [{ promedio: 250.283083 }];

      mockCacheService.remember.mockResolvedValue(mockResponse);

      const result = await controller.promedioAnual(dto);

      expect(result).toEqual(mockResponse);
      expect(mockCacheService.remember).toHaveBeenCalledWith(
        'promedio_anual',
        dto,
        expect.any(Function)
      );
    });

    it('debería ejecutar la función del servicio al no haber cache', async () => {
      const dto = { ano: 2018 };
      const mockResponse = [{ promedio: 250.283083 }];

      mockCacheService.remember.mockImplementation(async (_tipo, _params, fn) => fn());
      mockIcfesService.promedioAnual.mockResolvedValue(mockResponse);

      const result = await controller.promedioAnual(dto);

      expect(result).toEqual(mockResponse);
      expect(mockIcfesService.promedioAnual).toHaveBeenCalledWith(dto);
    });
  });

  describe('promedioNacional', () => {
    it('debería retornar el promedio nacional', async () => {
      const mockResponse = [{ promedio: 255.5 }];

      mockCacheService.remember.mockResolvedValue(mockResponse);

      const result = await controller.promedioNacional();

      expect(result).toEqual(mockResponse);
      expect(mockCacheService.remember).toHaveBeenCalledWith(
        'promedio_nacional',
        {},
        expect.any(Function)
      );
    });

    it('debería ejecutar la función del servicio al no haber cache', async () => {
      const mockResponse = [{ promedio: 255.5 }];

      mockCacheService.remember.mockImplementation(async (_tipo, _params, fn) => fn());
      mockIcfesService.promedioNacional.mockResolvedValue(mockResponse);

      const result = await controller.promedioNacional();

      expect(result).toEqual(mockResponse);
      expect(mockIcfesService.promedioNacional).toHaveBeenCalled();
    });
  });

  describe('totalRegistros', () => {
    it('debería retornar el total de registros', async () => {
      const mockResponse = [{ total: 3000000 }];

      mockCacheService.remember.mockResolvedValue(mockResponse);

      const result = await controller.totalRegistros();

      expect(result).toEqual(mockResponse);
      expect(mockCacheService.remember).toHaveBeenCalledWith(
        'total_registros',
        {},
        expect.any(Function)
      );
    });

    it('debería ejecutar la función del servicio al no haber cache', async () => {
      const mockResponse = [{ total: 3000000 }];

      mockCacheService.remember.mockImplementation(async (_tipo, _params, fn) => fn());
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
          data: [
            { key: '2014', value: 250.1 },
            { key: '2015', value: 260.3 },
          ],
        },
        {
          tipo_colegio: 'NO OFICIAL',
          data: [
            { key: '2014', value: 270.5 },
            { key: '2015', value: 280.2 },
          ],
        },
      ];

      mockCacheService.remember.mockResolvedValue(mockResponse);

      const result = await controller.comparacionColegios();

      expect(result).toEqual(mockResponse);
      expect(mockCacheService.remember).toHaveBeenCalledWith(
        'comparacion_colegios',
        {},
        expect.any(Function)
      );
    });

    it('debería ejecutar la función del servicio al no haber cache', async () => {
      const mockResponse = [{ tipo_colegio: 'OFICIAL', data: [] }];

      mockCacheService.remember.mockImplementation(async (_tipo, _params, fn) => fn());
      mockIcfesService.comparacionColegios.mockResolvedValue(mockResponse);

      const result = await controller.comparacionColegios();

      expect(result).toEqual(mockResponse);
      expect(mockIcfesService.comparacionColegios).toHaveBeenCalled();
    });
  });

  describe('promedioDepartamento', () => {
    it('debería llamar al servicio de promedio por departamento', async () => {
      const mockResponse = [
        { departamento: 'ANTIOQUIA', promedio: 265.4 },
        { departamento: 'CUNDINAMARCA', promedio: 258.1 },
      ];

      mockIcfesService.promedioDepartamentos.mockResolvedValue(mockResponse);

      const result = await controller.promedioDepartameto();

      expect(result).toEqual(mockResponse);
      expect(mockIcfesService.promedioDepartamentos).toHaveBeenCalled();
    });
  });

  describe('promedioZona', () => {
    it('debería llamar al servicio de promedio por zona', async () => {
      const mockResponse = [
        { zona: 'URBANO', promedio: 268.3 },
        { zona: 'RURAL', promedio: 241.7 },
      ];

      mockCacheService.remember.mockResolvedValue(mockResponse);

      const result = await controller.promedioZonal();

      expect(result).toEqual(mockResponse);
      expect(mockCacheService.remember).toHaveBeenCalledWith(
        'promedio_zona',
        {},
        expect.any(Function)
      );
    });

    it('debería ejecutar la función del servicio al no haber cache', async () => {
      const mockResponse = [{ zona: 'URBANO', promedio: 268.3 }];

      mockCacheService.remember.mockImplementation(async (_tipo, _params, fn) => fn());
      mockIcfesService.promedioZonal.mockResolvedValue(mockResponse);

      const result = await controller.promedioZonal();

      expect(result).toEqual(mockResponse);
      expect(mockIcfesService.promedioZonal).toHaveBeenCalled();
    });
  });

  describe('topMunicipios', () => {
    it('debería llamar al servicio de top municipios', async () => {
      const mockResponse = [
        { municipio: 'BOGOTÁ', promedio: 280.5 },
        { municipio: 'MEDELLÍN', promedio: 275.2 },
      ];

      mockIcfesService.topMunicipios.mockResolvedValue(mockResponse);

      const result = await controller.topMunicipios();

      expect(result).toEqual(mockResponse);
      expect(mockIcfesService.topMunicipios).toHaveBeenCalled();
    });
  });

  describe('promedioEdades', () => {
    it('debería llamar al servicio de promedio por edad', async () => {
      const mockResponse = [
        { edad: 16, promedio: 255.1 },
        { edad: 17, promedio: 261.4 },
        { edad: 18, promedio: 258.9 },
      ];

      mockIcfesService.promedioPorEdad.mockResolvedValue(mockResponse);

      const result = await controller.promedioEdades();

      expect(result).toEqual(mockResponse);
      expect(mockIcfesService.promedioPorEdad).toHaveBeenCalled();
    });
  });

  describe('topDepartamentos', () => {
    it('debería retornar el top de departamentos con limit por defecto', async () => {
      const mockResponse = [
        { departamento: 'BOGOTÁ', promedio: 285.3, total_estudiantes: 10000 },
        { departamento: 'ANTIOQUIA', promedio: 270.1, total_estudiantes: 8000 },
      ];

      mockCacheService.remember.mockResolvedValue(mockResponse);

      const result = await controller.topDepartamentos({ limit: 5 });

      expect(result).toEqual(mockResponse);
      expect(mockCacheService.remember).toHaveBeenCalledWith(
        'top_departamentos',
        { limit: 5 },
        expect.any(Function)
      );
    });

    it('debería usar el limit recibido por query', async () => {
      const mockResponse = [
        { departamento: 'BOGOTÁ', promedio: 285.3, total_estudiantes: 10000 },
      ];

      mockCacheService.remember.mockResolvedValue(mockResponse);

      const result = await controller.topDepartamentos({ limit: 1 });

      expect(result).toEqual(mockResponse);
      expect(mockCacheService.remember).toHaveBeenCalledWith(
        'top_departamentos',
        { limit: 1 },
        expect.any(Function)
      );
    });

    it('debería usar limit 5 si el valor recibido no es válido', async () => {
      mockCacheService.remember.mockResolvedValue([]);

      await controller.topDepartamentos({ limit: NaN });

      expect(mockCacheService.remember).toHaveBeenCalledWith(
        'top_departamentos',
        { limit: 5 },
        expect.any(Function)
      );
    });

    it('debería ejecutar la función del servicio al no haber cache', async () => {
      const mockResponse = [{ departamento: 'BOGOTÁ', promedio: 285.3, total_estudiantes: 10000 }];

      mockCacheService.remember.mockImplementation(async (_tipo, _params, fn) => fn());
      mockIcfesService.topDepartamentos.mockResolvedValue(mockResponse);

      const result = await controller.topDepartamentos({ limit: 5 });

      expect(result).toEqual(mockResponse);
      expect(mockIcfesService.topDepartamentos).toHaveBeenCalledWith(5);
    });
  });
});