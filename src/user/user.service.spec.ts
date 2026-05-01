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
const mockUserModel = jest.fn().mockImplementation((dto: any) => {
  createdUserData = dto;
  return {
    ...dto,
    save: mockSave,
  };
}) as any;

mockUserModel.find = jest.fn();
mockUserModel.findOne = jest.fn();
mockUserModel.countDocuments = jest.fn();

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
          useValue: mockUserModel,
        },
        {
          provide: getModelToken(User.name),
          useValue: mockUserModel
        }
      ],
    }).compile();

    service = module.get(UserService);
  });

  afterEach(() => jest.clearAllMocks());

  // ─── register: camino feliz ───────────────────────────────────────────────

  describe('getAllUsers', () => {

    it('retorna usuarios paginados correctamente', async () => {
      const usersMock = [{ email: 'a@test.com' }];

      mockUserModel.find.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(usersMock),
      });

      mockUserModel.countDocuments.mockResolvedValue(10);

      const result = await service.getAllUsers(1, 10);

      expect(result.data).toEqual(usersMock);
    });

    it('calcula lastPage correctamente', async () => {
      mockUserModel.find.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([]),
      });

      mockUserModel.countDocuments.mockResolvedValue(20);

      const result = await service.getAllUsers(1, 10);

      expect(result.meta.lastPage).toBe(2);
    });

    it('maneja errores de base de datos', async () => {
      mockUserModel.find.mockImplementation(() => {
        throw new Error('DB error');
      });

      await expect(service.getAllUsers(1, 10)).rejects.toThrow();
    });
  });

  describe('register', () => {
    it('registra usuario correctamente y retorna mensaje de éxito', async () => {
      mockUserModel.findOne.mockResolvedValue(null);
      mockSave.mockResolvedValue({});

      const result = await service.register(baseDto);

      expect(result).toEqual({ message: 'Usuario registrado correctamente.' });
    });

    it('encripta la contraseña antes de guardar', async () => {
      mockUserModel.findOne.mockResolvedValue(null);
      mockSave.mockResolvedValue({});

      await service.register(baseDto);

      expect(createdUserData.password).not.toBe(baseDto.password);
      const isMatch = await bcrypt.compare(baseDto.password, createdUserData.password);
      expect(isMatch).toBe(true);
    });

    it('llama a findOne con el email correcto', async () => {
      mockUserModel.findOne.mockResolvedValue(null);
      mockSave.mockResolvedValue({});

      await service.register(baseDto);

      expect(mockUserModel.findOne).toHaveBeenCalledWith({
        email: baseDto.email,
      });
    });

    it('asigna role "consultor" por defecto cuando no se provee', async () => {
      mockUserModel.findOne.mockResolvedValue(null);
      mockSave.mockResolvedValue({});

      const { role: _omitted, ...dtoSinRole } = baseDto;
      await service.register({ ...dtoSinRole, role: '' });

      expect(createdUserData.role).toBe('consultor');
    });

    it('asigna estado true al crear el usuario', async () => {
      mockUserModel.findOne.mockResolvedValue(null);
      mockSave.mockResolvedValue({});

      await service.register(baseDto);

      expect(createdUserData.estado).toBe(true);
    });

    // ─── ConflictException: email duplicado ───────────────────────────────

    it('lanza ConflictException si el email ya existe', async () => {
      mockUserModel.findOne.mockResolvedValue({ email: baseDto.email });

      await expect(service.register(baseDto)).rejects.toThrow(ConflictException);
      await expect(service.register(baseDto)).rejects.toThrow('Este email ya se encuentra registrado.');
    });

    it('no llama a save cuando el email ya existe', async () => {
      mockUserModel.findOne.mockResolvedValue({ email: baseDto.email });

      await expect(service.register(baseDto)).rejects.toThrow(ConflictException);

      expect(mockSave).not.toHaveBeenCalled();
    });

    // ─── ConflictException: password vacío ───────────────────────────────

    it('lanza ConflictException si la contraseña está vacía', async () => {
      mockUserModel.findOne.mockResolvedValue(null);

      await expect(service.register({ ...baseDto, password: '' })).rejects.toThrow(ConflictException);
      await expect(service.register({ ...baseDto, password: '' })).rejects.toThrow('La contraseña es requerida.');
    });

    it('no llama a save cuando la contraseña está vacía', async () => {
      mockUserModel.findOne.mockResolvedValue(null);

      await expect(service.register({ ...baseDto, password: '' })).rejects.toThrow(ConflictException);

      expect(mockSave).not.toHaveBeenCalled();
    });

    // ─── InternalServerErrorException: fallo en save ─────────────────────

    it('lanza InternalServerErrorException cuando save falla', async () => {
      mockUserModel.findOne.mockResolvedValue(null);
      mockSave.mockImplementation(() => {
        throw new Error('DB fail');
      });

      await expect(service.register(baseDto)).rejects.toThrow(InternalServerErrorException);
    });

    it('no retorna mensaje de éxito cuando save falla', async () => {
      mockUserModel.findOne.mockResolvedValue(null);
      mockSave.mockImplementation(() => {
        throw new Error('DB fail');
      });

      await expect(service.register(baseDto)).rejects.not.toThrow('Usuario registrado correctamente.');
    });
  });

  describe('updateUserRol', () => {
    const mockUserId = 'abc123';
    const mockRole = 'admin';

    // ─── Camino feliz ────────────────────────────────────────────────────────

    it('actualiza el rol correctamente y retorna mensaje de éxito', async () => {
      const mockUser = { role: '', save: jest.fn().mockResolvedValue({}) };
      mockUserModel.findById = jest.fn().mockResolvedValue(mockUser);

      const result = await service.updateUserRol(mockUserId, mockRole);

      expect(result).toEqual({ message: 'Rol de usuario actualizado correctamente.' });
    });

    it('asigna el nuevo rol al usuario antes de guardar', async () => {
      const mockUser = { role: '', save: jest.fn().mockResolvedValue({}) };
      mockUserModel.findById = jest.fn().mockResolvedValue(mockUser);

      await service.updateUserRol(mockUserId, mockRole);

      expect(mockUser.role).toBe(mockRole);
    });

    it('llama a findById con el id correcto', async () => {
      const mockUser = { role: '', save: jest.fn().mockResolvedValue({}) };
      mockUserModel.findById = jest.fn().mockResolvedValue(mockUser);

      await service.updateUserRol(mockUserId, mockRole);

      expect(mockUserModel.findById).toHaveBeenCalledWith(mockUserId);
    });

    it('llama a save una vez después de actualizar el rol', async () => {
      const mockSaveLocal = jest.fn().mockResolvedValue({});
      const mockUser = { role: '', save: mockSaveLocal };
      mockUserModel.findById = jest.fn().mockResolvedValue(mockUser);

      await service.updateUserRol(mockUserId, mockRole);

      expect(mockSaveLocal).toHaveBeenCalledTimes(1);
    });

    // ─── Usuario no encontrado ───────────────────────────────────────────────

    it('lanza InternalServerErrorException si el usuario no existe', async () => {
      mockUserModel.findById = jest.fn().mockResolvedValue(null);

      await expect(service.updateUserRol(mockUserId, mockRole))
        .rejects.toThrow(InternalServerErrorException);
    });

    it('no llama a save si el usuario no existe', async () => {
      const mockSaveLocal = jest.fn();
      mockUserModel.findById = jest.fn().mockResolvedValue(null);

      await expect(service.updateUserRol(mockUserId, mockRole))
        .rejects.toThrow();

      expect(mockSaveLocal).not.toHaveBeenCalled();
    });

    // ─── Fallo en save ───────────────────────────────────────────────────────

    it('lanza InternalServerErrorException cuando save falla', async () => {
      const mockUser = {
        role: '',
        save: jest.fn().mockRejectedValue(new Error('DB fail')),
      };
      mockUserModel.findById = jest.fn().mockResolvedValue(mockUser);

      await expect(service.updateUserRol(mockUserId, mockRole))
        .rejects.toThrow(InternalServerErrorException);
    });

    // ─── Fallo en findById ───────────────────────────────────────────────────

    it('lanza InternalServerErrorException cuando findById falla', async () => {
      mockUserModel.findById = jest.fn().mockRejectedValue(new Error('DB fail'));

      await expect(service.updateUserRol(mockUserId, mockRole))
        .rejects.toThrow(InternalServerErrorException);
    });
  });
});


