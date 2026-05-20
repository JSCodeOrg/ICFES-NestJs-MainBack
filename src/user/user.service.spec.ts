import { Test } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import {
  ConflictException,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { UserService } from './user.service';
import { User } from '../auth/schemas/user.schema';
import { VerificationCode } from '../auth/schemas/verification-code.schema';
import { MailService } from '../email/mail.service';
import { NotificationService } from 'src/notificaciones/notification.service';
import { Notification } from 'src/notificaciones/schemas/notification.schema';
import { JwtService } from '@nestjs/jwt';

/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unused-vars */

// ─── User Model Mock ──────────────────────────────────────────────────────────

let createdUserData: any;
const mockUserSave = jest.fn();
const mockUserModel = jest.fn().mockImplementation((dto: any) => {
  createdUserData = dto;
  return {
    ...dto,
    _id: 'mock-user-id',
    email: dto.email,
    role: dto.role,
    save: mockUserSave,
  };
}) as any;

mockUserModel.find = jest.fn();
mockUserModel.findOne = jest.fn();
mockUserModel.findById = jest.fn();
mockUserModel.countDocuments = jest.fn();

// ─── VerificationCode Model Mock ─────────────────────────────────────────────

let createdCodeData: any;
const mockVerificationCodeModel = jest.fn().mockImplementation((dto: any) => {
  createdCodeData = dto;
  return dto;
}) as any;

mockVerificationCodeModel.findOne = jest.fn();
mockVerificationCodeModel.deleteMany = jest.fn().mockResolvedValue({});
mockVerificationCodeModel.deleteOne = jest.fn().mockResolvedValue({});
mockVerificationCodeModel.create = jest.fn();

// ─── Notification Model Mock ──────────────────────────────────────────────────

const mockNotificationModel = {
  find: jest.fn().mockResolvedValue([]),
};

// ─── NotificationService Mock ─────────────────────────────────────────────────

const mockNotificationService = {
  createMany: jest.fn().mockResolvedValue({}),
};

// ─── JwtService Mock ──────────────────────────────────────────────────────────

const mockJwtService = {
  sign: jest.fn().mockReturnValue('mock-token'),
};

// ─── MailService Mock ─────────────────────────────────────────────────────────

const mockMailService = {
  sendVerificationCode: jest.fn().mockResolvedValue(undefined),
};

// ─── Base DTO ─────────────────────────────────────────────────────────────────

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
          provide: getModelToken(VerificationCode.name),
          useValue: mockVerificationCodeModel,
        },
        {
          provide: getModelToken(Notification.name),
          useValue: mockNotificationModel,
        },
        {
          provide: MailService,
          useValue: mockMailService,
        },
        {
          provide: NotificationService,
          useValue: mockNotificationService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get(UserService);
  });

  afterEach(() => jest.clearAllMocks());

  // ─── register ────────────────────────────────────────────────────────────────

  describe('register', () => {
    beforeEach(() => {
      mockUserModel.findOne.mockResolvedValue(null);
      mockVerificationCodeModel.deleteMany.mockResolvedValue({});
      mockVerificationCodeModel.create.mockResolvedValue({});
      mockMailService.sendVerificationCode.mockResolvedValue(undefined);
    });

    it('retorna mensaje de código enviado cuando el registro es exitoso', async () => {
      const result = await service.register(baseDto);
      expect(result).toEqual({
        message: 'Código de verificación enviado. Revisa tu correo.',
      });
    });

    it('llama a findOne con el email correcto', async () => {
      await service.register(baseDto);
      expect(mockUserModel.findOne).toHaveBeenCalledWith({ email: baseDto.email });
    });

    it('elimina códigos anteriores antes de crear uno nuevo', async () => {
      await service.register(baseDto);
      expect(mockVerificationCodeModel.deleteMany).toHaveBeenCalledWith({
        email: baseDto.email,
      });
    });

    it('crea el registro de verificación con email, code y hashedPassword', async () => {
      await service.register(baseDto);
      expect(mockVerificationCodeModel.create).toHaveBeenCalledTimes(1);
      const createArg = mockVerificationCodeModel.create.mock.calls[0][0];
      expect(createArg.email).toBe(baseDto.email);
      expect(typeof createArg.code).toBe('string');
      expect(createArg.code).toHaveLength(6);
    });

    it('hashea la contraseña antes de guardarla en el código de verificación', async () => {
      await service.register(baseDto);
      const createArg = mockVerificationCodeModel.create.mock.calls[0][0];
      expect(createArg.hashedPassword).not.toBe(baseDto.password);
      const isMatch = await bcrypt.compare(baseDto.password, createArg.hashedPassword);
      expect(isMatch).toBe(true);
    });

    it('envía el código de verificación al email correcto', async () => {
      await service.register(baseDto);
      const createArg = mockVerificationCodeModel.create.mock.calls[0][0];
      expect(mockMailService.sendVerificationCode).toHaveBeenCalledWith(
        baseDto.email,
        createArg.code,
      );
    });

    it('lanza ConflictException si el email ya está registrado', async () => {
      mockUserModel.findOne.mockResolvedValue({ email: baseDto.email });
      await expect(service.register(baseDto)).rejects.toThrow(ConflictException);
      await expect(service.register(baseDto)).rejects.toThrow(
        'Este email ya se encuentra registrado.',
      );
    });

    it('no envía email si el email ya está registrado', async () => {
      mockUserModel.findOne.mockResolvedValue({ email: baseDto.email });
      await expect(service.register(baseDto)).rejects.toThrow(ConflictException);
      expect(mockMailService.sendVerificationCode).not.toHaveBeenCalled();
    });

    it('lanza ConflictException si la contraseña está vacía', async () => {
      await expect(service.register({ ...baseDto, password: '' })).rejects.toThrow(
        ConflictException,
      );
      await expect(service.register({ ...baseDto, password: '' })).rejects.toThrow(
        'La contraseña es requerida.',
      );
    });

    it('no crea código de verificación si la contraseña está vacía', async () => {
      await expect(
        service.register({ ...baseDto, password: '' }),
      ).rejects.toThrow(ConflictException);
      expect(mockVerificationCodeModel.create).not.toHaveBeenCalled();
    });
  });

  // ─── verifyEmail ─────────────────────────────────────────────────────────────

  describe('verifyEmail', () => {
    const hashedPassword = bcrypt.hashSync('123456', 10);
    const verifyDto = { email: 'juan@test.com', code: '123456' };
    const mockRecord = {
      _id: 'record-id',
      email: 'juan@test.com',
      code: '123456',
      hashedPassword,
    };

    beforeEach(() => {
      mockVerificationCodeModel.findOne.mockResolvedValue(mockRecord);
      mockVerificationCodeModel.deleteOne.mockResolvedValue({});
      mockUserSave.mockResolvedValue({});
      mockNotificationService.createMany.mockResolvedValue({});
      mockJwtService.sign.mockReturnValue('mock-token');
      mockNotificationModel.find.mockResolvedValue([]);
    });

    it('retorna access_token y mensaje de éxito cuando el código es correcto', async () => {
      const result = await service.verifyEmail(verifyDto);
      expect(result).toEqual({
        access_token: 'mock-token',
        message: 'Correo verificado. Usuario registrado correctamente.',
      });
    });

    it('lanza BadRequestException si no hay código pendiente para el correo', async () => {
      mockVerificationCodeModel.findOne.mockResolvedValue(null);
      await expect(service.verifyEmail(verifyDto)).rejects.toThrow(BadRequestException);
      await expect(service.verifyEmail(verifyDto)).rejects.toThrow(
        'No hay un código pendiente para este correo.',
      );
    });

    it('lanza BadRequestException si el código es incorrecto', async () => {
      await expect(
        service.verifyEmail({ ...verifyDto, code: '000000' }),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.verifyEmail({ ...verifyDto, code: '000000' }),
      ).rejects.toThrow('Código incorrecto.');
    });

    it('elimina el registro de verificación después de verificar', async () => {
      await service.verifyEmail(verifyDto);
      expect(mockVerificationCodeModel.deleteOne).toHaveBeenCalledWith({
        _id: mockRecord._id,
      });
    });

    it('crea el usuario con role consultor y estado true', async () => {
      await service.verifyEmail(verifyDto);
      expect(createdUserData.role).toBe('consultor');
      expect(createdUserData.estado).toBe(true);
    });

    it('crea el usuario con el email y la contraseña hasheada del registro', async () => {
      await service.verifyEmail(verifyDto);
      expect(createdUserData.email).toBe(mockRecord.email);
      expect(createdUserData.password).toBe(mockRecord.hashedPassword);
    });

    it('llama a save exactamente una vez al crear el usuario', async () => {
      await service.verifyEmail(verifyDto);
      expect(mockUserSave).toHaveBeenCalledTimes(1);
    });

    it('llama a createMany con las notificaciones de bienvenida', async () => {
      await service.verifyEmail(verifyDto);
      expect(mockNotificationService.createMany).toHaveBeenCalledTimes(1);
      const [, notifications] = mockNotificationService.createMany.mock.calls[0];
      expect(notifications).toHaveLength(2);
    });

    it('genera el token jwt después de crear el usuario', async () => {
      await service.verifyEmail(verifyDto);
      expect(mockJwtService.sign).toHaveBeenCalledTimes(1);
    });

    it('no llama a save si el código es incorrecto', async () => {
      await expect(
        service.verifyEmail({ ...verifyDto, code: '000000' }),
      ).rejects.toThrow(BadRequestException);
      expect(mockUserSave).not.toHaveBeenCalled();
    });
  });

  // ─── getAllUsers ──────────────────────────────────────────────────────────────

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

    it('incluye total y page en el meta', async () => {
      mockUserModel.find.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([]),
      });
      mockUserModel.countDocuments.mockResolvedValue(15);

      const result = await service.getAllUsers(2, 5);
      expect(result.meta.total).toBe(15);
      expect(result.meta.page).toBe(2);
    });

    it('maneja errores de base de datos lanzando InternalServerErrorException', async () => {
      mockUserModel.find.mockImplementation(() => {
        throw new Error('DB error');
      });
      await expect(service.getAllUsers(1, 10)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  // ─── updateUserRol ────────────────────────────────────────────────────────────

  describe('updateUserRol', () => {
    const mockUserId = 'abc123';
    const mockRole = 'admin';

    it('actualiza el rol correctamente y retorna mensaje de éxito', async () => {
      const mockUser = { role: '', save: jest.fn().mockResolvedValue({}) };
      mockUserModel.findById.mockResolvedValue(mockUser);

      const result = await service.updateUserRol(mockUserId, mockRole);
      expect(result).toEqual({ message: 'Rol de usuario actualizado correctamente.' });
    });

    it('asigna el nuevo rol al usuario antes de guardar', async () => {
      const mockUser = { role: '', save: jest.fn().mockResolvedValue({}) };
      mockUserModel.findById.mockResolvedValue(mockUser);

      await service.updateUserRol(mockUserId, mockRole);
      expect(mockUser.role).toBe(mockRole);
    });

    it('llama a findById con el id correcto', async () => {
      const mockUser = { role: '', save: jest.fn().mockResolvedValue({}) };
      mockUserModel.findById.mockResolvedValue(mockUser);

      await service.updateUserRol(mockUserId, mockRole);
      expect(mockUserModel.findById).toHaveBeenCalledWith(mockUserId);
    });

    it('llama a save una vez después de actualizar el rol', async () => {
      const mockSaveLocal = jest.fn().mockResolvedValue({});
      const mockUser = { role: '', save: mockSaveLocal };
      mockUserModel.findById.mockResolvedValue(mockUser);

      await service.updateUserRol(mockUserId, mockRole);
      expect(mockSaveLocal).toHaveBeenCalledTimes(1);
    });

    it('lanza InternalServerErrorException si el usuario no existe', async () => {
      mockUserModel.findById.mockResolvedValue(null);
      await expect(service.updateUserRol(mockUserId, mockRole)).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('lanza InternalServerErrorException cuando save falla', async () => {
      const mockUser = {
        role: '',
        save: jest.fn().mockRejectedValue(new Error('DB fail')),
      };
      mockUserModel.findById.mockResolvedValue(mockUser);

      await expect(service.updateUserRol(mockUserId, mockRole)).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('lanza InternalServerErrorException cuando findById falla', async () => {
      mockUserModel.findById.mockRejectedValue(new Error('DB fail'));
      await expect(service.updateUserRol(mockUserId, mockRole)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  // ─── updateProfile ────────────────────────────────────────────────────────────

  describe('updateProfile', () => {
    it('actualiza firstname y lastname correctamente', async () => {
      const mockUser = { firstname: '', lastname: '', save: jest.fn().mockResolvedValue({}) };
      mockUserModel.findById.mockResolvedValue(mockUser);

      const result = await service.updateProfile('abc123', {
        firstname: 'Juan',
        lastname: 'Pérez',
      });

      expect(mockUser.firstname).toBe('Juan');
      expect(mockUser.lastname).toBe('Pérez');
      expect(result).toEqual({ message: 'Perfil actualizado correctamente' });
    });

    it('lanza ConflictException si el usuario no existe', async () => {
      mockUserModel.findById.mockResolvedValue(null);

      await expect(
        service.updateProfile('abc123', { firstname: 'Juan', lastname: 'Pérez' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  // ─── updatePassword ───────────────────────────────────────────────────────────

  describe('updatePassword', () => {
    it('actualiza la contraseña si la actual es correcta', async () => {
      const hashed = bcrypt.hashSync('oldPass', 10);
      const mockUser = { password: hashed, save: jest.fn().mockResolvedValue({}) };
      mockUserModel.findById.mockResolvedValue(mockUser);

      const result = await service.updatePassword('abc123', {
        currentPassword: 'oldPass',
        newPassword: 'newPass123',
      });

      expect(result).toEqual({ message: 'Contraseña actualizada correctamente' });
      const isMatch = await bcrypt.compare('newPass123', mockUser.password);
      expect(isMatch).toBe(true);
    });

    it('lanza ConflictException si el usuario no existe', async () => {
      mockUserModel.findById.mockResolvedValue(null);

      await expect(
        service.updatePassword('abc123', {
          currentPassword: 'old',
          newPassword: 'new',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('lanza BadRequestException si la contraseña actual es incorrecta', async () => {
      const hashed = bcrypt.hashSync('correctPass', 10);
      const mockUser = { password: hashed, save: jest.fn() };
      mockUserModel.findById.mockResolvedValue(mockUser);

      await expect(
        service.updatePassword('abc123', {
          currentPassword: 'wrongPass',
          newPassword: 'newPass123',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});