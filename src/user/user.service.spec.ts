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

const mockLean = jest.fn();
const mockLimit = jest.fn().mockReturnValue({ lean: mockLean });
const mockSkip = jest.fn().mockReturnValue({ limit: mockLimit });
const mockSelect = jest.fn().mockReturnValue({ skip: mockSkip });
const mockFind = jest.fn().mockReturnValue({ select: mockSelect });
const mockCountDocuments = jest.fn();

const MockUserModel = jest.fn().mockImplementation((data) => {
  createdUserData = data;
  return { save: mockSave };
});

(MockUserModel as any).findOne = jest.fn();

(MockUserModel as any).find = mockFind;
(MockUserModel as any).countDocuments = mockCountDocuments;

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

  describe('getAllUsers', () => {
    const mockUsers = [
      { _id: '1', email: 'a@test.com', firstname: 'Ana', lastname: 'Lopez', role: 'consultor', estado: true },
      { _id: '2', email: 'b@test.com', firstname: 'Luis', lastname: 'Mora', role: 'admin', estado: true },
    ];

    beforeEach(() => {
      // Resetear la cadena de métodos antes de cada test
      mockLean.mockResolvedValue(mockUsers);
      mockCountDocuments.mockResolvedValue(2);
    });

    // ─── Camino feliz ─────────────────────────────────────────────────────────

    it('retorna usuarios paginados con metadata correcta', async () => {
      const result = await service.getAllUsers(1, 10);

      expect(result).toEqual({
        data: mockUsers,
        meta: {
          total: 2,
          page: 1,
          lastPage: 1,
        },
      });
    });

    it('calcula correctamente el skip según la página', async () => {
      await service.getAllUsers(3, 5);

      // página 3, limit 5 → skip debe ser (3-1)*5 = 10
      expect(mockSkip).toHaveBeenCalledWith(10);
    });

    it('aplica el limit correcto al query', async () => {
      await service.getAllUsers(1, 5);

      expect(mockLimit).toHaveBeenCalledWith(5);
    });

    it('filtra solo usuarios con estado true', async () => {
      await service.getAllUsers(1, 10);

      expect(mockFind).toHaveBeenCalledWith({ estado: true });
      expect(mockCountDocuments).toHaveBeenCalledWith({ estado: true });
    });

    it('excluye el campo password del resultado', async () => {
      await service.getAllUsers(1, 10);

      expect(mockSelect).toHaveBeenCalledWith('-password');
    });

    it('calcula lastPage correctamente cuando no es divisible exacto', async () => {
      mockCountDocuments.mockResolvedValue(11);

      const result = await service.getAllUsers(1, 5);

      // 11 usuarios / 5 por página = 3 páginas (ceil)
      expect(result.meta.lastPage).toBe(3);
    });

    it('usa valores por defecto page=1 y limit=10 si no se pasan argumentos', async () => {
      await service.getAllUsers();

      expect(mockSkip).toHaveBeenCalledWith(0); // (1-1)*10
      expect(mockLimit).toHaveBeenCalledWith(10);
    });

    it('retorna data vacía cuando no hay usuarios activos', async () => {
      mockLean.mockResolvedValue([]);
      mockCountDocuments.mockResolvedValue(0);

      const result = await service.getAllUsers(1, 10);

      expect(result.data).toEqual([]);
      expect(result.meta.total).toBe(0);
      expect(result.meta.lastPage).toBe(0); // Math.ceil(0/10) = 0
    });

    // ─── Manejo de errores ────────────────────────────────────────────────────

    it('lanza InternalServerErrorException cuando falla el query', async () => {
      mockLean.mockRejectedValue(new Error('DB error'));

      await expect(service.getAllUsers(1, 10)).rejects.toThrow(InternalServerErrorException);
    });

    it('lanza InternalServerErrorException cuando falla countDocuments', async () => {
      mockCountDocuments.mockRejectedValue(new Error('DB error'));

      await expect(service.getAllUsers(1, 10)).rejects.toThrow(InternalServerErrorException);
    });
  });
});
