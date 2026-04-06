import { Test } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { ConflictException, InternalServerErrorException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

import { UserService } from './user.service';
import { User } from '../auth/schemas/user.schema';

/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unused-vars */

let createdUserData: any;

const mockSave = jest.fn();

const MockUserModel = jest.fn().mockImplementation((data) => {
  createdUserData = data;
  return { save: mockSave };
});

(MockUserModel as any).findOne = jest.fn();

// ── DTO base reutilizable ─────────────────────────────────────────────────────

const baseDto = {
  email: 'juan@test.com',
  password: '123456',
  firstname: 'Juan',
  lastname: 'Pérez',
  role: 'consultor',
};

// ─────────────────────────────────────────────────────────────────────────────

describe('UserService', () => {
  let service: UserService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getModelToken(User.name),
          useValue: MockUserModel,
        },
      ],
    }).compile();

    service = module.get(UserService);
  });

  afterEach(() => jest.clearAllMocks());

  // ─── register: camino feliz ───────────────────────────────────────────────

  describe('register', () => {
    it('registra usuario correctamente y retorna mensaje de éxito', async () => {
      (MockUserModel as any).findOne.mockResolvedValue(null);
      mockSave.mockResolvedValue({});

      const result = await service.register(baseDto);

      expect(result).toEqual({ message: 'Usuario registrado correctamente.' });
    });

    it('encripta la contraseña antes de guardar', async () => {
      (MockUserModel as any).findOne.mockResolvedValue(null);
      mockSave.mockResolvedValue({});

      await service.register(baseDto);

      expect(createdUserData.password).not.toBe(baseDto.password);
      const isMatch = await bcrypt.compare(baseDto.password, createdUserData.password);
      expect(isMatch).toBe(true);
    });

    it('llama a findOne con el email correcto', async () => {
      (MockUserModel as any).findOne.mockResolvedValue(null);
      mockSave.mockResolvedValue({});

      await service.register(baseDto);

      expect((MockUserModel as any).findOne).toHaveBeenCalledWith({
        email: baseDto.email,
      });
    });

    it('asigna role "consultor" por defecto cuando no se provee', async () => {
      (MockUserModel as any).findOne.mockResolvedValue(null);
      mockSave.mockResolvedValue({});

      const { role: _omitted, ...dtoSinRole } = baseDto;
      await service.register({ ...dtoSinRole, role: '' });

      expect(createdUserData.role).toBe('consultor');
    });

    it('asigna estado true al crear el usuario', async () => {
      (MockUserModel as any).findOne.mockResolvedValue(null);
      mockSave.mockResolvedValue({});

      await service.register(baseDto);

      expect(createdUserData.estado).toBe(true);
    });

    // ─── ConflictException: email duplicado ───────────────────────────────

    it('lanza ConflictException si el email ya existe', async () => {
      (MockUserModel as any).findOne.mockResolvedValue({ email: baseDto.email });

      await expect(service.register(baseDto)).rejects.toThrow(ConflictException);
      await expect(service.register(baseDto)).rejects.toThrow('Este email ya se encuentra registrado.');
    });

    it('no llama a save cuando el email ya existe', async () => {
      (MockUserModel as any).findOne.mockResolvedValue({ email: baseDto.email });

      await expect(service.register(baseDto)).rejects.toThrow(ConflictException);

      expect(mockSave).not.toHaveBeenCalled();
    });

    // ─── ConflictException: password vacío ───────────────────────────────

    it('lanza ConflictException si la contraseña está vacía', async () => {
      (MockUserModel as any).findOne.mockResolvedValue(null);

      await expect(service.register({ ...baseDto, password: '' })).rejects.toThrow(ConflictException);
      await expect(service.register({ ...baseDto, password: '' })).rejects.toThrow('La contraseña es requerida.');
    });

    it('no llama a save cuando la contraseña está vacía', async () => {
      (MockUserModel as any).findOne.mockResolvedValue(null);

      await expect(service.register({ ...baseDto, password: '' })).rejects.toThrow(ConflictException);

      expect(mockSave).not.toHaveBeenCalled();
    });

    // ─── InternalServerErrorException: fallo en save ─────────────────────

    it('lanza InternalServerErrorException cuando save falla', async () => {
      (MockUserModel as any).findOne.mockResolvedValue(null);
      mockSave.mockImplementation(() => {
        throw new Error('DB fail');
      });

      await expect(service.register(baseDto)).rejects.toThrow(InternalServerErrorException);
    });

    it('no retorna mensaje de éxito cuando save falla', async () => {
      (MockUserModel as any).findOne.mockResolvedValue(null);
      mockSave.mockImplementation(() => {
        throw new Error('DB fail');
      });

      await expect(service.register(baseDto)).rejects.not.toThrow('Usuario registrado correctamente.');
    });
  });
});
