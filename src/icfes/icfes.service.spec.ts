import { Test, TestingModule } from '@nestjs/testing';
import { IcfesService } from './icfes.service';
import { getModelToken } from '@nestjs/mongoose';
import { Resultado } from './schema/icfes.schema';
import { InternalServerErrorException } from '@nestjs/common';

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

  describe('comparacionColegios', () => {
    it('retorna la comparación de colegios correctamente', async () => {
      const data: ComparacionColegiosItem[] = [
        { tipo_colegio: 'NO OFICIAL', promedio: 270, total: 5 },
        { tipo_colegio: 'OFICIAL', promedio: 250, total: 10 },
      ];
      mockResultadoModel.aggregate.mockReturnValue(Promise.resolve(data));

      const result = (await service.comparacionColegios()) as ComparacionColegiosItem[];

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
      const data = [
        { departamento: 'VALLE', promedio: 260, total_estudiantes: 100 },
      ];
      mockResultadoModel.aggregate.mockReturnValue(Promise.resolve(data));

      const result = await service.promedioDepartamentos();

      expect(result).toEqual(data);
    });

    it('retorna arreglo vacío', async () => {
      mockResultadoModel.aggregate.mockReturnValue(Promise.resolve([]));

      const result = await service.promedioDepartamentos();

      expect(result).toEqual([]);
    });

    it('propaga error de BD', async () => {
      const dbError = new Error('DB fail');
      mockResultadoModel.aggregate.mockReturnValue(Promise.reject(dbError));

      await expect(service.promedioDepartamentos()).rejects.toThrow('DB fail');
    });
  });
  describe('promedioZonal', () => {
    it('retorna los datos correctamente', async () => {
      const data = [
        { zona: 'URBANO', promedio: 270, total_estudiantes: 80 },
      ];
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
      const data = [
        { municipio: 'TULUA', promedio: 280, total_estudiantes: 50 },
      ];
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
      const data = [
        { edad: 17, promedio: 250, total_estudiantes: 30 },
      ];
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
});
