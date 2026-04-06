import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { ConflictException, InternalServerErrorException } from '@nestjs/common';
import { CreateUserDto } from './dto/createUserDto';

// ── Interfaces ────────────────────────────────────────────────────────────────

interface RegisterResponse {
  userId: string;
}

// ─────────────────────────────────────────────────────────────────────────────

describe('UserController', () => {
  let controller: UserController;

  const mockUserService = {
    register: jest.fn(),
    getAllUsers: jest.fn(),
  };

  // Guards mockeados para que siempre permitan el paso
  const mockAuthGuard = { canActivate: jest.fn().mockReturnValue(true) };
  const mockRolesGuard = { canActivate: jest.fn().mockReturnValue(true) };

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
      firstname: 'Juan',
      lastname: 'Perez',
      role: 'consultor',
    };

    it('registra un usuario y retorna el resultado del servicio', async () => {
      const response: RegisterResponse = { userId: '123' };
      mockUserService.register.mockResolvedValue(response);

      const result = await controller.register(dto);

      expect(result).toEqual(response);
      expect(mockUserService.register).toHaveBeenCalledWith(dto);
      expect(mockUserService.register).toHaveBeenCalledTimes(1);
    });

    it('delega correctamente el body al servicio sin modificarlo', async () => {
      mockUserService.register.mockResolvedValue({ userId: 'abc' });

      await controller.register(dto);

      expect(mockUserService.register).toHaveBeenCalledWith(
        expect.objectContaining<Partial<CreateUserDto>>({
          email: dto.email,
          firstname: dto.firstname,
          lastname: dto.lastname,
          role: dto.role,
        }),
      );
    });

    it('propaga ConflictException cuando el email ya existe', async () => {
      mockUserService.register.mockRejectedValue(new ConflictException('Este email ya se encuentra registrado.'));

      await expect(controller.register(dto)).rejects.toThrow(ConflictException);
    });

    it('propaga InternalServerErrorException ante error inesperado', async () => {
      mockUserService.register.mockRejectedValue(new InternalServerErrorException());

      await expect(controller.register(dto)).rejects.toThrow(InternalServerErrorException);
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
});
