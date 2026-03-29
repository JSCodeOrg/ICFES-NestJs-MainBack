import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from '../user/user.service';

describe('UserController', () => {
  let controller: UserController;

  const mockUserService = {
    register: jest.fn(),
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
    }).compile();

    controller = module.get<UserController>(UserController);
  });

  it('Debería existir el controlador', () => {
    expect(controller).toBeDefined();
  });

  it('Debería llamar al servicio', async () => {
    const dto = {
      email: 'test@test.com',
      password: '12345678',
      firstname: 'Juan',
      lastname: 'Perez',
      role: 'consultor',
    };

    mockUserService.register.mockResolvedValue({ userId: '123' });

    const result = await controller.register(dto);

    expect(result).toEqual({ userId: '123' });
  });
});
