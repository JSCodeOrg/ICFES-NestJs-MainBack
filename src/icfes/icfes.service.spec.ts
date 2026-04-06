import { Test, TestingModule } from '@nestjs/testing';
import { IcfesService } from './icfes.service';
import { getModelToken } from '@nestjs/mongoose';
import { Resultado } from './schema/icfes.schema';

describe('IcfesService', () => {
  let service: IcfesService;

  const distributionData = [
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

  const mockResultadoModel = {
    aggregate: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IcfesService,
        {
          provide: getModelToken(Resultado.name),
          useValue: mockResultadoModel,
        },
      ],
    }).compile();

    service = module.get<IcfesService>(IcfesService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('distribucionGenero', () => {
    it('debería retornar correctamente la distribución por género', async () => {
      mockResultadoModel.aggregate.mockResolvedValue(distributionData);

      const result = await service.distribucionGenero();

      expect(result).toEqual(distributionData);
      expect(mockResultadoModel.aggregate).toHaveBeenCalled();
    });
  });

  describe('promedioAnual', () => {
    it('debería retornar correctamente el promedio anual', async () => {
      const dto = { ano: 2018 };

      const promedioMock = [{ promedio: 250.9849904 }];

      mockResultadoModel.aggregate.mockResolvedValue(promedioMock);

      const result = await service.promedioAnual(dto);

      expect(result).toEqual(promedioMock);
      expect(mockResultadoModel.aggregate).toHaveBeenCalledWith([
        {
          $match: { ANIO_EXAMEN: 2018 },
        },
        {
          $group: {
            _id: null,
            promedio: { $avg: '$PUNT_GLOBAL' },
          },
        },
        {
          $project: {
            _id: 0,
            promedio: 1,
          },
        },
      ]);
    });

    it('debería retornar vacío si no hay datos para el año', async () => {
      const dto = { ano: 2018 };

      mockResultadoModel.aggregate.mockResolvedValue([]);

      const result = await service.promedioAnual(dto);

      expect(result).toEqual([]);
    });

    it('debería lanzar error si falla la base de datos', async () => {
      mockResultadoModel.aggregate.mockRejectedValue(new Error('DB error'));

      await expect(service.promedioAnual({ ano: 2018 })).rejects.toThrow();
    });
  });
  describe('promedioNacional', () => {
    it('debería retornar correctamente el promedio nacional', async () => {
      const mockResponse = [{ promedio: 255.3 }];

      mockResultadoModel.aggregate.mockResolvedValue(mockResponse);

      const result = await service.promedioNacional();

      expect(result).toEqual(mockResponse);
      expect(mockResultadoModel.aggregate).toHaveBeenCalledWith([
        {
          $match: {
            PUNT_GLOBAL: { $ne: null },
          },
        },
        {
          $group: {
            _id: null,
            promedio: { $avg: '$PUNT_GLOBAL' },
          },
        },
        {
          $project: {
            _id: 0,
            promedio: 1,
          },
        },
      ]);
    });

    it('debería lanzar error si falla la base de datos', async () => {
      mockResultadoModel.aggregate.mockRejectedValue(new Error('DB error'));

      await expect(service.promedioNacional()).rejects.toThrow();
    });
  });
  describe('totalRegistros', () => {
    it('debería retornar el total de registros', async () => {
      const mockResponse = [{ total: 3000000 }];

      mockResultadoModel.aggregate.mockResolvedValue(mockResponse);

      const result = await service.totalRegistros();

      expect(result).toEqual(mockResponse);
      expect(mockResultadoModel.aggregate).toHaveBeenCalledWith([
        {
          $match: {},
        },
        {
          $count: 'total',
        },
      ]);
    });

    it('debería lanzar error si falla la base de datos', async () => {
      mockResultadoModel.aggregate.mockRejectedValue(new Error('DB error'));

      await expect(service.totalRegistros()).rejects.toThrow();
    });
  });
  describe('comparacionColegios', () => {
    it('debería retornar la comparación de colegios', async () => {
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

      mockResultadoModel.aggregate.mockResolvedValue(mockResponse);

      const result = await service.comparacionColegios();

      expect(result).toEqual(mockResponse);
      expect(mockResultadoModel.aggregate).toHaveBeenCalledWith([
        {
          $match: {
            COLE_NATURALEZA: { $in: ['OFICIAL', 'NO OFICIAL'] },
            PUNT_GLOBAL: { $ne: null },
          },
        },
        {
          $group: {
            _id: '$COLE_NATURALEZA',
            promedio: { $avg: '$PUNT_GLOBAL' },
            total: { $sum: 1 },
          },
        },
        {
          $project: {
            _id: 0,
            tipo_colegio: '$_id',
            promedio: 1,
            total: 1,
          },
        },
        {
          $sort: {
            tipo_colegio: 1,
          },
        },
      ]);
    });

    it('debería lanzar error si falla la base de datos', async () => {
      mockResultadoModel.aggregate.mockRejectedValue(new Error('DB error'));

      await expect(service.comparacionColegios()).rejects.toThrow();
    });
  });
});
