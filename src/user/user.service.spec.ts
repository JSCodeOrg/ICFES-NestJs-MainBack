import { Test } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import {
  ConflictException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { UserService } from './user.service';
import { User } from '../auth/schemas/user.schema';
import { VerificationCode } from '../auth/schemas/verification-code.schema';
import { MailService } from '../email/mail.service';

// ---------- Mocks ----------
const mockVerificationCodeModel = {
  deleteMany: jest.fn().mockResolvedValue({}),
  create: jest.fn().mockResolvedValue({}),
  findOne: jest.fn(),
  deleteOne: jest.fn(),
};

const mockMailService = {
  sendVerificationCode: jest.fn().mockResolvedValue(true),
};

// UserModel mock más completo
const mockUserModel = {
  findOne: jest.fn(),
  findById: jest.fn(),
  find: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  lean: jest.fn(),
  countDocuments: jest.fn(),
  // Para el constructor interno usado en verifyEmail
  mockImplementation: jest.fn(),
};

// Datos de prueba
const baseDto = {
  email: 'juan@test.com',
  password: '123456',
  firstname: 'Juan',
  lastname: 'Pérez',
  role: 'consultor',
};

describe('UserService', () => {
  let service: UserService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getModelToken(User.name),
          useValue: mockUserModel,
        },
        {
          provide: getModelToken(VerificationCode.name),
          useValue: mockVerificationCodeModel,
        },
        {
          provide: MailService,
          useValue: mockMailService,
        },
      ],
    }).compile();

    service = module.get(UserService);
  });

  // ==================== getAllUsers ====================
  describe('getAllUsers', () => {
    it('retorna usuarios paginados correctamente', async () => {
      const usersMock = [{ email: 'a@test.com' }];
      mockUserModel.lean.mockResolvedValue(usersMock);
      mockUserModel.countDocuments.mockResolvedValue(10);

      const result = await service.getAllUsers(1, 10);

      expect(result.data).toEqual(usersMock);
      expect(mockUserModel.find).toHaveBeenCalledWith({ estado: true });
      expect(mockUserModel.select).toHaveBeenCalledWith('-password');
      expect(mockUserModel.skip).toHaveBeenCalledWith(0);
      expect(mockUserModel.limit).toHaveBeenCalledWith(10);
    });

    it('calcula lastPage correctamente', async () => {
      mockUserModel.lean.mockResolvedValue([]);
      mockUserModel.countDocuments.mockResolvedValue(20);

      const result = await service.getAllUsers(1, 10);

      expect(result.meta.lastPage).toBe(2);
      expect(result.meta.total).toBe(20);
      expect(result.meta.page).toBe(1);
    });

    it('lanza InternalServerErrorException cuando hay error de base de datos', async () => {
      mockUserModel.lean.mockRejectedValue(new Error('DB error'));

      await expect(service.getAllUsers(1, 10)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  // ==================== register ====================
  describe('register', () => {
    it('envía código de verificación cuando el email no existe y password válido', async () => {
      mockUserModel.findOne.mockResolvedValue(null); // email libre
      mockVerificationCodeModel.deleteMany.mockResolvedValue({});
      mockVerificationCodeModel.create.mockResolvedValue({});
      mockMailService.sendVerificationCode.mockResolvedValue(true);

      const result = await service.register(baseDto);

      expect(result).toEqual({
        message: 'Código de verificación enviado. Revisa tu correo.',
      });
      expect(mockUserModel.findOne).toHaveBeenCalledWith({
        email: baseDto.email,
      });
      expect(mockVerificationCodeModel.deleteMany).toHaveBeenCalledWith({
        email: baseDto.email,
      });
      expect(mockVerificationCodeModel.create).toHaveBeenCalledWith({
        email: baseDto.email,
        code: expect.any(String),
        hashedPassword: expect.any(String),
      });
      expect(mockMailService.sendVerificationCode).toHaveBeenCalledWith(
        baseDto.email,
        expect.any(String),
      );
    });

    it('encripta la contraseña antes de guardar en verificationCode', async () => {
      mockUserModel.findOne.mockResolvedValue(null);
      let createdCodeData: any;
      mockVerificationCodeModel.create.mockImplementation((data) => {
        createdCodeData = data;
        return Promise.resolve({});
      });

      await service.register(baseDto);

      expect(createdCodeData.hashedPassword).not.toBe(baseDto.password);
      const isMatch = await bcrypt.compare(
        baseDto.password,
        createdCodeData.hashedPassword,
      );
      expect(isMatch).toBe(true);
    });

    it('lanza ConflictException si el email ya existe', async () => {
      mockUserModel.findOne.mockResolvedValue({ email: baseDto.email });

      await expect(service.register(baseDto)).rejects.toThrow(ConflictException);
      await expect(service.register(baseDto)).rejects.toThrow(
        'Este email ya se encuentra registrado.',
      );
      expect(mockVerificationCodeModel.create).not.toHaveBeenCalled();
      expect(mockMailService.sendVerificationCode).not.toHaveBeenCalled();
    });

    it('lanza ConflictException si la contraseña está vacía', async () => {
      mockUserModel.findOne.mockResolvedValue(null);

      await expect(
        service.register({ ...baseDto, password: '' }),
      ).rejects.toThrow(ConflictException);
      await expect(
        service.register({ ...baseDto, password: '' }),
      ).rejects.toThrow('La contraseña es requerida.');

      expect(mockVerificationCodeModel.create).not.toHaveBeenCalled();
      expect(mockMailService.sendVerificationCode).not.toHaveBeenCalled();
    });

    it('lanza ConflictException si la contraseña es solo espacios', async () => {
      mockUserModel.findOne.mockResolvedValue(null);

      await expect(
        service.register({ ...baseDto, password: '   ' }),
      ).rejects.toThrow(ConflictException);
      await expect(
        service.register({ ...baseDto, password: '   ' }),
      ).rejects.toThrow('La contraseña es requerida.');
    });

    // Nota: el servicio actual no maneja errores de sendVerificationCode,
    // pero si quisieras agregar manejo de errores, podrías añadir tests.
  });

  // ==================== verifyEmail ====================
  describe('verifyEmail', () => {
    const verifyDto = { email: 'test@test.com', code: '123456' };

    it('verifica correctamente y crea el usuario', async () => {
      const mockRecord = {
        _id: 'id123',
        email: verifyDto.email,
        code: verifyDto.code,
        hashedPassword: 'hashedPassword',
      };
      mockVerificationCodeModel.findOne.mockResolvedValue(mockRecord);
      mockVerificationCodeModel.deleteOne.mockResolvedValue({});

      // Mock del constructor y save del usuario
      const mockUserSave = jest.fn().mockResolvedValue({});
      const mockUserInstance = {
        save: mockUserSave,
      };
      // Reemplazamos temporalmente el constructor mock
      const originalUserModel = mockUserModel.mockImplementation;
      mockUserModel.mockImplementation = jest.fn(() => mockUserInstance);
      (mockUserModel as any).mockImplementation(() => mockUserInstance);

      const result = await service.verifyEmail(verifyDto);

      expect(result).toEqual({
        message: 'Correo verificado. Usuario registrado correctamente.',
      });
      expect(mockVerificationCodeModel.findOne).toHaveBeenCalledWith({
        email: verifyDto.email,
      });
      expect(mockVerificationCodeModel.deleteOne).toHaveBeenCalledWith({
        _id: mockRecord._id,
      });
      expect(mockUserSave).toHaveBeenCalled();
      // Verificar que el usuario se crea con los datos correctos
      // (esto depende de cómo se instancia, pero al menos se llamó al constructor)
    });

    it('lanza BadRequestException si no hay código pendiente', async () => {
      mockVerificationCodeModel.findOne.mockResolvedValue(null);

      await expect(service.verifyEmail(verifyDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.verifyEmail(verifyDto)).rejects.toThrow(
        'No hay un código pendiente para este correo.',
      );
    });

    it('lanza BadRequestException si el código es incorrecto', async () => {
      mockVerificationCodeModel.findOne.mockResolvedValue({
        code: 'wrongcode',
      });

      await expect(service.verifyEmail(verifyDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.verifyEmail(verifyDto)).rejects.toThrow(
        'Código incorrecto.',
      );
    });
  });

  // ==================== updateUserRol ====================
  describe('updateUserRol', () => {
    const mockUserId = 'abc123';
    const mockRole = 'admin';

    it('actualiza el rol correctamente y retorna mensaje de éxito', async () => {
      const mockUser = { role: 'user', save: jest.fn().mockResolvedValue({}) };
      mockUserModel.findById.mockResolvedValue(mockUser);

      const result = await service.updateUserRol(mockUserId, mockRole);

      expect(result).toEqual({
        message: 'Rol de usuario actualizado correctamente.',
      });
      expect(mockUser.role).toBe(mockRole);
      expect(mockUser.save).toHaveBeenCalledTimes(1);
    });

    it('lanza ConflictException si el usuario no existe', async () => {
      mockUserModel.findById.mockResolvedValue(null);

      await expect(
        service.updateUserRol(mockUserId, mockRole),
      ).rejects.toThrow(ConflictException);
      await expect(
        service.updateUserRol(mockUserId, mockRole),
      ).rejects.toThrow('Usuario no encontrado.');
    });

    it('lanza InternalServerErrorException cuando save falla', async () => {
      const mockUser = {
        role: 'user',
        save: jest.fn().mockRejectedValue(new Error('DB fail')),
      };
      mockUserModel.findById.mockResolvedValue(mockUser);

      await expect(
        service.updateUserRol(mockUserId, mockRole),
      ).rejects.toThrow(InternalServerErrorException);
    });

    it('lanza InternalServerErrorException cuando findById falla', async () => {
      mockUserModel.findById.mockRejectedValue(new Error('DB fail'));

      await expect(
        service.updateUserRol(mockUserId, mockRole),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });
});