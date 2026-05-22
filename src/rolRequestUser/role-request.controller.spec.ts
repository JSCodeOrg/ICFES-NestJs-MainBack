import { Test, TestingModule } from '@nestjs/testing';
import { RoleRequestController } from './role-request.controller';
import { RoleRequestService } from './role-request.service';

describe('RoleRequestController', () => {
  let controller: RoleRequestController;

  const mockRoleRequestService = {
    create: jest.fn(),
    findByUser: jest.fn(),
    findAll: jest.fn(),
    findPending: jest.fn(),
    resolve: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RoleRequestController],
      providers: [
        {
          provide: RoleRequestService,
          useValue: mockRoleRequestService,
        },
      ],
    }).compile();

    controller = module.get<RoleRequestController>(
      RoleRequestController,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('debe crear solicitud', async () => {
      const req = {
        user: {
          id: '1',
          email: 'test@test.com',
          role: 'user',
          firstname: 'Jairo',
          lastname: 'Gomez',
        },
      };

      const dto = {
        requestedRole: 'expert',
        reason: 'Quiero ayudar',
      };

      mockRoleRequestService.create.mockResolvedValue({
        message: 'ok',
      });

      const result = await controller.create(req, dto);

      expect(mockRoleRequestService.create).toHaveBeenCalledWith(
        '1',
        'test@test.com',
        'Jairo Gomez',
        'user',
        dto,
      );

      expect(result).toEqual({
        message: 'ok',
      });
    });
  });

  describe('myRequest', () => {
    it('retorna solicitud del usuario', async () => {
      mockRoleRequestService.findByUser.mockResolvedValue({
        status: 'pending',
      });

      const req = {
        user: {
          id: '1',
        },
      };

      const result = await controller.myRequest(req);

      expect(mockRoleRequestService.findByUser).toHaveBeenCalledWith(
        '1',
      );

      expect(result).toEqual({
        status: 'pending',
      });
    });
  });

  describe('findAll', () => {
    it('retorna todas las solicitudes', async () => {
      mockRoleRequestService.findAll.mockResolvedValue([
        { id: 1 },
      ]);

      const result = await controller.findAll();

      expect(result).toEqual([{ id: 1 }]);
    });
  });

  describe('findPending', () => {
    it('retorna solicitudes pendientes', async () => {
      mockRoleRequestService.findPending.mockResolvedValue([
        { status: 'pending' },
      ]);

      const result = await controller.findPending();

      expect(result).toEqual([{ status: 'pending' }]);
    });
  });

  describe('resolve', () => {
    it('resuelve solicitud', async () => {
      mockRoleRequestService.resolve.mockResolvedValue({
        message: 'Solicitud aprobada',
      });

      const result = await controller.resolve(
        'request-id',
        'approved',
      );

      expect(mockRoleRequestService.resolve).toHaveBeenCalledWith(
        'request-id',
        'approved',
      );

      expect(result).toEqual({
        message: 'Solicitud aprobada',
      });
    });
  });
});