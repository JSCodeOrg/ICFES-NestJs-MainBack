import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UnauthorizedException } from '@nestjs/common';
import { Response } from 'express';
import { LoginDto } from './dto/loginDto';

describe('AuthController', () => {
  let controller: AuthController;

  const mockAuthService = {
    validateUser: jest.fn<Promise<{ id: number } | null>, [string, string]>(),
    login: jest.fn<Promise<{ access_token: string }>, [LoginDto]>(),
    getMe: jest.fn(),
  };

  type MockResponse = Pick<Response, 'cookie'>;

  const createResponse = (): MockResponse => ({
    cookie: jest.fn(),
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get(AuthController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('login correcto', async () => {
    const body: LoginDto = {
      email: 'test@test.com',
      password: '123456',
    };

    const res = createResponse();

    mockAuthService.validateUser.mockResolvedValue({ id: 1 });
    mockAuthService.login.mockResolvedValue({ access_token: 'token123' });

    const result = await controller.login(body, res as unknown as Response);

    expect(mockAuthService.validateUser).toHaveBeenCalledWith(body.email, body.password);

    expect(mockAuthService.login).toHaveBeenCalledWith(body);

    expect(res.cookie).toHaveBeenCalledWith(
      'token',
      'token123',
      expect.objectContaining({
        httpOnly: true,
        sameSite: 'lax',
      }),
    );

    expect(result).toEqual({
      message: 'Entre socio, por la sombrita',
    });
  });

  it('login inválido', async () => {
    const body: LoginDto = {
      email: 'wrong@test.com',
      password: 'wrong',
    };

    const res = createResponse();

    mockAuthService.validateUser.mockResolvedValue(null);

    await expect(controller.login(body, res as unknown as Response)).rejects.toThrow(UnauthorizedException);

    expect(mockAuthService.login).not.toHaveBeenCalled();
    expect(res.cookie).not.toHaveBeenCalled();
  });

  it('debe retornar usuario si el token es válido', async () => {
    const req = {
      cookies: {
        token: 'valid-token',
      },
    } as any;

    const userMock = {
      id: '1',
      email: 'test@test.com',
      role: 'admin',
    };

    mockAuthService.getMe.mockResolvedValue(userMock);

    const result = await controller.checkSession(req);

    expect(mockAuthService.getMe).toHaveBeenCalledWith('valid-token');
    expect(result).toEqual(userMock);
  });

  it('debe lanzar UnauthorizedException si no hay token', async () => {
    const req = {
      cookies: {},
    } as any;

    await expect(controller.checkSession(req)).rejects.toThrow(
      UnauthorizedException,
    );

    expect(mockAuthService.getMe).not.toHaveBeenCalled();
  });

  it('debe lanzar UnauthorizedException si cookies no existen', async () => {
    const req = {} as any;

    await expect(controller.checkSession(req)).rejects.toThrow(
      UnauthorizedException,
    );
  });
});
