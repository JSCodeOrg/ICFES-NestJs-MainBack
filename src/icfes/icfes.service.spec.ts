import { Test, TestingModule } from '@nestjs/testing';
import { IcfesService } from './icfes.service';
import { getModelToken } from '@nestjs/mongoose';
import { Resultado } from './schema/icfes.schema';

describe('IcfesService', () => {
  let service: IcfesService;

  const distributionData = [
    {
      genero: "F",
      cantidad: 1833550,
      porcentaje: 54.43
    },
    {
      genero: "M",
      cantidad: 1534839,
      porcentaje: 45.56
    }
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

  it('debería retornar correctamente la distribución por género', async () => {
    mockResultadoModel.aggregate.mockResolvedValue(distributionData);

    const result = await service.distribucionGenero();

    expect(result).toEqual(distributionData);
    expect(mockResultadoModel.aggregate).toHaveBeenCalled();
  });
});