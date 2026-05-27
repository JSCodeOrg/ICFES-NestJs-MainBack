import { Test, TestingModule } from '@nestjs/testing';
import { IcfesService } from './icfes.service';
import { getModelToken } from '@nestjs/mongoose';
import { Resultado } from './schema/icfes.schema';
import { InternalServerErrorException } from '@nestjs/common';
import { CacheService } from '../cache/cache.service';

// ── Tipos espejo del service ──────────────────────────────────────────────────

interface PromedioItem {
  promedio: number;
}

interface TotalRegistrosItem {
  total: number;
}

interface ComparacionColegiosItem {
  tipo_colegio: string;
  promedio: number;
  total: number;
}

// ─────────────────────────────────────────────────────────────────────────────

describe('IcfesService', () => {
  let service: IcfesService;

  const mockResultadoModel = {
    aggregate: jest.fn(),
  };

  const mockCacheService = {
    remember: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IcfesService,
        {
          provide: getModelToken(Resultado.name),
          useValue: mockResultadoModel,
        },
        {
          provide: CacheService,
          useValue: mockCacheService,
        },
      ],
    }).compile();

    service = module.get(IcfesService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── promedioAnual ────────────────────────────────────────────────────────
  //
  // NOTA: aggregate() se retorna sin await, por lo que el catch nunca
  // intercepta errores de BD. El BadRequestException sí es interceptado
  // porque se lanza sincrónicamente antes de la llamada a aggregate.

  describe('promedioAnual', () => {
    const anosValidos = [2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022];

    it.each(anosValidos)('retorna promedio para el año válido %i', async (ano) => {
      const data: PromedioItem[] = [{ promedio: 250 }];
      mockResultadoModel.aggregate.mockReturnValue(Promise.resolve(data));

      const result = (await service.promedioAnual({ ano })) as PromedioItem[];

      expect(result).toEqual(data);
      expect(mockResultadoModel.aggregate).toHaveBeenCalledTimes(1);
    });

    it('retorna arreglo vacío cuando no hay registros para el año', async () => {
      mockResultadoModel.aggregate.mockReturnValue(Promise.resolve([]));

      const result = await service.promedioAnual({ ano: 2018 });

      expect(result).toEqual([]);
    });

    it.each([2010, 2013, 2023, 0, -1, 1999])('lanza InternalServerErrorException para el año inválido %i (BadRequest envuelta por catch)', async (ano) => {
      await expect(service.promedioAnual({ ano })).rejects.toThrow(InternalServerErrorException);
      await expect(service.promedioAnual({ ano })).rejects.toMatchObject({
        message: expect.stringContaining('2014-2022') as string,
      });
      expect(mockResultadoModel.aggregate).not.toHaveBeenCalled();
    });

    it('propaga el error de BD sin envolver (falta await en service)', async () => {
      const dbError = new Error('DB fail');
      mockResultadoModel.aggregate.mockReturnValue(Promise.reject(dbError));

      await expect(service.promedioAnual({ ano: 2018 })).rejects.toThrow('DB fail');
    });
  });

  // ─── promedioNacional ─────────────────────────────────────────────────────

  describe('promedioNacional', () => {
    it('retorna el promedio nacional correctamente', async () => {
      const data: PromedioItem[] = [{ promedio: 255 }];
      mockResultadoModel.aggregate.mockReturnValue(Promise.resolve(data));

      const result = (await service.promedioNacional()) as PromedioItem[];

      expect(result).toEqual(data);
      expect(mockResultadoModel.aggregate).toHaveBeenCalledTimes(1);
    });

    it('retorna arreglo vacío cuando no hay registros', async () => {
      mockResultadoModel.aggregate.mockReturnValue(Promise.resolve([]));

      const result = await service.promedioNacional();

      expect(result).toEqual([]);
    });

    it('propaga el error de BD sin envolver (falta await en service)', async () => {
      const dbError = new Error('DB fail');
      mockResultadoModel.aggregate.mockReturnValue(Promise.reject(dbError));

      await expect(service.promedioNacional()).rejects.toThrow('DB fail');
    });
    it('lanza InternalServerErrorException cuando aggregate lanza síncronamente', async () => {
      mockResultadoModel.aggregate.mockImplementation(() => {
        throw new Error('sync error');
      });

      await expect(service.promedioNacional()).rejects.toThrow(InternalServerErrorException);
    });
  });

  // ─── totalRegistros ───────────────────────────────────────────────────────

  describe('totalRegistros', () => {
    it('retorna el total de registros correctamente', async () => {
      const data: TotalRegistrosItem[] = [{ total: 10 }];
      mockResultadoModel.aggregate.mockReturnValue(Promise.resolve(data));

      const result = (await service.totalRegistros()) as TotalRegistrosItem[];

      expect(result).toEqual(data);
      expect(mockResultadoModel.aggregate).toHaveBeenCalledTimes(1);
    });

    it('retorna arreglo vacío cuando no hay registros', async () => {
      mockResultadoModel.aggregate.mockReturnValue(Promise.resolve([]));

      const result = await service.totalRegistros();

      expect(result).toEqual([]);
    });

    it('propaga el error de BD sin envolver (falta await en service)', async () => {
      const dbError = new Error('DB fail');
      mockResultadoModel.aggregate.mockReturnValue(Promise.reject(dbError));

      await expect(service.totalRegistros()).rejects.toThrow('DB fail');
    });
    it('lanza InternalServerErrorException cuando aggregate lanza síncronamente', async () => {
      mockResultadoModel.aggregate.mockImplementation(() => {
        throw new Error('sync error');
      });

      await expect(service.totalRegistros()).rejects.toThrow(InternalServerErrorException);
    });
  });

  // ─── comparacionColegios ──────────────────────────────────────────────────

  interface ComparacionColegiosPorAnioItem {
    tipo_colegio: string;
    data: {
      key: string;
      value: number;
    }[];
  }

  describe('comparacionColegios', () => {
    it('retorna la comparación de colegios por año correctamente', async () => {
      const data: ComparacionColegiosPorAnioItem[] = [
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

      mockResultadoModel.aggregate.mockReturnValue(Promise.resolve(data));

      const result = (await service.comparacionColegios()) as ComparacionColegiosPorAnioItem[];

      expect(result).toEqual(data);
      expect(mockResultadoModel.aggregate).toHaveBeenCalledTimes(1);
    });

    it('retorna arreglo vacío cuando no hay registros', async () => {
      mockResultadoModel.aggregate.mockReturnValue(Promise.resolve([]));

      const result = await service.comparacionColegios();

      expect(result).toEqual([]);
    });

    it('propaga el error de BD sin envolver (falta await en service)', async () => {
      const dbError = new Error('DB fail');
      mockResultadoModel.aggregate.mockReturnValue(Promise.reject(dbError));

      await expect(service.comparacionColegios()).rejects.toThrow('DB fail');
    });

    it('lanza InternalServerErrorException cuando aggregate lanza síncronamente', async () => {
      mockResultadoModel.aggregate.mockImplementation(() => {
        throw new Error('sync error');
      });

      await expect(service.comparacionColegios()).rejects.toThrow(InternalServerErrorException);
    });
  });
  describe('distribucionGeneroPorAnio', () => {
    it('retorna los datos correctamente', async () => {
      const data = [
        { key: '2018', values: [60, 40] },
        { key: '2019', values: [55, 45] },
      ];
      mockResultadoModel.aggregate.mockReturnValue(Promise.resolve(data));

      const result = await service.distribucionGeneroPorAnio();

      expect(result).toEqual(data);
      expect(mockResultadoModel.aggregate).toHaveBeenCalledTimes(1);
    });

    it('retorna arreglo vacío cuando no hay datos', async () => {
      mockResultadoModel.aggregate.mockReturnValue(Promise.resolve([]));

      const result = await service.distribucionGeneroPorAnio();

      expect(result).toEqual([]);
    });

    it('propaga error de BD', async () => {
      const dbError = new Error('DB fail');
      mockResultadoModel.aggregate.mockReturnValue(Promise.reject(dbError));

      await expect(service.distribucionGeneroPorAnio()).rejects.toThrow('DB fail');
    });
  });
  describe('promedioDepartamentos', () => {
    it('retorna los datos correctamente', async () => {
      const data = [{ departamento: 'VALLE', promedio: 260, total_estudiantes: 100, ranking: 1 }];

      mockResultadoModel.aggregate.mockResolvedValue(data);

      const result = await service.promedioDepartamentos();

      expect(result).toEqual(data);
    });

    it('retorna arreglo vacío', async () => {
      mockResultadoModel.aggregate.mockResolvedValue([]);

      const result = await service.promedioDepartamentos();

      expect(result).toEqual([]);
    });
    it('propaga error de BD', async () => {
      const dbError = new Error('DB fail');
      mockResultadoModel.aggregate.mockRejectedValue(dbError);

      await expect(service.promedioDepartamentos()).rejects.toThrow('DB fail');
    });
  });
  describe('promedioZonal', () => {
    it('retorna los datos correctamente', async () => {
      const data = [{ zona: 'URBANO', promedio: 270, total_estudiantes: 80 }];
      mockResultadoModel.aggregate.mockReturnValue(Promise.resolve(data));

      const result = await service.promedioZonal();

      expect(result).toEqual(data);
    });

    it('retorna arreglo vacío', async () => {
      mockResultadoModel.aggregate.mockReturnValue(Promise.resolve([]));

      const result = await service.promedioZonal();

      expect(result).toEqual([]);
    });

    it('propaga error de BD', async () => {
      const dbError = new Error('DB fail');
      mockResultadoModel.aggregate.mockReturnValue(Promise.reject(dbError));

      await expect(service.promedioZonal()).rejects.toThrow('DB fail');
    });
  });
  describe('topMunicipios', () => {
    it('retorna los datos correctamente', async () => {
      const data = [{ municipio: 'TULUA', promedio: 280, total_estudiantes: 50 }];
      mockResultadoModel.aggregate.mockReturnValue(Promise.resolve(data));

      const result = await service.topMunicipios();

      expect(result).toEqual(data);
    });

    it('retorna arreglo vacío', async () => {
      mockResultadoModel.aggregate.mockReturnValue(Promise.resolve([]));

      const result = await service.topMunicipios();

      expect(result).toEqual([]);
    });

    it('propaga error de BD', async () => {
      const dbError = new Error('DB fail');
      mockResultadoModel.aggregate.mockReturnValue(Promise.reject(dbError));

      await expect(service.topMunicipios()).rejects.toThrow('DB fail');
    });
  });
  describe('promedioPorEdad', () => {
    it('retorna los datos correctamente', async () => {
      const data = [{ edad: 17, promedio: 250, total_estudiantes: 30 }];
      mockResultadoModel.aggregate.mockReturnValue(Promise.resolve(data));

      const result = await service.promedioPorEdad();

      expect(result).toEqual(data);
    });

    it('retorna arreglo vacío', async () => {
      mockResultadoModel.aggregate.mockReturnValue(Promise.resolve([]));

      const result = await service.promedioPorEdad();

      expect(result).toEqual([]);
    });

    it('propaga error de BD', async () => {
      const dbError = new Error('DB fail');
      mockResultadoModel.aggregate.mockReturnValue(Promise.reject(dbError));

      await expect(service.promedioPorEdad()).rejects.toThrow('DB fail');
    });
  });

  describe('topDepartamentos', () => {
    it('debería retornar el top de departamentos', async () => {
      const mockResponse = [
        { departamento: 'BOGOTÁ', promedio: 285.3, total_estudiantes: 10000 },
        { departamento: 'ANTIOQUIA', promedio: 270.1, total_estudiantes: 8000 },
      ];

      mockResultadoModel.aggregate.mockResolvedValue(mockResponse);

      const result = await service.topDepartamentos(5);

      expect(result).toEqual(mockResponse);
      expect(mockResultadoModel.aggregate).toHaveBeenCalled();
    });

    it('debería usar limit 5 por defecto', async () => {
      mockResultadoModel.aggregate.mockResolvedValue([]);

      await service.topDepartamentos();

      expect(mockResultadoModel.aggregate).toHaveBeenCalled();
    });

    it('debería lanzar InternalServerErrorException si falla el aggregate', async () => {
      mockResultadoModel.aggregate.mockImplementation(() => {
        throw new Error('DB error');
      });

      await expect(service.topDepartamentos(5)).rejects.toThrow(InternalServerErrorException);
    });
  });
  describe('getPromedioHistoricoPorDepartamento', () => {
    it('debería retornar el promedio histórico de un departamento', async () => {
      const mockResponse = [
        { year: 2018, promedio: 265.4 },
        { year: 2019, promedio: 270.1 },
      ];

      mockResultadoModel.aggregate.mockResolvedValue(mockResponse);

      const result = await service.getPromedioHistoricoPorDepartamento('ANTIOQUIA');

      expect(result).toEqual(mockResponse);
      expect(mockResultadoModel.aggregate).toHaveBeenCalled();
    });

    it('debería retornar arreglo vacío cuando no hay datos', async () => {
      mockResultadoModel.aggregate.mockResolvedValue([]);

      const result = await service.getPromedioHistoricoPorDepartamento('ANTIOQUIA');

      expect(result).toEqual([]);
    });

    it('debería lanzar InternalServerErrorException si falla el aggregate', async () => {
      mockResultadoModel.aggregate.mockImplementation(() => {
        throw new Error('DB error');
      });

      await expect(service.getPromedioHistoricoPorDepartamento('ANTIOQUIA')).rejects.toThrow(InternalServerErrorException);
    });

    it('debería propagar error de BD sin envolver', async () => {
      mockResultadoModel.aggregate.mockReturnValue(Promise.reject(new Error('DB fail')));

      await expect(service.getPromedioHistoricoPorDepartamento('ANTIOQUIA')).rejects.toThrow('DB fail');
    });
  });

  describe('getTopMunicipiosPorDepartamento', () => {
    it('debería retornar el top de municipios de un departamento', async () => {
      const mockResponse = [
        { municipio: 'MEDELLIN', promedio: 280, total_estudiantes: 100 },
        { municipio: 'ENVIGADO', promedio: 275, total_estudiantes: 80 },
      ];

      mockResultadoModel.aggregate.mockResolvedValue(mockResponse);

      const result = await service.getTopMunicipiosPorDepartamento('ANTIOQUIA', 2);

      expect(result).toEqual(mockResponse);
      expect(mockResultadoModel.aggregate).toHaveBeenCalled();
    });

    it('debería retornar arreglo vacío', async () => {
      mockResultadoModel.aggregate.mockResolvedValue([]);

      const result = await service.getTopMunicipiosPorDepartamento('ANTIOQUIA', 5);

      expect(result).toEqual([]);
    });

    it('debería lanzar InternalServerErrorException si falla sync', async () => {
      mockResultadoModel.aggregate.mockImplementation(() => {
        throw new Error('DB error');
      });

      await expect(service.getTopMunicipiosPorDepartamento('ANTIOQUIA', 5)).rejects.toThrow(InternalServerErrorException);
    });

    it('debería propagar error async', async () => {
      mockResultadoModel.aggregate.mockReturnValue(Promise.reject(new Error('DB fail')));

      await expect(service.getTopMunicipiosPorDepartamento('ANTIOQUIA', 5)).rejects.toThrow('DB fail');
    });
  });

  describe('getBottomMunicipiosPorDepartamento', () => {
    it('debería retornar el bottom de municipios de un departamento', async () => {
      const mockResponse = [
        { municipio: 'MUNICIPIO_X', promedio: 210, total_estudiantes: 50 },
        { municipio: 'MUNICIPIO_Y', promedio: 215, total_estudiantes: 60 },
      ];

      mockResultadoModel.aggregate.mockResolvedValue(mockResponse);

      const result = await service.getBottomMunicipiosDepartamento('ANTIOQUIA', 2);

      expect(result).toEqual(mockResponse);
      expect(mockResultadoModel.aggregate).toHaveBeenCalled();
    });

    it('debería retornar arreglo vacío', async () => {
      mockResultadoModel.aggregate.mockResolvedValue([]);

      const result = await service.getBottomMunicipiosDepartamento('ANTIOQUIA', 5);

      expect(result).toEqual([]);
    });

    it('debería lanzar InternalServerErrorException si falla sync', async () => {
      mockResultadoModel.aggregate.mockImplementation(() => {
        throw new Error('DB error');
      });

      await expect(service.getBottomMunicipiosDepartamento('ANTIOQUIA', 5)).rejects.toThrow(InternalServerErrorException);
    });

    it('debería propagar error async', async () => {
      mockResultadoModel.aggregate.mockReturnValue(Promise.reject(new Error('DB fail')));

      await expect(service.getBottomMunicipiosDepartamento('ANTIOQUIA', 5)).rejects.toThrow('DB fail');
    });
  });

  describe('getMetricasMunicipiosPorDepartamento', () => {
    it('debería retornar las métricas de municipios de un departamento', async () => {
      const mockResponse = [
        { municipio: 'MEDELLIN', promedio: 280.5, total_estudiantes: 1500, desviacion: 12.3 },
        { municipio: 'BELLO', promedio: 265.8, total_estudiantes: 900, desviacion: 10.7 },
      ];
      mockResultadoModel.aggregate.mockResolvedValue(mockResponse);

      const result = await service.getMetricasMunicipiosPorDepartamento('ANTIOQUIA');

      expect(result).toEqual(mockResponse);
      expect(mockResultadoModel.aggregate).toHaveBeenCalled();
    });

    it('debería retornar arreglo vacío', async () => {
      mockResultadoModel.aggregate.mockResolvedValue([]);

      const result = await service.getMetricasMunicipiosPorDepartamento('ANTIOQUIA');

      expect(result).toEqual([]);
    });

    it('debería lanzar InternalServerErrorException si falla sync', async () => {
      mockResultadoModel.aggregate.mockImplementation(() => {
        throw new Error('DB error');
      });

      await expect(service.getMetricasMunicipiosPorDepartamento('ANTIOQUIA')).rejects.toThrow(InternalServerErrorException);
    });

    it('debería propagar error async', async () => {
      mockResultadoModel.aggregate.mockReturnValue(Promise.reject(new Error('DB fail')));

      await expect(service.getMetricasMunicipiosPorDepartamento('ANTIOQUIA')).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('getDistribucionEstratoDepartamento', () => {
    it('debería retornar la distribución socioeconómica de un departamento', async () => {
      const mockResponse = [
        { key: 'Estrato 1', value: 33.33 },
        { key: 'Estrato 2', value: 46.67 },
        { key: 'Estrato 3', value: 20.0 },
      ];
      mockResultadoModel.aggregate.mockResolvedValue(mockResponse);

      const result = await service.getDistribucionEstratoDepartamento('ANTIOQUIA');

      expect(result).toEqual(mockResponse);
      expect(mockResultadoModel.aggregate).toHaveBeenCalled();
    });

    it('debería retornar arreglo vacío', async () => {
      mockResultadoModel.aggregate.mockResolvedValue([]);

      const result = await service.getDistribucionEstratoDepartamento('ANTIOQUIA');

      expect(result).toEqual([]);
    });

    it('debería lanzar InternalServerErrorException si falla sync', async () => {
      mockResultadoModel.aggregate.mockImplementation(() => {
        throw new Error('DB error');
      });

      await expect(service.getDistribucionEstratoDepartamento('ANTIOQUIA')).rejects.toThrow(InternalServerErrorException);
    });

    it('debería propagar error async', async () => {
      mockResultadoModel.aggregate.mockReturnValue(Promise.reject(new Error('DB fail')));

      await expect(service.getDistribucionEstratoDepartamento('ANTIOQUIA')).rejects.toThrow('DB fail');
    });
  });

  describe('getComparacionAccesoTecnologico', () => {
    it('debería retornar la comparación de acceso tecnológico entre dos departamentos', async () => {
      const mockAggregate = [
        { _id: 'ANTIOQUIA', internet: 0.755, computador: 0.601 },
        { _id: 'CUNDINAMARCA', internet: 0.682, computador: 0.554 },
      ];
      mockResultadoModel.aggregate.mockResolvedValue(mockAggregate);

      const result = await service.getComparacionAccesoTecnologico('ANTIOQUIA', 'CUNDINAMARCA');

      expect(result[0]).toEqual({ key: 'Internet', values: [75.5, 68.2] });
      expect(result[1].key).toBe('Computador');
      expect(result[1].values[0]).toBeCloseTo(60.1, 5);
      expect(result[1].values[1]).toBeCloseTo(55.4, 5);
    });

    it('debería retornar valores en 0 si un departamento no tiene datos', async () => {
      mockResultadoModel.aggregate.mockResolvedValue([{ _id: 'ANTIOQUIA', internet: 0.5, computador: 0.4 }]);

      const result = await service.getComparacionAccesoTecnologico('ANTIOQUIA', 'CUNDINAMARCA');

      expect(result).toEqual([
        { key: 'Internet', values: [50, 0] },
        { key: 'Computador', values: [40, 0] },
      ]);
    });

    it('debería retornar arreglo vacío si no hay datos', async () => {
      mockResultadoModel.aggregate.mockResolvedValue([]);

      const result = await service.getComparacionAccesoTecnologico('ANTIOQUIA', 'CUNDINAMARCA');

      expect(result).toEqual([
        { key: 'Internet', values: [0, 0] },
        { key: 'Computador', values: [0, 0] },
      ]);
    });

    it('debería lanzar InternalServerErrorException si falla sync', async () => {
      mockResultadoModel.aggregate.mockImplementation(() => {
        throw new Error('DB error');
      });

      await expect(service.getComparacionAccesoTecnologico('ANTIOQUIA', 'CUNDINAMARCA')).rejects.toThrow(InternalServerErrorException);
    });

    it('debería propagar error async', async () => {
      mockResultadoModel.aggregate.mockReturnValue(Promise.reject(new Error('DB fail')));

      await expect(service.getComparacionAccesoTecnologico('ANTIOQUIA', 'CUNDINAMARCA')).rejects.toThrow('DB fail');
    });
  });

  describe('participacionPorAno', () => {
    it('retorna los datos correctamente sin segmentación ni filtros', async () => {
      const data = [
        { ano: '2014', total_estudiantes: 100 },
        { ano: '2015', total_estudiantes: 150 },
      ];
      mockResultadoModel.aggregate.mockReturnValue(Promise.resolve(data));

      const result = await service.participacionPorAno();

      expect(result).toEqual(data);
      expect(mockResultadoModel.aggregate).toHaveBeenCalledTimes(1);
    });

    it('retorna los datos filtrados por departamento', async () => {
      const data = [{ ano: '2014', total_estudiantes: 80 }];
      mockResultadoModel.aggregate.mockReturnValue(Promise.resolve(data));

      const result = await service.participacionPorAno({ departamento: 'VALLE' });

      expect(result).toEqual(data);
      expect(mockResultadoModel.aggregate).toHaveBeenCalledTimes(1);
    });

    it('retorna los datos filtrados por rango de años', async () => {
      const data = [
        { ano: '2016', total_estudiantes: 120 },
        { ano: '2017', total_estudiantes: 130 },
      ];
      mockResultadoModel.aggregate.mockReturnValue(Promise.resolve(data));

      const result = await service.participacionPorAno({ anoDesde: 2016, anoHasta: 2017 });

      expect(result).toEqual(data);
      expect(mockResultadoModel.aggregate).toHaveBeenCalledTimes(1);
    });

    it('retorna los datos filtrados por naturaleza', async () => {
      const data = [{ ano: '2018', total_estudiantes: 200 }];
      mockResultadoModel.aggregate.mockReturnValue(Promise.resolve(data));

      const result = await service.participacionPorAno({ naturaleza: 'OFICIAL' });

      expect(result).toEqual(data);
      expect(mockResultadoModel.aggregate).toHaveBeenCalledTimes(1);
    });

    it('retorna los datos segmentados por género con filtro de zona', async () => {
      const data = [
        { ano: '2019', total_estudiantes: 60, segmento: 'M' },
        { ano: '2019', total_estudiantes: 40, segmento: 'F' },
      ];
      mockResultadoModel.aggregate.mockReturnValue(Promise.resolve(data));

      const result = await service.participacionPorAno({ zona: 'URBANO' }, 'genero');

      expect(result).toEqual(data);
      expect(mockResultadoModel.aggregate).toHaveBeenCalledTimes(1);
    });

    it('retorna los datos segmentados por zona con filtro de género', async () => {
      const data = [
        { ano: '2020', total_estudiantes: 50, segmento: 'URBANO' },
        { ano: '2020', total_estudiantes: 10, segmento: 'RURAL' },
      ];
      mockResultadoModel.aggregate.mockReturnValue(Promise.resolve(data));

      const result = await service.participacionPorAno({ genero: 'F' }, 'zona');

      expect(result).toEqual(data);
      expect(mockResultadoModel.aggregate).toHaveBeenCalledTimes(1);
    });

    it('retorna los datos con múltiples filtros combinados', async () => {
      const data = [{ ano: '2015', total_estudiantes: 45, segmento: 'M' }];
      mockResultadoModel.aggregate.mockReturnValue(Promise.resolve(data));

      const result = await service.participacionPorAno({ departamento: 'VALLE', naturaleza: 'NO OFICIAL', anoDesde: 2015, anoHasta: 2018 }, 'genero');

      expect(result).toEqual(data);
      expect(mockResultadoModel.aggregate).toHaveBeenCalledTimes(1);
    });

    it('retorna arreglo vacío cuando no hay registros', async () => {
      mockResultadoModel.aggregate.mockReturnValue(Promise.resolve([]));

      const result = await service.participacionPorAno();

      expect(result).toEqual([]);
    });

    it('retorna arreglo vacío con filtros aplicados y sin coincidencias', async () => {
      mockResultadoModel.aggregate.mockReturnValue(Promise.resolve([]));

      const result = await service.participacionPorAno({ departamento: 'AMAZONAS', anoDesde: 2022, anoHasta: 2022 });

      expect(result).toEqual([]);
      expect(mockResultadoModel.aggregate).toHaveBeenCalledTimes(1);
    });

    it('propaga el error de BD como InternalServerErrorException', async () => {
      mockResultadoModel.aggregate.mockReturnValue(Promise.reject(new Error('DB fail')));

      await expect(service.participacionPorAno()).rejects.toThrow(InternalServerErrorException);
    });

    it('lanza InternalServerErrorException cuando aggregate lanza síncronamente', async () => {
      mockResultadoModel.aggregate.mockImplementation(() => {
        throw new Error('sync error');
      });

      await expect(service.participacionPorAno()).rejects.toThrow(InternalServerErrorException);
    });

    it('lanza InternalServerErrorException con el mensaje correcto', async () => {
      mockResultadoModel.aggregate.mockReturnValue(Promise.reject(new Error('DB fail')));

      await expect(service.participacionPorAno()).rejects.toThrow('Error al calcular la participación por año');
    });
  });
});
