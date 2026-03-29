import { Test } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

import { UserService } from './user.service';
import { User } from '../auth/schemas/user.schema';

/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */

let createdUserData: any;

const mockSave = jest.fn();

const MockUserModel = jest.fn().mockImplementation((data) => {
  createdUserData = data;
  return {
    save: mockSave,
  };
});

(MockUserModel as any).findOne = jest.fn();

describe('UserService', () => {
  let service: UserService;

  // Montaje del módulo, normal
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

  // Registro sale bien
  it('debería registrar usuario correctamente con contraseña encriptada', async () => {
    (MockUserModel as any).findOne.mockResolvedValue(null);
    mockSave.mockResolvedValue({});

    const passwordPlano = '123456';

    const result = await service.register({
      email: 'juan@test.com',
      password: passwordPlano,
      firstname: 'Juan',
      lastname: 'Pérez',
      role: 'consultor',
    });

    expect(result).toEqual({
      message: 'Usuario registrado correctamente.',
    });

    expect(createdUserData.password).not.toBe(passwordPlano);

    const isMatch = await bcrypt.compare(passwordPlano, createdUserData.password);

    expect(isMatch).toBe(true);
  });

  // Email ya existee
  it('debería lanzar ConflictException si email existe', async () => {
    (MockUserModel as any).findOne.mockResolvedValue({ email: 'juan@test.com' });

    await expect(
      service.register({
        email: 'juan@test.com',
        password: '123456',
        firstname: 'Juan',
        lastname: 'Pérez',
        role: 'consultor',
      }),
    ).rejects.toThrow(ConflictException);
  });
});
