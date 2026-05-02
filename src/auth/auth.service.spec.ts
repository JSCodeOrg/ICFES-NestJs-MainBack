import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { getModelToken } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { Types } from 'mongoose';
import { verify } from 'crypto';

jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;

  const mockUserModel = {
    findOne: jest.fn(),
    findById: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn<string, [Record<string, unknown>]>(),
    verify: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getModelToken('User'),
          useValue: mockUserModel,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validateUser', () => {
    it('retorna null si no existe usuario', async () => {
      mockUserModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const result = await service.validateUser('test@test.com', '123');

      expect(result).toBeNull();
    });

    it('retorna null si no tiene password', async () => {
      mockUserModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ password: null }),
      });

      const result = await service.validateUser('test@test.com', '123');

      expect(result).toBeNull();
    });

    it('retorna null si password no coincide', async () => {
      const user = {
        _id: '1',
        email: 'test@test.com',
        password: 'hash',
        role: 'user',
        estado: true,
      };

      mockUserModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(user),
      });

      const compareMock = bcrypt.compare as jest.MockedFunction<typeof bcrypt.compare>;
      compareMock.mockResolvedValue(false as never);

      const result = await service.validateUser('test@test.com', 'wrong');

      expect(result).toBeNull();
    });

    it('retorna usuario si password coincide', async () => {
      const user = {
        _id: '1',
        email: 'test@test.com',
        password: 'hash',
        role: 'admin',
        estado: true,
      };

      mockUserModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(user),
      });

      const compareMock = bcrypt.compare as jest.MockedFunction<typeof bcrypt.compare>;
      compareMock.mockResolvedValue(true as never);

      const result = await service.validateUser('test@test.com', '123');

      expect(result).toEqual({
        id: user._id,
        email: user.email,
        role: user.role,
        estado: user.estado,
      });
    });
  });

  describe('login', () => {
    it('lanza Unauthorized si credenciales inválidas', async () => {
      jest.spyOn(service, 'validateUser').mockResolvedValue(null);

      await expect(service.login({ email: 'test@test.com', password: '123' })).rejects.toThrow(UnauthorizedException);
    });

    it('lanza Unauthorized si usuario inactivo', async () => {
      jest.spyOn(service, 'validateUser').mockResolvedValue({
        id: new Types.ObjectId('507f1f77bcf86cd799439011'),
        email: 'test@test.com',
        role: 'user',
        estado: false,
      });

      await expect(service.login({ email: 'test@test.com', password: '123' })).rejects.toThrow(UnauthorizedException);
    });

    it('retorna token si todo es válido', async () => {
      const user = {
        id: new Types.ObjectId('507f1f77bcf86cd799439011'),
        email: 'test@test.com',
        role: 'admin',
        estado: true,
      };

      jest.spyOn(service, 'validateUser').mockResolvedValue(user);
      mockJwtService.sign.mockReturnValue('token123');

      const result = await service.login({
        email: 'test@test.com',
        password: '123',
      });

      expect(mockJwtService.sign).toHaveBeenCalledWith({
        email: user.email,
        id: user.id,
        role: user.role,
      });

      expect(result).toEqual({
        access_token: 'token123',
      });
    });
  });

  it('retorna usuario si token es válido y existe usuario', async () => {
    const token = 'valid-token';

    const payload = {
      id: '1',
      email: 'test@test.com',
      role: 'admin',
    };

    const user = {
      _id: '1',
      email: 'test@test.com',
      role: 'admin',
    };

    mockJwtService.verify.mockReturnValue(payload);
    mockUserModel.findById.mockResolvedValue(user);

    const result = await service.getMe(token);

    expect(mockJwtService.verify).toHaveBeenCalledWith(token);
    expect(mockUserModel.findById).toHaveBeenCalledWith(payload.id);

    expect(result).toEqual({
      id: payload.id,
      email: payload.email,
      role: payload.role,
    });
  });

  it('lanza UnauthorizedException si token es inválido', async () => {
    mockJwtService.verify.mockImplementation(() => {
      throw new Error('invalid token');
    });

    await expect(service.getMe('bad-token')).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('lanza UnauthorizedException si usuario no existe', async () => {
    const payload = {
      id: '1',
      email: 'test@test.com',
      role: 'admin',
    };

    mockJwtService.verify.mockReturnValue(payload);
    mockUserModel.findById.mockResolvedValue(null);

    await expect(service.getMe('valid-token')).rejects.toThrow(
      UnauthorizedException,
    );
  });

});
