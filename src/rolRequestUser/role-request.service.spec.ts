import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import {
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';

import { RoleRequestService } from './role-request.service';
import { RoleRequest } from './schemas/role-request.schema';
import { User } from '../auth/schemas/user.schema';

describe('RoleRequestService', () => {
  let service: RoleRequestService;

  const mockRoleRequestModel = {
    findOne: jest.fn(),
    create: jest.fn(),
    find: jest.fn(),
    findById: jest.fn(),
  };

  const mockUserModel = {
    findByIdAndUpdate: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoleRequestService,
        {
          provide: getModelToken(RoleRequest.name),
          useValue: mockRoleRequestModel,
        },
        {
          provide: getModelToken(User.name),
          useValue: mockUserModel,
        },
      ],
    }).compile();

    service = module.get<RoleRequestService>(RoleRequestService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const dto = {
      requestedRole: 'expert',
      reason: 'Quiero apoyar revisiones',
    };

    it('lanza ConflictException si ya existe solicitud pendiente', async () => {
      mockRoleRequestModel.findOne.mockResolvedValue({
        _id: 'request-id',
      });

      await expect(
        service.create(
          '507f1f77bcf86cd799439011',
          'test@test.com',
          'Jairo',
          'user',
          dto,
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('lanza ConflictException si solicita el mismo rol', async () => {
      mockRoleRequestModel.findOne.mockResolvedValue(null);

      await expect(
        service.create(
          '507f1f77bcf86cd799439011',
          'test@test.com',
          'Jairo',
          'expert',
          {
            requestedRole: 'expert',
            reason: '',
          },
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('crea solicitud correctamente', async () => {
      mockRoleRequestModel.findOne.mockResolvedValue(null);

      const createdRequest = {
        _id: 'request-id',
        userEmail: 'test@test.com',
        requestedRole: 'expert',
        status: 'pending',
      };

      mockRoleRequestModel.create.mockResolvedValue(createdRequest);

      const result = await service.create(
        '507f1f77bcf86cd799439011',
        'test@test.com',
        'Jairo',
        'user',
        dto,
      );

      expect(mockRoleRequestModel.create).toHaveBeenCalled();

      expect(result).toEqual({
        message: 'Solicitud enviada correctamente.',
        request: createdRequest,
      });
    });
  });

  describe('findAll', () => {
    it('retorna todas las solicitudes', async () => {
      const mockData = [{ id: 1 }];

      mockRoleRequestModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(mockData),
        }),
      });

      const result = await service.findAll();

      expect(result).toEqual(mockData);
    });
  });

  describe('findPending', () => {
    it('retorna solicitudes pendientes', async () => {
      const mockData = [{ status: 'pending' }];

      mockRoleRequestModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(mockData),
        }),
      });

      const result = await service.findPending();

      expect(result).toEqual(mockData);
    });
  });

  describe('findByUser', () => {
    it('retorna solicitud pendiente del usuario', async () => {
      const mockRequest = {
        userId: '507f1f77bcf86cd799439011',
        status: 'pending',
      };

      mockRoleRequestModel.findOne.mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockRequest),
      });

      const result = await service.findByUser(
        '507f1f77bcf86cd799439011',
      );

      expect(result).toEqual(mockRequest);
    });
  });

  describe('resolve', () => {
    it('lanza NotFoundException si no existe solicitud', async () => {
      mockRoleRequestModel.findById.mockResolvedValue(null);

      await expect(
        service.resolve('request-id', 'approved'),
      ).rejects.toThrow(NotFoundException);
    });

    it('lanza ConflictException si ya fue procesada', async () => {
      mockRoleRequestModel.findById.mockResolvedValue({
        status: 'approved',
      });

      await expect(
        service.resolve('request-id', 'approved'),
      ).rejects.toThrow(ConflictException);
    });

    it('aprueba solicitud y actualiza rol', async () => {
      const saveMock = jest.fn();

      const request = {
        userId: new Types.ObjectId(),
        requestedRole: 'expert',
        status: 'pending',
        save: saveMock,
      };

      mockRoleRequestModel.findById.mockResolvedValue(request);

      const result = await service.resolve(
        'request-id',
        'approved',
      );

      expect(saveMock).toHaveBeenCalled();

      expect(mockUserModel.findByIdAndUpdate).toHaveBeenCalledWith(
        request.userId,
        {
          role: request.requestedRole,
        },
      );

      expect(result).toEqual({
        message: 'Solicitud aprobada y rol asignado.',
        request,
      });
    });

    it('rechaza solicitud correctamente', async () => {
      const saveMock = jest.fn();

      const request = {
        userId: new Types.ObjectId(),
        requestedRole: 'expert',
        status: 'pending',
        save: saveMock,
      };

      mockRoleRequestModel.findById.mockResolvedValue(request);

      const result = await service.resolve(
        'request-id',
        'rejected',
      );

      expect(saveMock).toHaveBeenCalled();

      expect(mockUserModel.findByIdAndUpdate).not.toHaveBeenCalled();

      expect(result).toEqual({
        message: 'Solicitud rechazada.',
        request,
      });
    });
  });
});