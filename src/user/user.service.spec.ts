import { Test } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { ConflictException } from '@nestjs/common';
import { UserService } from './user.service';
import { User } from '../auth/schemas/user.schema';

// Mocks Globales
const mockSave = jest.fn();
const MockUserModel = jest.fn().mockImplementation(() => ({
  save: mockSave,
}));
MockUserModel.findOne = jest.fn();

describe('UserService', () => {
  let service: UserService;

  // Montaje del módulo, normal
  beforeEach(async () => {
    const module = await Test
      .createTestingModule({
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

  // Registro sale bien
  it('debería registrar usuario correctamente', async () => {
    MockUserModel.findOne.mockResolvedValue(null);
    mockSave.mockResolvedValue({});

    const result = await service.register({
      email: 'juan@test.com',
      password: '123456',
      firstname: 'Juan',
      lastname: 'Pérez',
    });

    expect(result).toEqual({
      message: 'Usuario registrado correctamente.'
    });
  });

  // Email ya existee
  it('debería lanzar ConflictException si email existe', async () => {
    MockUserModel.findOne.mockResolvedValue({ email: 'juan@test.com' });

    await expect(
      service.register({
        email: 'juan@test.com',
        password: '123456',
        firstname: 'Juan',
        lastname: 'Pérez',
      })
    ).rejects.toThrow(ConflictException);
  });
});