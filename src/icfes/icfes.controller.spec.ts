import { Test, TestingModule } from '@nestjs/testing';
import { IcfesController } from './icfes.controller';
import { IcfesService } from './icfes.service';
import { CacheService } from '../cache/cache.service';

describe('IcfesController', () => {
  let controller: IcfesController;

  const mockCacheService = {
    remember: jest.fn(),
  };

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
    getPromedioHistoricoPorDepartamento: jest.fn(),
    getTopMunicipiosPorDepartamento: jest.fn(),
    getBottomMunicipiosDepartamento: jest.fn(),
    getMetricasMunicipiosPorDepartamento: jest.fn(),
    getDistribucionEstratoDepartamento: jest.fn(),
    getComparacionAccesoTecnologico: jest.fn(),
    desempenoPorEstrato: jest.fn(),
    distribucionPorEdad: jest.fn(),
    impactoEquipamientoHogar: jest.fn(),
    desempenoPorEducacionPadres: jest.fn(),
    participacionPorAno: jest.fn(),
    distribucionPuntajeGlobalPorDepartamento: jest.fn(),
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
          useValue: mockCacheService,
        },
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
      expect(mockCacheService.remember).toHaveBeenCalledWith('distribucion_genero', {}, expect.any(Function));
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
      expect(mockCacheService.remember).toHaveBeenCalledWith('promedio_anual', dto, expect.any(Function));
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
    it('debería retornar el promedio nacional sin filtros', async () => {
      const mockResponse = [{ promedio: 255.5 }];
      mockCacheService.remember.mockResolvedValue(mockResponse);

      const result = await controller.promedioNacional();

      expect(result).toEqual(mockResponse);
      expect(mockCacheService.remember).toHaveBeenCalledWith('promedio_nacional', { anio: undefined, departamento: undefined }, expect.any(Function));
    });

    it('debería filtrar por anio', async () => {
      const mockResponse = [{ promedio: 260.1 }];
      mockCacheService.remember.mockResolvedValue(mockResponse);

      const result = await controller.promedioNacional('2019');

      expect(result).toEqual(mockResponse);
      expect(mockCacheService.remember).toHaveBeenCalledWith('promedio_nacional', { anio: 2019, departamento: undefined }, expect.any(Function));
    });

    it('debería ejecutar el servicio al no haber cache', async () => {
      mockCacheService.remember.mockImplementation(async (_k, _p, fn) => fn());
      mockIcfesService.promedioNacional.mockResolvedValue([{ promedio: 255.5 }]);

      await controller.promedioNacional('2019', 'ANTIOQUIA');

      expect(mockIcfesService.promedioNacional).toHaveBeenCalledWith(2019, 'ANTIOQUIA');
    });
  });

  describe('totalRegistros', () => {
    it('debería retornar el total de registros', async () => {
      const mockResponse = [{ total: 3000000 }];

      mockCacheService.remember.mockResolvedValue(mockResponse);

      const result = await controller.totalRegistros();

      expect(result).toEqual(mockResponse);
      expect(mockCacheService.remember).toHaveBeenCalledWith('total_registros', {}, expect.any(Function));
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
    // ✅ FIX PRINCIPAL: pasar dto vacío en lugar de llamar sin argumentos
    it('debería retornar la comparación entre colegios sin filtros', async () => {
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

      // dto vacío — la desestructuración de naturaleza funciona correctamente
      const result = await controller.comparacionColegios({});

      expect(result).toEqual(mockResponse);
      expect(mockCacheService.remember).toHaveBeenCalledWith('comparacion_colegios', {}, expect.any(Function));
    });

    it('debería ignorar el filtro naturaleza al pasar al cache y al service', async () => {
      const dto = { departamento: 'VALLE', naturaleza: 'OFICIAL' as const };
      const mockResponse = [{ tipo_colegio: 'OFICIAL', data: [] }];
      mockCacheService.remember.mockResolvedValue(mockResponse);

      const result = await controller.comparacionColegios(dto);

      expect(result).toEqual(mockResponse);
      // naturaleza NO debe aparecer en la clave de cache
      expect(mockCacheService.remember).toHaveBeenCalledWith('comparacion_colegios', { departamento: 'VALLE' }, expect.any(Function));
    });

    it('debería ejecutar la función del servicio al no haber cache', async () => {
      const mockResponse = [{ tipo_colegio: 'OFICIAL', data: [] }];
      mockCacheService.remember.mockImplementation(async (_k, _p, fn) => fn());
      mockIcfesService.comparacionColegios.mockResolvedValue(mockResponse);

      const result = await controller.comparacionColegios({});

      expect(result).toEqual(mockResponse);
      expect(mockIcfesService.comparacionColegios).toHaveBeenCalledWith({});
    });
  });

  describe('promedioDepartamento', () => {
    it('debería usar cacheService y llamar al service correctamente', async () => {
      const dto = { departamento: 'ANTIOQUIA' };

      const mockResponse = [{ departamento: 'ANTIOQUIA', promedio: 265.4, total_estudiantes: 100, ranking: 1 }];

      mockCacheService.remember.mockImplementation(async (_key, _dto, callback) => {
        return callback();
      });

      mockIcfesService.promedioDepartamentos.mockResolvedValue(mockResponse);

      const result = await controller.promedioDepartamento(dto);

      expect(result).toEqual(mockResponse);
      expect(mockCacheService.remember).toHaveBeenCalledWith('promedio_departamento', dto, expect.any(Function));
      expect(mockIcfesService.promedioDepartamentos).toHaveBeenCalledWith(dto.departamento);
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
      expect(mockCacheService.remember).toHaveBeenCalledWith('promedio_zona', {}, expect.any(Function));
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
      expect(mockCacheService.remember).toHaveBeenCalledWith('top_departamentos', { limit: 5 }, expect.any(Function));
    });

    it('debería usar el limit recibido por query', async () => {
      const mockResponse = [{ departamento: 'BOGOTÁ', promedio: 285.3, total_estudiantes: 10000 }];

      mockCacheService.remember.mockResolvedValue(mockResponse);

      const result = await controller.topDepartamentos({ limit: 1 });

      expect(result).toEqual(mockResponse);
      expect(mockCacheService.remember).toHaveBeenCalledWith('top_departamentos', { limit: 1 }, expect.any(Function));
    });

    it('debería usar limit 5 si el valor recibido no es válido', async () => {
      mockCacheService.remember.mockResolvedValue([]);

      await controller.topDepartamentos({ limit: NaN });

      expect(mockCacheService.remember).toHaveBeenCalledWith('top_departamentos', { limit: 5 }, expect.any(Function));
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

  describe('promedioDepartamentoAgrupado', () => {
    it('debería retornar el promedio anual de un departamento', async () => {
      const dto = { departamento: 'ANTIOQUIA' };
      const mockResponse = [
        { year: 2018, promedio: 265.4 },
        { year: 2019, promedio: 270.1 },
      ];

      mockCacheService.remember.mockResolvedValue(mockResponse);

      const result = await controller.promedioDepartamentoAgrupado(dto);

      expect(result).toEqual(mockResponse);
      expect(mockCacheService.remember).toHaveBeenCalledWith('promedio_anual_departamento', { dto }, expect.any(Function));
    });

    it('debería ejecutar la función del servicio al no haber cache', async () => {
      const dto = { departamento: 'ANTIOQUIA' };
      const mockResponse = [{ year: 2018, promedio: 265.4 }];

      mockCacheService.remember.mockImplementation(async (_tipo, _params, fn) => fn());
      mockIcfesService.getPromedioHistoricoPorDepartamento.mockResolvedValue(mockResponse);

      const result = await controller.promedioDepartamentoAgrupado(dto);

      expect(result).toEqual(mockResponse);
      expect(mockIcfesService.getPromedioHistoricoPorDepartamento).toHaveBeenCalledWith('ANTIOQUIA');
    });
  });

  describe('topMunicipiosDepartamento', () => {
    it('debería retornar el top de municipios por departamento', async () => {
      const dto = { departamento: 'ANTIOQUIA', limit: 5 };
      const mockResponse = [{ municipio: 'MEDELLIN', promedio: 280 }];

      mockCacheService.remember.mockResolvedValue(mockResponse);

      const result = await controller.topMunicipiosDepartamento(dto);

      expect(result).toEqual(mockResponse);
      expect(mockCacheService.remember).toHaveBeenCalledWith('top_municipios_departamento', { dto }, expect.any(Function));
    });

    it('debería ejecutar el servicio si no hay cache', async () => {
      const dto = { departamento: 'ANTIOQUIA', limit: 5 };
      const mockResponse = [{ municipio: 'MEDELLIN', promedio: 280 }];

      mockCacheService.remember.mockImplementation(async (_k, _p, fn) => fn());
      mockIcfesService.getTopMunicipiosPorDepartamento.mockResolvedValue(mockResponse);

      const result = await controller.topMunicipiosDepartamento(dto);

      expect(result).toEqual(mockResponse);
      expect(mockIcfesService.getTopMunicipiosPorDepartamento).toHaveBeenCalledWith(dto.departamento, dto.limit);
    });
  });

  describe('bottomMunicipiosDepartamento', () => {
    it('debería retornar el bottom de municipios por departamento', async () => {
      const dto = { departamento: 'ANTIOQUIA', limit: 5 };
      const mockResponse = [{ municipio: 'MUNICIPIO_X', promedio: 210 }];

      mockCacheService.remember.mockResolvedValue(mockResponse);

      const result = await controller.bottomMunicipiosDepartamento(dto);

      expect(result).toEqual(mockResponse);
      expect(mockCacheService.remember).toHaveBeenCalledWith('bottom_municipios_departamento', { dto }, expect.any(Function));
    });

    it('debería ejecutar el servicio si no hay cache', async () => {
      const dto = { departamento: 'ANTIOQUIA', limit: 5 };
      const mockResponse = [{ municipio: 'MUNICIPIO_X', promedio: 210 }];

      mockCacheService.remember.mockImplementation(async (_k, _p, fn) => fn());
      mockIcfesService.getBottomMunicipiosDepartamento.mockResolvedValue(mockResponse);

      const result = await controller.bottomMunicipiosDepartamento(dto);

      expect(result).toEqual(mockResponse);
      expect(mockIcfesService.getBottomMunicipiosDepartamento).toHaveBeenCalledWith(dto.departamento, dto.limit);
    });
  });

  describe('metricasMunicipiosDepartamento', () => {
    it('debería retornar las métricas de municipios por departamento', async () => {
      const dto = { departamento: 'ANTIOQUIA' };
      const mockResponse = [{ municipio: 'MEDELLIN', promedio: 280, totalEstudiantes: 1500, desviacionEstandar: 12.5 }];
      mockCacheService.remember.mockResolvedValue(mockResponse);

      const result = await controller.metricasMunicipiosDepartamento(dto);

      expect(result).toEqual(mockResponse);
      expect(mockCacheService.remember).toHaveBeenCalledWith('metricas_municipios_departamento', { dto }, expect.any(Function));
    });

    it('debería ejecutar el servicio si no hay cache', async () => {
      const dto = { departamento: 'ANTIOQUIA' };
      const mockResponse = [{ municipio: 'MEDELLIN', promedio: 280, totalEstudiantes: 1500, desviacionEstandar: 12.5 }];
      mockCacheService.remember.mockImplementation(async (_k, _p, fn) => fn());
      mockIcfesService.getMetricasMunicipiosPorDepartamento.mockResolvedValue(mockResponse);

      const result = await controller.metricasMunicipiosDepartamento(dto);

      expect(result).toEqual(mockResponse);
      expect(mockIcfesService.getMetricasMunicipiosPorDepartamento).toHaveBeenCalledWith(dto.departamento);
    });
  });

  describe('distribucionSocioeconomica', () => {
    it('debería retornar la distribución socioeconómica de un departamento', async () => {
      const dto = { departamento: 'ANTIOQUIA' };
      const mockResponse = [
        { estrato: 1, total: 500, porcentaje: 33.33 },
        { estrato: 2, total: 700, porcentaje: 46.67 },
      ];
      mockCacheService.remember.mockResolvedValue(mockResponse);

      const result = await controller.distribucionSocioeconomica(dto);

      expect(result).toEqual(mockResponse);
      expect(mockCacheService.remember).toHaveBeenCalledWith('distribucion_socioeconomica_departamento', { dto }, expect.any(Function));
    });

    it('debería ejecutar el servicio si no hay cache', async () => {
      const dto = { departamento: 'ANTIOQUIA' };
      const mockResponse = [
        { estrato: 1, total: 500, porcentaje: 33.33 },
        { estrato: 2, total: 700, porcentaje: 46.67 },
      ];
      mockCacheService.remember.mockImplementation(async (_k, _p, fn) => fn());
      mockIcfesService.getDistribucionEstratoDepartamento.mockResolvedValue(mockResponse);

      const result = await controller.distribucionSocioeconomica(dto);

      expect(result).toEqual(mockResponse);
      expect(mockIcfesService.getDistribucionEstratoDepartamento).toHaveBeenCalledWith(dto.departamento);
    });
  });

  describe('comparacionAccesoTecnologico', () => {
    it('debería retornar la comparación de acceso tecnológico', async () => {
      const dto = { departamentoA: 'ANTIOQUIA', departamentoB: 'CUNDINAMARCA' };
      const mockResponse = [
        { key: 'Internet', values: [75.5, 68.2] },
        { key: 'Computador', values: [60.1, 55.4] },
      ];
      mockCacheService.remember.mockResolvedValue(mockResponse);

      const result = await controller.comparacionAccesoTecnologico(dto);

      expect(result).toEqual(mockResponse);
      expect(mockCacheService.remember).toHaveBeenCalledWith('comparacion_acceso_tecnologico', { dto }, expect.any(Function));
    });

    it('debería ejecutar el servicio si no hay cache', async () => {
      const dto = { departamentoA: 'ANTIOQUIA', departamentoB: 'CUNDINAMARCA' };
      const mockResponse = [
        { key: 'Internet', values: [75.5, 68.2] },
        { key: 'Computador', values: [60.1, 55.4] },
      ];
      mockCacheService.remember.mockImplementation(async (_k, _p, fn) => fn());
      mockIcfesService.getComparacionAccesoTecnologico.mockResolvedValue(mockResponse);

      const result = await controller.comparacionAccesoTecnologico(dto);

      expect(result).toEqual(mockResponse);
      expect(mockIcfesService.getComparacionAccesoTecnologico).toHaveBeenCalledWith(dto.departamentoA, dto.departamentoB);
    });
  });

  describe('desempenoPorEstrato', () => {
    it('debería retornar el desempeño por estrato sin filtros', async () => {
      const mockResponse = [{ estrato: '1', promedio: 240, total_estudiantes: 1000 }];
      mockCacheService.remember.mockResolvedValue(mockResponse);

      const result = await controller.desempenoPorEstrato();

      expect(result).toEqual(mockResponse);
      expect(mockCacheService.remember).toHaveBeenCalledWith('desempeno_por_estrato', { anio: undefined, departamento: undefined }, expect.any(Function));
    });

    it('debería ejecutar el servicio al no haber cache', async () => {
      mockCacheService.remember.mockImplementation(async (_k, _p, fn) => fn());
      mockIcfesService.desempenoPorEstrato.mockResolvedValue([]);

      await controller.desempenoPorEstrato('2020', 'VALLE');

      expect(mockIcfesService.desempenoPorEstrato).toHaveBeenCalledWith(2020, 'VALLE');
    });
  });

  describe('distribucionEdad', () => {
    it('debería retornar la distribución de edades sin filtros', async () => {
      const mockResponse = [{ edad: 16, total: 500 }];
      mockCacheService.remember.mockResolvedValue(mockResponse);

      const result = await controller.distribucionEdad();

      expect(result).toEqual(mockResponse);
      expect(mockCacheService.remember).toHaveBeenCalledWith('distribucion_edad', { anio: undefined, departamento: undefined }, expect.any(Function));
    });

    it('debería ejecutar el servicio al no haber cache', async () => {
      mockCacheService.remember.mockImplementation(async (_k, _p, fn) => fn());
      mockIcfesService.distribucionPorEdad.mockResolvedValue([]);

      await controller.distribucionEdad('2018', 'ANTIOQUIA');

      expect(mockIcfesService.distribucionPorEdad).toHaveBeenCalledWith(2018, 'ANTIOQUIA');
    });
  });

  describe('impactoEquipamientoHogar', () => {
    it('debería retornar el impacto de equipamiento sin filtros', async () => {
      const mockResponse = { carro: { promedio: 270, total: 100 }, lavadora: { promedio: 260, total: 200 }, internet: { promedio: 275, total: 300 }, computador: { promedio: 268, total: 250 } };
      mockCacheService.remember.mockResolvedValue(mockResponse);

      const result = await controller.impactoEquipamientoHogar();

      expect(result).toEqual(mockResponse);
      expect(mockCacheService.remember).toHaveBeenCalledWith('impacto_equipamiento_hogar', { anio: undefined, departamento: undefined }, expect.any(Function));
    });

    it('debería ejecutar el servicio al no haber cache', async () => {
      mockCacheService.remember.mockImplementation(async (_k, _p, fn) => fn());
      mockIcfesService.impactoEquipamientoHogar.mockResolvedValue({});

      await controller.impactoEquipamientoHogar('2021', 'CUNDINAMARCA');

      expect(mockIcfesService.impactoEquipamientoHogar).toHaveBeenCalledWith(2021, 'CUNDINAMARCA');
    });
  });

  describe('desempenoPorEducacionPadres', () => {
    it('debería retornar el desempeño por educación de padres sin filtros', async () => {
      const mockResponse = { madre: [], padre: [] };
      mockCacheService.remember.mockResolvedValue(mockResponse);

      const result = await controller.desempenoPorEducacionPadres();

      expect(result).toEqual(mockResponse);
      expect(mockCacheService.remember).toHaveBeenCalledWith('desempeno_educacion_padres', { anio: undefined, departamento: undefined }, expect.any(Function));
    });

    it('debería ejecutar el servicio al no haber cache', async () => {
      mockCacheService.remember.mockImplementation(async (_k, _p, fn) => fn());
      mockIcfesService.desempenoPorEducacionPadres.mockResolvedValue({ madre: [], padre: [] });

      await controller.desempenoPorEducacionPadres('2022', 'BOLIVAR');

      expect(mockIcfesService.desempenoPorEducacionPadres).toHaveBeenCalledWith(2022, 'BOLIVAR');
    });
  });

  // ─── participacionPorAno ──────────────────────────────────────────────────

  describe('participacionPorAno', () => {
    it('debería retornar la participación por año sin segmentación', async () => {
      const mockResponse = [
        { ano: 2018, total_estudiantes: 500000 },
        { ano: 2019, total_estudiantes: 520000 },
      ];
      mockCacheService.remember.mockResolvedValue(mockResponse);

      const result = await controller.participacionPorAno({});

      expect(result).toEqual(mockResponse);
      expect(mockCacheService.remember).toHaveBeenCalledWith('participacion_por_ano', {}, expect.any(Function));
    });

    it('debería separar segmentar del dto al llamar al service', async () => {
      const dto = { segmentar: 'genero' as const, departamento: 'VALLE' };
      const mockResponse = [
        { ano: 2018, total_estudiantes: 250000, segmento: 'M' },
        { ano: 2018, total_estudiantes: 260000, segmento: 'F' },
      ];
      mockCacheService.remember.mockImplementation(async (_k, _p, fn) => fn());
      mockIcfesService.participacionPorAno.mockResolvedValue(mockResponse);

      const result = await controller.participacionPorAno(dto);

      expect(result).toEqual(mockResponse);
      // segmentar se extrae del dto antes de pasar al service
      expect(mockIcfesService.participacionPorAno).toHaveBeenCalledWith({ departamento: 'VALLE' }, 'genero');
    });

    it('debería funcionar con segmentación por zona', async () => {
      const dto = { segmentar: 'zona' as const };
      const mockResponse = [
        { ano: 2018, total_estudiantes: 400000, segmento: 'URBANO' },
        { ano: 2018, total_estudiantes: 100000, segmento: 'RURAL' },
      ];
      mockCacheService.remember.mockImplementation(async (_k, _p, fn) => fn());
      mockIcfesService.participacionPorAno.mockResolvedValue(mockResponse);

      const result = await controller.participacionPorAno(dto);

      expect(result).toEqual(mockResponse);
      expect(mockIcfesService.participacionPorAno).toHaveBeenCalledWith({}, 'zona');
    });
  });

  // ─── distribucionPuntajeDepartamento ─────────────────────────────────────

  describe('distribucionPuntajeDepartamento', () => {
    it('debería retornar la distribución de puntajes del departamento', async () => {
      const dto = { departamento: 'ANTIOQUIA' };
      const mockResponse = [
        { categoria: 'BAJO', total: 200 },
        { categoria: 'MEDIO', total: 500 },
      ];
      mockCacheService.remember.mockResolvedValue(mockResponse);

      const result = await controller.distribucionPuntajeDepartamento(dto);

      expect(result).toEqual(mockResponse);
      expect(mockCacheService.remember).toHaveBeenCalledWith('distribucion_puntaje_departamento', { dto }, expect.any(Function));
    });

    it('debería ejecutar el servicio al no haber cache', async () => {
      const dto = { departamento: 'ANTIOQUIA' };
      const mockResponse = [{ categoria: 'BAJO', total: 200 }];
      mockCacheService.remember.mockImplementation(async (_k, _p, fn) => fn());
      mockIcfesService.distribucionPuntajeGlobalPorDepartamento.mockResolvedValue(mockResponse);

      const result = await controller.distribucionPuntajeDepartamento(dto);

      expect(result).toEqual(mockResponse);
      expect(mockIcfesService.distribucionPuntajeGlobalPorDepartamento).toHaveBeenCalledWith('ANTIOQUIA');
    });
  });
});
