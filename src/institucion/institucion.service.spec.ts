import { Test, TestingModule } from '@nestjs/testing';
import { InstitucionService } from './institucion.service';
import { getModelToken } from '@nestjs/mongoose';
import { Institucion } from './institucion.schema';

// ── Tipos espejo del service ──────────────────────────────────────────────────
interface SectorLiderItem {
  sector: string;
}

interface RankingItem {
  rango: number;
  nombre_institucion: string;
  departamento: string;
  municipio: string;
  sector: string;
  promedio_global: number;
  codigo_dane: number;
}

interface RankingResponse {
  data: RankingItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    departamento?: string;
    municipio?: string | null;
    naturaleza?: string | null;
  };
}

interface InstitucionDetalleItem {
  rango_nacional: number;
  promedio_global: number;
  promedio_lectura: number;
  promedio_matematicas: number;
  promedio_naturales: number;
  promedio_sociales: number;
  promedio_ingles: number;
}

interface PromedioSectorItem {
  sector: string;
  promedio_sector: number;
  total_instituciones: number;
}
// ─────────────────────────────────────────────────────────────────────────────

describe('InstitucionService', () => {
  let service: InstitucionService;

  const mockInstitucionModel = {
    aggregate: jest.fn(),
    countDocuments: jest.fn(),
    distinct: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InstitucionService,
        {
          provide: getModelToken(Institucion.name),
          useValue: mockInstitucionModel,
        },
      ],
    }).compile();

    service = module.get(InstitucionService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── contarInstituciones ──────────────────────────────────────────────────
  describe('contarInstituciones', () => {
    it('retorna el total de instituciones', async () => {
      mockInstitucionModel.countDocuments.mockResolvedValue(42);

      const result = await service.contarInstituciones();

      expect(result).toBe(42);
      expect(mockInstitucionModel.countDocuments).toHaveBeenCalledTimes(1);
    });

    it('retorna 0 cuando no hay instituciones', async () => {
      mockInstitucionModel.countDocuments.mockResolvedValue(0);

      const result = await service.contarInstituciones();

      expect(result).toBe(0);
    });

    it('propaga el error de BD', async () => {
      mockInstitucionModel.countDocuments.mockRejectedValue(new Error('DB fail'));

      await expect(service.contarInstituciones()).rejects.toThrow('DB fail');
    });
  });

  // ─── sectorLiderPerformance ───────────────────────────────────────────────
  describe('sectorLiderPerformance', () => {
    it('retorna el sector con mejor rendimiento', async () => {
      const data: SectorLiderItem[] = [{ sector: 'NO OFICIAL' }];
      mockInstitucionModel.aggregate.mockResolvedValue(data);

      const result = (await service.sectorLiderPerformance()) as SectorLiderItem;

      expect(result).toEqual({ sector: 'NO OFICIAL' });
      expect(mockInstitucionModel.aggregate).toHaveBeenCalledTimes(1);
    });

    it('retorna undefined cuando el aggregate devuelve arreglo vacío', async () => {
      mockInstitucionModel.aggregate.mockResolvedValue([]);

      const result = await service.sectorLiderPerformance();

      expect(result).toBeUndefined();
    });

    it('propaga el error de BD', async () => {
      mockInstitucionModel.aggregate.mockRejectedValue(new Error('DB fail'));

      await expect(service.sectorLiderPerformance()).rejects.toThrow('DB fail');
    });
  });

  // ─── rankingDepartamentos ─────────────────────────────────────────────────
  describe('rankingDepartamentos', () => {
    const mockResultados: Omit<RankingItem, 'rango'>[] = [
      { nombre_institucion: 'Colegio A', departamento: 'ANTIOQUIA', municipio: 'MEDELLIN', sector: 'NO OFICIAL', promedio_global: 290.5, codigo_dane: 123456 },
      { nombre_institucion: 'Colegio B', departamento: 'BOGOTA', municipio: 'BOGOTA', sector: 'OFICIAL', promedio_global: 280.3, codigo_dane: 789012 },
    ];

    it('retorna paginación correcta con valores por defecto (page=1, limit=5)', async () => {
      mockInstitucionModel.aggregate.mockResolvedValue(mockResultados);
      mockInstitucionModel.countDocuments.mockResolvedValue(10);

      const result = (await service.rankingDepartamentos()) as RankingResponse;

      expect(result.data).toHaveLength(2);
      expect(result.data[0].rango).toBe(1);
      expect(result.data[1].rango).toBe(2);
      expect(result.meta).toEqual({ total: 10, page: 1, limit: 5, totalPages: 2 });
      expect(mockInstitucionModel.aggregate).toHaveBeenCalledTimes(1);
      expect(mockInstitucionModel.countDocuments).toHaveBeenCalledTimes(1);
    });

    it('calcula el rango correctamente al paginar (page=2, limit=5)', async () => {
      mockInstitucionModel.aggregate.mockResolvedValue(mockResultados);
      mockInstitucionModel.countDocuments.mockResolvedValue(10);

      const result = (await service.rankingDepartamentos(2, 5)) as RankingResponse;

      expect(result.data[0].rango).toBe(6);
      expect(result.data[1].rango).toBe(7);
      expect(result.meta.page).toBe(2);
    });

    it('retorna data vacía cuando aggregate devuelve arreglo vacío', async () => {
      mockInstitucionModel.aggregate.mockResolvedValue([]);
      mockInstitucionModel.countDocuments.mockResolvedValue(0);

      const result = (await service.rankingDepartamentos()) as RankingResponse;

      expect(result.data).toHaveLength(0);
      expect(result.meta.total).toBe(0);
      expect(result.meta.totalPages).toBe(0);
    });

    it('propaga el error de BD', async () => {
      mockInstitucionModel.aggregate.mockRejectedValue(new Error('DB fail'));
      mockInstitucionModel.countDocuments.mockResolvedValue(0);

      await expect(service.rankingDepartamentos()).rejects.toThrow('DB fail');
    });
  });

  // ─── rankingDepartamento ──────────────────────────────────────────────────
  describe('rankingDepartamento', () => {
    const mockResultados: RankingItem[] = [
      { rango: 3, nombre_institucion: 'Colegio C', departamento: 'ANTIOQUIA', municipio: 'MEDELLIN', sector: 'OFICIAL', promedio_global: 275.0, codigo_dane: 111111 },
    ];

    it('retorna instituciones filtradas por departamento', async () => {
      mockInstitucionModel.aggregate.mockResolvedValue(mockResultados);
      mockInstitucionModel.countDocuments.mockResolvedValue(1);

      const result = (await service.rankingDepartamento('antioquia')) as RankingResponse;

      expect(result.data).toEqual(mockResultados);
      expect(result.meta.departamento).toBe('ANTIOQUIA');
      expect(result.meta.municipio).toBeNull();
      expect(result.meta.naturaleza).toBeNull();
    });

    it('normaliza el departamento a mayúsculas', async () => {
      mockInstitucionModel.aggregate.mockResolvedValue(mockResultados);
      mockInstitucionModel.countDocuments.mockResolvedValue(1);

      const result = (await service.rankingDepartamento('antioquia')) as RankingResponse;

      expect(result.meta.departamento).toBe('ANTIOQUIA');
    });

    it('incluye municipio en meta cuando se pasa como filtro', async () => {
      mockInstitucionModel.aggregate.mockResolvedValue(mockResultados);
      mockInstitucionModel.countDocuments.mockResolvedValue(1);

      const result = (await service.rankingDepartamento('antioquia', 'medellin')) as RankingResponse;

      expect(result.meta.municipio).toBe('MEDELLIN');
    });

    it('incluye naturaleza en meta cuando se pasa como filtro', async () => {
      mockInstitucionModel.aggregate.mockResolvedValue(mockResultados);
      mockInstitucionModel.countDocuments.mockResolvedValue(1);

      const result = (await service.rankingDepartamento('antioquia', undefined, 'oficial')) as RankingResponse;

      expect(result.meta.naturaleza).toBe('OFICIAL');
    });

    it('retorna totalPages correcto con múltiples páginas', async () => {
      mockInstitucionModel.aggregate.mockResolvedValue(mockResultados);
      mockInstitucionModel.countDocuments.mockResolvedValue(13);

      const result = (await service.rankingDepartamento('antioquia', undefined, undefined, 1, 5)) as RankingResponse;

      expect(result.meta.totalPages).toBe(3);
    });

    it('propaga el error de BD', async () => {
      mockInstitucionModel.aggregate.mockRejectedValue(new Error('DB fail'));
      mockInstitucionModel.countDocuments.mockResolvedValue(0);

      await expect(service.rankingDepartamento('ANTIOQUIA')).rejects.toThrow('DB fail');
    });
  });

  // ─── obtenerMunicipios ────────────────────────────────────────────────────
  describe('obtenerMunicipios', () => {
    it('retorna los municipios del departamento ordenados alfabéticamente', async () => {
      mockInstitucionModel.distinct.mockResolvedValue(['MEDELLIN', 'BELLO', 'ENVIGADO']);

      const result = await service.obtenerMunicipios('ANTIOQUIA');

      expect(result).toEqual(['BELLO', 'ENVIGADO', 'MEDELLIN']);
      expect(mockInstitucionModel.distinct).toHaveBeenCalledWith('COLE_MCPIO_UBICACION', {
        COLE_DEPTO_UBICACION: 'ANTIOQUIA',
      });
    });

    it('normaliza el departamento a mayúsculas al consultar', async () => {
      mockInstitucionModel.distinct.mockResolvedValue(['BOGOTA']);

      await service.obtenerMunicipios('bogota');

      expect(mockInstitucionModel.distinct).toHaveBeenCalledWith('COLE_MCPIO_UBICACION', {
        COLE_DEPTO_UBICACION: 'BOGOTA',
      });
    });

    it('retorna arreglo vacío cuando no hay municipios', async () => {
      mockInstitucionModel.distinct.mockResolvedValue([]);

      const result = await service.obtenerMunicipios('AMAZONAS');

      expect(result).toEqual([]);
    });

    it('propaga el error de BD', async () => {
      mockInstitucionModel.distinct.mockRejectedValue(new Error('DB fail'));

      await expect(service.obtenerMunicipios('ANTIOQUIA')).rejects.toThrow('DB fail');
    });
  });

  // ─── obtenerInstitucion ───────────────────────────────────────────────────
  describe('obtenerInstitucion', () => {
    const mockInstitucion: InstitucionDetalleItem = {
      rango_nacional: 5,
      promedio_global: 295.12,
      promedio_lectura: 72.3,
      promedio_matematicas: 68.9,
      promedio_naturales: 70.1,
      promedio_sociales: 71.5,
      promedio_ingles: 60.4,
    };

    it('retorna la institución con su rango nacional y promedios redondeados', async () => {
      mockInstitucionModel.aggregate.mockResolvedValue([mockInstitucion]);

      const result = (await service.obtenerInstitucion('123456')) as InstitucionDetalleItem;

      expect(result).toEqual(mockInstitucion);
      expect(mockInstitucionModel.aggregate).toHaveBeenCalledTimes(1);
    });

    it('convierte el codigoDane a número al hacer el match', async () => {
      mockInstitucionModel.aggregate.mockResolvedValue([mockInstitucion]);

      await service.obtenerInstitucion('123456');

      const pipeline = mockInstitucionModel.aggregate.mock.calls[0][0];
      const matchStage = pipeline.find((stage: any) => stage.$match);
      expect(matchStage.$match.COLE_COD_DANE_ESTABLECIMIENTO).toBe(123456);
      expect(typeof matchStage.$match.COLE_COD_DANE_ESTABLECIMIENTO).toBe('number');
    });

    it('retorna undefined cuando no existe la institución', async () => {
      mockInstitucionModel.aggregate.mockResolvedValue([]);

      const result = await service.obtenerInstitucion('999999');

      expect(result).toBeUndefined();
    });

    it('propaga el error de BD', async () => {
      mockInstitucionModel.aggregate.mockRejectedValue(new Error('DB fail'));

      await expect(service.obtenerInstitucion('123456')).rejects.toThrow('DB fail');
    });
  });

  // ─── promedioSector ───────────────────────────────────────────────────────
  describe('promedioSector', () => {
    it('retorna el promedio del sector OFICIAL', async () => {
      const data: PromedioSectorItem[] = [{ sector: 'OFICIAL', promedio_sector: 248.5, total_instituciones: 120 }];
      mockInstitucionModel.aggregate.mockResolvedValue(data);

      const result = (await service.promedioSector('OFICIAL')) as PromedioSectorItem;

      expect(result).toEqual({ sector: 'OFICIAL', promedio_sector: 248.5, total_instituciones: 120 });
      expect(mockInstitucionModel.aggregate).toHaveBeenCalledTimes(1);
    });

    it('normaliza la naturaleza a mayúsculas al hacer el match', async () => {
      const data: PromedioSectorItem[] = [{ sector: 'NO OFICIAL', promedio_sector: 285.2, total_instituciones: 80 }];
      mockInstitucionModel.aggregate.mockResolvedValue(data);

      await service.promedioSector('no oficial');

      const pipeline = mockInstitucionModel.aggregate.mock.calls[0][0];
      const matchStage = pipeline.find((stage: any) => stage.$match);
      expect(matchStage.$match.COLE_NATURALEZA).toBe('NO OFICIAL');
    });

    it('retorna valores por defecto cuando aggregate devuelve arreglo vacío', async () => {
      mockInstitucionModel.aggregate.mockResolvedValue([]);

      const result = (await service.promedioSector('PRIVADO')) as PromedioSectorItem;

      expect(result).toEqual({
        sector: 'PRIVADO',
        promedio_sector: 0,
        total_instituciones: 0,
      });
    });

    it('propaga el error de BD', async () => {
      mockInstitucionModel.aggregate.mockRejectedValue(new Error('DB fail'));

      await expect(service.promedioSector('OFICIAL')).rejects.toThrow('DB fail');
    });
  });
});
