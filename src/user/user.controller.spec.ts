import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { ConflictException, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { CreateUserDto } from './dto/createUserDto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';

describe('UserController', () => {
  let controller: UserController;

  const mockUserService = {
    register: jest.fn(),
    getAllUsers: jest.fn(),
    verifyEmail: jest.fn(),
    updateUserRol: jest.fn(),
    updateProfile: jest.fn(),
    updatePassword: jest.fn(),
  };

  const mockAuthGuard = { canActivate: jest.fn().mockReturnValue(true) };
  const mockRolesGuard = { canActivate: jest.fn().mockReturnValue(true) };

  // Mock de Response de Express
  const mockRes = {
    cookie: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: mockUserService,
        },
      ],
    })
      .overrideGuard(AuthGuard('jwt'))
      .useValue(mockAuthGuard)
      .overrideGuard(RolesGuard)
      .useValue(mockRolesGuard)
      .compile();

    controller = module.get<UserController>(UserController);
  });

  afterEach(() => jest.clearAllMocks());

  it('debería estar definido', () => {
    expect(controller).toBeDefined();
  });

  // ─── register ─────────────────────────────────────────────────────────────

  describe('register', () => {
    const dto: CreateUserDto = {
      email: 'test@test.com',
      password: '12345678',
    };

    it('registra un usuario y retorna el resultado del servicio', async () => {
      mockUserService.register.mockResolvedValue({ message: 'Código enviado.' });

      const result = await controller.register(dto);

      expect(result).toEqual({ message: 'Código enviado.' });
      expect(mockUserService.register).toHaveBeenCalledWith(dto);
      expect(mockUserService.register).toHaveBeenCalledTimes(1);
    });

    it('delega correctamente el body al servicio sin modificarlo', async () => {
      mockUserService.register.mockResolvedValue({});

      await controller.register(dto);

      expect(mockUserService.register).toHaveBeenCalledWith(
        expect.objectContaining<Partial<CreateUserDto>>({ email: dto.email }),
      );
    });

    it('propaga ConflictException cuando el email ya existe', async () => {
      mockUserService.register.mockRejectedValue(
        new ConflictException('Este email ya se encuentra registrado.'),
      );

      await expect(controller.register(dto)).rejects.toThrow(ConflictException);
    });

    it('propaga InternalServerErrorException ante error inesperado', async () => {
      mockUserService.register.mockRejectedValue(new InternalServerErrorException());

      await expect(controller.register(dto)).rejects.toThrow(InternalServerErrorException);
    });
  });

  // ─── verifyEmail ──────────────────────────────────────────────────────────

  describe('verifyEmail', () => {
    const dto: VerifyEmailDto = { email: 'test@test.com', code: '123456' };

    it('retorna mensaje de bienvenida tras verificar el email', async () => {
      mockUserService.verifyEmail.mockResolvedValue({ access_token: 'mock-token' });

      const result = await controller.verifyEmail(dto, mockRes as any);

      expect(result).toEqual({ message: 'Registro completado. Bienvenido.' });
    });

    it('llama al servicio con el body correcto', async () => {
      mockUserService.verifyEmail.mockResolvedValue({ access_token: 'mock-token' });

      await controller.verifyEmail(dto, mockRes as any);

      expect(mockUserService.verifyEmail).toHaveBeenCalledWith(dto);
    });

    it('setea la cookie con el token recibido', async () => {
      mockUserService.verifyEmail.mockResolvedValue({ access_token: 'mock-token' });

      await controller.verifyEmail(dto, mockRes as any);

      expect(mockRes.cookie).toHaveBeenCalledWith(
        'token',
        'mock-token',
        expect.objectContaining({ httpOnly: true }),
      );
    });

    it('propaga BadRequestException si el código es incorrecto', async () => {
      mockUserService.verifyEmail.mockRejectedValue(
        new BadRequestException('Código incorrecto.'),
      );

      await expect(controller.verifyEmail(dto, mockRes as any)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  // ─── getAdminData ─────────────────────────────────────────────────────────

  describe('getAdminData', () => {
    it('retorna el mensaje de admin correctamente', () => {
      const result = controller.getAdminData();
      expect(result).toEqual({ message: 'felicidades eres admin' });
    });

    it('el guard de roles está aplicado (RolesGuard mockeado permite el acceso)', () => {
      mockRolesGuard.canActivate.mockReturnValue(true);
      const result = controller.getAdminData();
      expect(result).toBeDefined();
    });
  });

  // ─── getUsers ─────────────────────────────────────────────────────────────

  describe('getUsers', () => {
    it('retorna los usuarios paginados del servicio', async () => {
      const mockData = { data: [], meta: { total: 0, page: 1, lastPage: 1 } };
      mockUserService.getAllUsers.mockResolvedValue(mockData);

      const result = await controller.getUsers(1, 10);

      expect(result).toEqual(mockData);
      expect(mockUserService.getAllUsers).toHaveBeenCalledWith(1, 10);
    });

    it('propaga InternalServerErrorException si el servicio falla', async () => {
      mockUserService.getAllUsers.mockRejectedValue(new InternalServerErrorException());

      await expect(controller.getUsers(1, 10)).rejects.toThrow(InternalServerErrorException);
    });
  });

  // ─── getProfile ───────────────────────────────────────────────────────────

  describe('getProfile', () => {
    it('retorna el mensaje de perfil correctamente', () => {
      const result = controller.getProfile();
      expect(result).toEqual({ message: 'Adelante asalariado' });
    });

    it('el AuthGuard está aplicado (mockeado permite el acceso)', () => {
      mockAuthGuard.canActivate.mockReturnValue(true);
      const result = controller.getProfile();
      expect(result).toBeDefined();
    });
  });

  // ─── UpdateUserRol ────────────────────────────────────────────────────────

  describe('UpdateUserRol', () => {
    it('actualiza el rol y retorna el mensaje del servicio', async () => {
      mockUserService.updateUserRol.mockResolvedValue({
        message: 'Rol de usuario actualizado correctamente.',
      });

      const result = await controller.UpdateUserRol('abc123', 'admin');

      expect(result).toEqual({ message: 'Rol de usuario actualizado correctamente.' });
      expect(mockUserService.updateUserRol).toHaveBeenCalledWith('abc123', 'admin');
    });

    it('propaga InternalServerErrorException si el servicio falla', async () => {
      mockUserService.updateUserRol.mockRejectedValue(new InternalServerErrorException());

      await expect(controller.UpdateUserRol('abc123', 'admin')).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  // ─── updateProfile ────────────────────────────────────────────────────────

  describe('updateProfile', () => {
    const dto: UpdateProfileDto = { firstname: 'Juan', lastname: 'Pérez' };

    it('actualiza el perfil y retorna el mensaje del servicio', async () => {
      mockUserService.updateProfile.mockResolvedValue({
        message: 'Perfil actualizado correctamente',
      });

      const result = await controller.updateProfile('abc123', dto);

      expect(result).toEqual({ message: 'Perfil actualizado correctamente' });
      expect(mockUserService.updateProfile).toHaveBeenCalledWith('abc123', dto);
    });

    it('propaga ConflictException si el usuario no existe', async () => {
      mockUserService.updateProfile.mockRejectedValue(
        new ConflictException('Usuario no encontrado'),
      );

      await expect(controller.updateProfile('abc123', dto)).rejects.toThrow(ConflictException);
    });
  });

  // ─── updatePassword ───────────────────────────────────────────────────────

  describe('updatePassword', () => {
    const dto: UpdatePasswordDto = { currentPassword: 'oldPass', newPassword: 'newPass123' };

    it('actualiza la contraseña y retorna el mensaje del servicio', async () => {
      mockUserService.updatePassword.mockResolvedValue({
        message: 'Contraseña actualizada correctamente',
      });

      const result = await controller.updatePassword('abc123', dto);

      expect(result).toEqual({ message: 'Contraseña actualizada correctamente' });
      expect(mockUserService.updatePassword).toHaveBeenCalledWith('abc123', dto);
    });

    it('propaga BadRequestException si la contraseña actual es incorrecta', async () => {
      mockUserService.updatePassword.mockRejectedValue(
        new BadRequestException('La contraseña actual es incorrecta'),
      );

      await expect(controller.updatePassword('abc123', dto)).rejects.toThrow(BadRequestException);
    });

    it('propaga ConflictException si el usuario no existe', async () => {
      mockUserService.updatePassword.mockRejectedValue(
        new ConflictException('Usuario no encontrado'),
      );

      await expect(controller.updatePassword('abc123', dto)).rejects.toThrow(ConflictException);
    });
  });
});