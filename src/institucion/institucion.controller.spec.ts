import { Test, TestingModule } from '@nestjs/testing';
import { InstitucionController } from './institucion.controller';
import { InstitucionService } from './institucion.service';

describe('InstitucionController', () => {
  let controller: InstitucionController;

  const mockInstitucionService = {
    contarInstituciones: jest.fn(),
    sectorLiderPerformance: jest.fn(),
    rankingDepartamentos: jest.fn(),
    rankingDepartamento: jest.fn(),
    obtenerMunicipios: jest.fn(),
    obtenerInstitucion: jest.fn(),
    promedioSector: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [InstitucionController],
      providers: [
        {
          provide: InstitucionService,
          useValue: mockInstitucionService,
        },
      ],
    }).compile();

    controller = module.get<InstitucionController>(InstitucionController);
  });

  it('Debería existir institucion controller', () => {
    expect(controller).toBeDefined();
  });

  describe('totalInstituciones', () => {
    it('debería llamar al servicio contarInstituciones y retornar el resultado', async () => {
      const mockResponse = { total: 42 };
      mockInstitucionService.contarInstituciones.mockResolvedValue(mockResponse);

      const result = await controller.totalInstituciones();

      expect(result).toEqual(mockResponse);
      expect(mockInstitucionService.contarInstituciones).toHaveBeenCalledTimes(1);
    });
  });

  describe('mejorRendimiento', () => {
    it('debería llamar al servicio sectorLiderPerformance y retornar el resultado', async () => {
      const mockResponse = { sector: 'NO OFICIAL', promedio: 285.5 };
      mockInstitucionService.sectorLiderPerformance.mockResolvedValue(mockResponse);

      const result = await controller.mejorRendimiento();

      expect(result).toEqual(mockResponse);
      expect(mockInstitucionService.sectorLiderPerformance).toHaveBeenCalledTimes(1);
    });
  });

  describe('rankingDepartamentos', () => {
    it('debería llamar al servicio rankingDepartamentos con los valores por defecto', async () => {
      const mockResponse = [{ nombre: 'Colegio A', promedio: 290 }];
      mockInstitucionService.rankingDepartamentos.mockResolvedValue(mockResponse);

      const result = await controller.rankingDepartamentos(1, 5);

      expect(result).toEqual(mockResponse);
      expect(mockInstitucionService.rankingDepartamentos).toHaveBeenCalledWith(1, 5);
    });

    it('debería llamar al servicio rankingDepartamentos con página y límite personalizados', async () => {
      const mockResponse = [{ nombre: 'Colegio B', promedio: 275 }];
      mockInstitucionService.rankingDepartamentos.mockResolvedValue(mockResponse);

      const result = await controller.rankingDepartamentos(2, 10);

      expect(result).toEqual(mockResponse);
      expect(mockInstitucionService.rankingDepartamentos).toHaveBeenCalledWith(2, 10);
    });
  });

  describe('rankingDepartamento', () => {
    it('debería llamar al servicio rankingDepartamento con todos los parámetros', async () => {
      const mockResponse = [{ nombre: 'Colegio C', promedio: 260 }];
      mockInstitucionService.rankingDepartamento.mockResolvedValue(mockResponse);

      const result = await controller.rankingDepartamento('ANTIOQUIA', 'MEDELLIN', 'OFICIAL', 1, 5);

      expect(result).toEqual(mockResponse);
      expect(mockInstitucionService.rankingDepartamento).toHaveBeenCalledWith('ANTIOQUIA', 'MEDELLIN', 'OFICIAL', 1, 5);
    });

    it('debería llamar al servicio rankingDepartamento sin filtros opcionales', async () => {
      const mockResponse = [{ nombre: 'Colegio D', promedio: 255 }];
      mockInstitucionService.rankingDepartamento.mockResolvedValue(mockResponse);

      const result = await controller.rankingDepartamento('CUNDINAMARCA', undefined, undefined, 1, 5);

      expect(result).toEqual(mockResponse);
      expect(mockInstitucionService.rankingDepartamento).toHaveBeenCalledWith('CUNDINAMARCA', undefined, undefined, 1, 5);
    });
  });

  describe('obtenerMunicipios', () => {
    it('debería llamar al servicio obtenerMunicipios con el departamento dado', async () => {
      const mockResponse = ['MEDELLIN', 'BELLO', 'ENVIGADO'];
      mockInstitucionService.obtenerMunicipios.mockResolvedValue(mockResponse);

      const result = await controller.obtenerMunicipios('ANTIOQUIA');

      expect(result).toEqual(mockResponse);
      expect(mockInstitucionService.obtenerMunicipios).toHaveBeenCalledWith('ANTIOQUIA');
    });
  });

  describe('obtenerInstitucion', () => {
    it('debería llamar al servicio obtenerInstitucion con el código DANE dado', async () => {
      const mockResponse = { nombre: 'Colegio E', municipio: 'BOGOTA', promedio: 300 };
      mockInstitucionService.obtenerInstitucion.mockResolvedValue(mockResponse);

      const result = await controller.obtenerInstitucion('123456');

      expect(result).toEqual(mockResponse);
      expect(mockInstitucionService.obtenerInstitucion).toHaveBeenCalledWith('123456');
    });
  });

  describe('promedioSector', () => {
    it('debería llamar al servicio promedioSector con la naturaleza dada', async () => {
      const mockResponse = { naturaleza: 'OFICIAL', promedio: 248.5 };
      mockInstitucionService.promedioSector.mockResolvedValue(mockResponse);

      const result = await controller.promedioSector('OFICIAL');

      expect(result).toEqual(mockResponse);
      expect(mockInstitucionService.promedioSector).toHaveBeenCalledWith('OFICIAL');
    });

    it('debería llamar al servicio promedioSector para sector NO OFICIAL', async () => {
      const mockResponse = { naturaleza: 'NO OFICIAL', promedio: 285.2 };
      mockInstitucionService.promedioSector.mockResolvedValue(mockResponse);

      const result = await controller.promedioSector('NO OFICIAL');

      expect(result).toEqual(mockResponse);
      expect(mockInstitucionService.promedioSector).toHaveBeenCalledWith('NO OFICIAL');
    });
  });
});
