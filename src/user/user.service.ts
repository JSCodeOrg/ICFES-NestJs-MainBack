import { ConflictException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../auth/schemas/user.schema';
import { CreateUserDto } from './dto/createUserDto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<User>,
  ) {}

  async register(userData: CreateUserDto) {
    const exists = await this.userModel.findOne({ email: userData.email });

    if (exists) {
      throw new ConflictException('Este email ya se encuentra registrado.');
    }

    if (!userData.password) {
      throw new ConflictException('La contraseña es requerida.');
    }

    //Encriptación de la contraseña

    const hashedPassword = await bcrypt.hash(userData.password, 10);

    const user = new this.userModel({
      email: userData.email,
      password: hashedPassword, //
      firstname: userData.firstname,
      lastname: userData.lastname,
      role: userData.role || 'consultor',
      estado: true,
    });

    try {
      await user.save();
    } catch (error) {
      throw new InternalServerErrorException(error);
    }

    return {
      message: 'Usuario registrado correctamente.',
    };
  }
}
