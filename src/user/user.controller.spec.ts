import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from '../user/user.service';

describe('UserController', () => {
  let controller: UserController;

  const mockUserService = {
    register: jest.fn(),
    getAllUsers: jest.fn(),
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

  it('Debería llamar al servicio de registro', async () => {
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

  it('Debería llamar al servicio de listado de usuarios', async () => {

    const users = {
      "data": [
        {
          "_id": "69d2827ede6c0f81a9b2bbf6",
          "email": "correo@admin.com",
          "firstname": "Manuel Pepito",
          "lastname": "Perez Perez",
          "role": "admin",
          "estado": true,
          "__v": 0
        }
      ],
      "meta": {
        "total": 1,
        "page": 1,
        "lastPage": 1
      }
    }
    mockUserService.getAllUsers.mockResolvedValue(users);
    const result = await controller.getUsers(1, 10);
    expect(result).toEqual(users);
  })
});
