import { Test, TestingModule } from '@nestjs/testing';
import { IcfesController } from './icfes.controller';
import { IcfesService } from './icfes.service';

describe('IcfesController', () => {
  let controller: IcfesController;

  const mockIcfesService = {
    distribucionGenero: jest.fn(),
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

  it('Debería llamar al servicio de distribucion de genero', async () => {
    const mockResponse = [
      {
        genero: "F",
        cantidad: 1833550,
        porcentaje: 54.43,
      },
      {
        genero: "M",
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